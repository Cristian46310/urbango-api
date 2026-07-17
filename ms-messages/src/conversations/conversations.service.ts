import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { ConversationMember } from './entities/conversation-member.entity';
import { ConversationType } from './enums/conversation-type.enum';
import { CreateDirectConversationDto } from './dto/create-direct-conversation.dto';
import { ResponseConversationDto } from './dto/response-conversation.dto';
import { SecurityUserClientService } from '@/users/services/security-user-client.service';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(ConversationMember)
    private readonly conversationMemberRepository: Repository<ConversationMember>,
    private readonly securityUserClient: SecurityUserClientService,
    private readonly dataSource: DataSource,
  ) {}

  static buildDirectPairKey(userA: string, userB: string): string {
    return userA < userB ? `${userA}:${userB}` : `${userB}:${userA}`;
  }

  async findOrCreateDirectConversation(
    senderId: string,
    dto: CreateDirectConversationDto,
  ): Promise<ResponseConversationDto> {
    if (senderId === dto.recipientId) {
      throw new BadRequestException(
        'Cannot start a conversation with yourself',
      );
    }

    await this.securityUserClient.getUserById(dto.recipientId);

    const pairKey = ConversationsService.buildDirectPairKey(
      senderId,
      dto.recipientId,
    );

    const existing = await this.findDirectConversationBetween(
      senderId,
      dto.recipientId,
    );

    if (existing) {
      return this.toResponse(existing);
    }

    try {
      return await this.dataSource.transaction(async (manager) => {
        const conversation = manager.create(Conversation, {
          type: ConversationType.DIRECT,
          directPairKey: pairKey,
        });
        const savedConversation = await manager.save(conversation);

        const members = [
          manager.create(ConversationMember, {
            conversationId: savedConversation.id,
            userId: senderId,
          }),
          manager.create(ConversationMember, {
            conversationId: savedConversation.id,
            userId: dto.recipientId,
          }),
        ];
        await manager.save(members);

        return this.toResponse({
          ...savedConversation,
          members,
        });
      });
    } catch (error) {
      // Concurrent create: unique on direct_pair_key — return the winner
      const raced = await this.findDirectConversationBetween(
        senderId,
        dto.recipientId,
      );
      if (raced) {
        return this.toResponse(raced);
      }
      throw error;
    }
  }

  async getConversationIdsForUser(userId: string): Promise<string[]> {
    const members = await this.conversationMemberRepository.find({
      where: { userId },
      select: ['conversationId'],
    });

    return members.map((member) => member.conversationId);
  }

  async assertMember(conversationId: string, userId: string): Promise<void> {
    const member = await this.conversationMemberRepository.findOne({
      where: { conversationId, userId },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this conversation');
    }
  }

  async getOtherMemberId(
    conversationId: string,
    userId: string,
  ): Promise<string> {
    const members = await this.conversationMemberRepository.find({
      where: { conversationId },
    });

    const other = members.find((member) => member.userId !== userId);
    if (!other) {
      throw new NotFoundException('Conversation recipient not found');
    }

    return other.userId;
  }

  private async findDirectConversationBetween(
    userA: string,
    userB: string,
  ): Promise<Conversation | null> {
    const pairKey = ConversationsService.buildDirectPairKey(userA, userB);
    const byKey = await this.conversationRepository.findOne({
      where: { type: ConversationType.DIRECT, directPairKey: pairKey },
      relations: ['members'],
    });
    if (byKey) {
      return byKey;
    }

    return this.conversationRepository
      .createQueryBuilder('conversation')
      .innerJoin('conversation.members', 'memberA')
      .innerJoin('conversation.members', 'memberB')
      .where('conversation.type = :type', { type: ConversationType.DIRECT })
      .andWhere('memberA.userId = :userA', { userA })
      .andWhere('memberB.userId = :userB', { userB })
      .leftJoinAndSelect('conversation.members', 'members')
      .getOne();
  }

  private toResponse(conversation: Conversation): ResponseConversationDto {
    return plainToInstance(ResponseConversationDto, {
      id: conversation.id,
      type: conversation.type,
      memberIds: (conversation.members ?? []).map((member) => member.userId),
      createdAt: conversation.createdAt,
    });
  }
}
