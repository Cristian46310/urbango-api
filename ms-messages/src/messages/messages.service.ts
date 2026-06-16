import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { MessageReadReceipt } from './entities/message-read-receipt.entity';
import { CreateDirectMessageDto } from './dto/create-direct-message.dto';
import { ResponseMessageDto } from './dto/response-message.dto';
import { ResponseMessageListDto } from './dto/response-message-list.dto';
import { ConversationsService } from '@/conversations/conversations.service';
import { RealtimeEmitterService } from '@/realtime/services/realtime-emitter.service';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import { PaginationMetaDto } from '@/shared/dto/pagination-meta.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(MessageReadReceipt)
    private readonly readReceiptRepository: Repository<MessageReadReceipt>,
    private readonly conversationsService: ConversationsService,
    private readonly realtimeEmitter: RealtimeEmitterService,
  ) {}

  async sendDirectMessage(
    senderId: string,
    dto: CreateDirectMessageDto,
    token: string,
  ): Promise<ResponseMessageDto> {
    const conversation =
      await this.conversationsService.findOrCreateDirectConversation(
        senderId,
        { recipientId: dto.recipientId },
        token,
      );

    const message = this.messageRepository.create({
      conversationId: conversation.id,
      senderId,
      body: dto.body,
      latitude: dto.latitude !== undefined ? String(dto.latitude) : undefined,
      longitude:
        dto.longitude !== undefined ? String(dto.longitude) : undefined,
    });

    const saved = await this.messageRepository.save(message);
    const response = this.toResponseDto(saved, senderId);

    this.realtimeEmitter.emitNewMessage(dto.recipientId, response);

    return response;
  }

  async findSentMessages(
    userId: string,
    pagination: PaginationQueryDto,
  ): Promise<ResponseMessageListDto> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const skip = (page - 1) * limit;

    const [messages, totalItems] = await this.messageRepository.findAndCount({
      where: { senderId: userId },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
      relations: ['readReceipts'],
    });

    const items = messages.map((message) =>
      this.toResponseDto(message, userId),
    );

    return this.toListDto(items, page, limit, totalItems);
  }

  async findInboxMessages(
    userId: string,
    pagination: PaginationQueryDto,
  ): Promise<ResponseMessageListDto> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const skip = (page - 1) * limit;

    const qb = this.messageRepository
      .createQueryBuilder('message')
      .innerJoin('message.conversation', 'conversation')
      .innerJoin('conversation.members', 'member')
      .where('member.userId = :userId', { userId })
      .andWhere('message.senderId != :userId', { userId })
      .leftJoinAndSelect('message.readReceipts', 'readReceipts')
      .orderBy('message.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [messages, totalItems] = await qb.getManyAndCount();
    const items = messages.map((message) =>
      this.toResponseDto(message, userId),
    );

    return this.toListDto(items, page, limit, totalItems);
  }

  async markAsRead(
    messageId: string,
    userId: string,
  ): Promise<ResponseMessageDto> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['readReceipts'],
    });

    if (!message) {
      throw new NotFoundException(`Message ${messageId} not found`);
    }

    await this.conversationsService.assertMember(
      message.conversationId,
      userId,
    );

    if (message.senderId === userId) {
      throw new ForbiddenException('Sender cannot mark own message as read');
    }

    const existing = await this.readReceiptRepository.findOne({
      where: { messageId, userId },
    });

    if (!existing) {
      const receipt = this.readReceiptRepository.create({
        messageId,
        userId,
      });
      await this.readReceiptRepository.save(receipt);
      message.readReceipts = [...(message.readReceipts ?? []), receipt];

      this.realtimeEmitter.emitMessageRead(message.senderId, {
        messageId,
        conversationId: message.conversationId,
        readAt: receipt.readAt,
      });
    }

    return this.toResponseDto(message, userId);
  }

  private toResponseDto(
    message: Message,
    viewerId: string,
  ): ResponseMessageDto {
    const recipientReceipt = (message.readReceipts ?? []).find(
      (receipt) => receipt.userId !== message.senderId,
    );

    const viewerReceipt = (message.readReceipts ?? []).find(
      (receipt) => receipt.userId === viewerId,
    );

    const isRead =
      message.senderId === viewerId
        ? Boolean(recipientReceipt)
        : Boolean(viewerReceipt);

    const readAt =
      message.senderId === viewerId
        ? recipientReceipt?.readAt
        : viewerReceipt?.readAt;

    return plainToInstance(ResponseMessageDto, {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      body: message.body,
      latitude:
        message.latitude !== null && message.latitude !== undefined
          ? Number(message.latitude)
          : undefined,
      longitude:
        message.longitude !== null && message.longitude !== undefined
          ? Number(message.longitude)
          : undefined,
      createdAt: message.createdAt,
      isRead,
      readAt,
    });
  }

  private toListDto(
    items: ResponseMessageDto[],
    page: number,
    limit: number,
    totalItems: number,
  ): ResponseMessageListDto {
    const totalPages = Math.ceil(totalItems / limit) || 0;

    return {
      items,
      meta: plainToInstance(PaginationMetaDto, {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      }),
    };
  }
}
