import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
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
  ) {}

  async findOrCreateDirectConversation(
    senderId: string,
    dto: CreateDirectConversationDto,
    token: string,
  ): Promise<ResponseConversationDto> {
    if (senderId === dto.recipientId) {
      throw new BadRequestException(
        'Cannot start a conversation with yourself',
      );
    }

    await this.securityUserClient.getUserById(dto.recipientId, token);

    const existing = await this.findDirectConversationBetween(
      senderId,
      dto.recipientId,
    );

    if (existing) {
      return this.toResponse(existing);
    }

    const conversation = this.conversationRepository.create({
      type: ConversationType.DIRECT,
    });
    const savedConversation =
      await this.conversationRepository.save(conversation);

    const members = [
      this.conversationMemberRepository.create({
        conversationId: savedConversation.id,
        userId: senderId,
      }),
      this.conversationMemberRepository.create({
        conversationId: savedConversation.id,
        userId: dto.recipientId,
      }),
    ];
    await this.conversationMemberRepository.save(members);

    return this.toResponse({
      ...savedConversation,
      members,
    });
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
    const result = await this.conversationRepository
      .createQueryBuilder('conversation')
      .innerJoin('conversation.members', 'memberA')
      .innerJoin('conversation.members', 'memberB')
      .where('conversation.type = :type', { type: ConversationType.DIRECT })
      .andWhere('memberA.userId = :userA', { userA })
      .andWhere('memberB.userId = :userB', { userB })
      .leftJoinAndSelect('conversation.members', 'members')
      .getOne();

    return result;
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
