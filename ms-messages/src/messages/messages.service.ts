import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { IsNull, Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { MessageReadReceipt } from './entities/message-read-receipt.entity';
import { CreateDirectMessageDto } from './dto/create-direct-message.dto';
import { CreateGroupMessageDto } from './dto/create-group-message.dto';
import { ResponseMessageDto } from './dto/response-message.dto';
import { ResponseMessageListDto } from './dto/response-message-list.dto';
import { ResponseGroupMessageListDto } from './dto/response-group-message-list.dto';
import {
  MessageReadReceiptDto,
  ResponseMessageReadsDto,
} from './dto/response-message-reads.dto';
import { MessageType } from './enums/message-type.enum';
import { ConversationsService } from '@/conversations/conversations.service';
import { RealtimeEmitterService } from '@/realtime/services/realtime-emitter.service';
import { GroupsService } from '@/groups/groups.service';
import { Group } from '@/groups/entities/group.entity';
import { GroupMemberRole } from '@/groups/enums/group-member-role.enum';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import { PaginationMetaDto } from '@/shared/dto/pagination-meta.dto';

interface GroupContext {
  groupId: string;
  groupName: string;
  memberCount: number;
}

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(MessageReadReceipt)
    private readonly readReceiptRepository: Repository<MessageReadReceipt>,
    private readonly conversationsService: ConversationsService,
    private readonly groupsService: GroupsService,
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
    const response = this.toResponseDto(saved, senderId, {
      messageType: MessageType.DIRECT,
    });

    this.realtimeEmitter.emitNewMessage(dto.recipientId, response);

    return response;
  }

  async sendGroupMessage(
    senderId: string,
    dto: CreateGroupMessageDto,
  ): Promise<ResponseGroupMessageListDto> {
    const uniqueGroupIds = [...new Set(dto.groupIds)];
    const items: ResponseMessageDto[] = [];

    for (const groupId of uniqueGroupIds) {
      const group = await this.groupsService.getGroupForMember(
        groupId,
        senderId,
      );

      const message = this.messageRepository.create({
        conversationId: group.conversationId,
        senderId,
        body: dto.body,
        latitude: dto.latitude !== undefined ? String(dto.latitude) : undefined,
        longitude:
          dto.longitude !== undefined ? String(dto.longitude) : undefined,
      });

      const saved = await this.messageRepository.save(message);
      const response = this.toResponseDto(saved, senderId, {
        messageType: MessageType.GROUP,
        groupId: group.id,
        groupName: group.name,
        memberCount: group.members?.length ?? 0,
      });

      const recipients = this.groupsService
        .getMemberUserIds(group)
        .filter((id) => id !== senderId);

      for (const recipientId of recipients) {
        this.realtimeEmitter.emitNewMessage(recipientId, response);
      }

      items.push(response);
    }

    return { items };
  }

  async findGroupMessages(
    groupId: string,
    userId: string,
    pagination: PaginationQueryDto,
  ): Promise<ResponseMessageListDto> {
    const group = await this.groupsService.getGroupForMember(groupId, userId);
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const skip = (page - 1) * limit;

    const [messages, totalItems] = await this.messageRepository.findAndCount({
      where: {
        conversationId: group.conversationId,
        deletedAt: IsNull(),
      },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
      relations: ['readReceipts'],
    });

    const groupContext: GroupContext = {
      groupId: group.id,
      groupName: group.name,
      memberCount: group.members?.length ?? 0,
    };

    const items = messages.map((message) =>
      this.toResponseDto(message, userId, {
        messageType: MessageType.GROUP,
        ...groupContext,
      }),
    );

    return this.toListDto(items, page, limit, totalItems);
  }

  async findSentMessages(
    userId: string,
    pagination: PaginationQueryDto,
  ): Promise<ResponseMessageListDto> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const skip = (page - 1) * limit;

    const [messages, totalItems] = await this.messageRepository.findAndCount({
      where: { senderId: userId, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
      relations: ['readReceipts'],
    });

    const items = await this.enrichMessages(messages, userId);

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
      .andWhere('message.deletedAt IS NULL')
      .leftJoinAndSelect('message.readReceipts', 'readReceipts')
      .orderBy('message.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [messages, totalItems] = await qb.getManyAndCount();
    const items = await this.enrichMessages(messages, userId);

    return this.toListDto(items, page, limit, totalItems);
  }

  async getMessageReads(
    messageId: string,
    userId: string,
  ): Promise<ResponseMessageReadsDto> {
    const message = await this.getActiveMessage(messageId);
    const group = await this.groupsService.findByConversationId(
      message.conversationId,
    );

    if (!group) {
      throw new NotFoundException('Este mensaje no pertenece a un grupo');
    }

    await this.groupsService.getGroupForMember(group.id, userId);

    const isSender = message.senderId === userId;
    const isAdmin = (group.members ?? []).some(
      (member) =>
        member.userId === userId && member.role === GroupMemberRole.ADMIN,
    );

    if (!isSender && !isAdmin) {
      throw new ForbiddenException(
        'Solo el remitente o un administrador pueden ver las lecturas',
      );
    }

    const receipts = await this.readReceiptRepository.find({
      where: { messageId },
      order: { readAt: 'ASC' },
    });

    const memberIds = new Set(this.groupsService.getMemberUserIds(group));
    const readBy = receipts
      .filter((receipt) => memberIds.has(receipt.userId))
      .map((receipt) =>
        plainToInstance(MessageReadReceiptDto, {
          userId: receipt.userId,
          readAt: receipt.readAt,
        }),
      );

    return plainToInstance(ResponseMessageReadsDto, {
      messageId: message.id,
      conversationId: message.conversationId,
      groupId: group.id,
      groupName: group.name,
      readBy,
      totalMembers: group.members?.length ?? 0,
      readCount: readBy.length,
    });
  }

  async markAsRead(
    messageId: string,
    userId: string,
  ): Promise<ResponseMessageDto> {
    const message = await this.getActiveMessage(messageId, ['readReceipts']);

    await this.conversationsService.assertMember(
      message.conversationId,
      userId,
    );

    if (message.senderId === userId) {
      throw new ForbiddenException('Sender cannot mark own message as read');
    }

    const group = await this.groupsService.findByConversationId(
      message.conversationId,
    );

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

      if (group) {
        const notifyIds = new Set<string>([message.senderId]);
        for (const member of group.members ?? []) {
          if (member.role === GroupMemberRole.ADMIN) {
            notifyIds.add(member.userId);
          }
        }

        this.realtimeEmitter.emitGroupMessageRead([...notifyIds], {
          messageId,
          conversationId: message.conversationId,
          groupId: group.id,
          userId,
          readAt: receipt.readAt,
        });
      } else {
        this.realtimeEmitter.emitMessageRead(message.senderId, {
          messageId,
          conversationId: message.conversationId,
          readAt: receipt.readAt,
        });
      }
    }

    return this.toResponseDto(
      message,
      userId,
      group
        ? {
            messageType: MessageType.GROUP,
            groupId: group.id,
            groupName: group.name,
            memberCount: group.members?.length ?? 0,
          }
        : { messageType: MessageType.DIRECT },
    );
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await this.getActiveMessage(messageId);
    const group = await this.groupsService.findByConversationId(
      message.conversationId,
    );

    if (!group) {
      throw new ForbiddenException(
        'Solo se pueden eliminar mensajes de grupos',
      );
    }

    this.groupsService.assertGroupAdmin(group, userId);

    message.deletedAt = new Date();
    await this.messageRepository.save(message);

    const memberIds = this.groupsService.getMemberUserIds(group);
    this.realtimeEmitter.emitMessageDeleted(memberIds, {
      messageId: message.id,
      conversationId: message.conversationId,
      groupId: group.id,
    });
  }

  private async getActiveMessage(
    messageId: string,
    relations: string[] = [],
  ): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId, deletedAt: IsNull() },
      relations,
    });

    if (!message) {
      throw new NotFoundException(`Message ${messageId} not found`);
    }

    return message;
  }

  private async enrichMessages(
    messages: Message[],
    viewerId: string,
  ): Promise<ResponseMessageDto[]> {
    const conversationIds = [
      ...new Set(messages.map((message) => message.conversationId)),
    ];
    const groupByConversation = new Map<string, Group>();

    await Promise.all(
      conversationIds.map(async (conversationId) => {
        const group =
          await this.groupsService.findByConversationId(conversationId);
        if (group) {
          groupByConversation.set(conversationId, group);
        }
      }),
    );

    return messages.map((message) => {
      const group = groupByConversation.get(message.conversationId);
      if (group) {
        return this.toResponseDto(message, viewerId, {
          messageType: MessageType.GROUP,
          groupId: group.id,
          groupName: group.name,
          memberCount: group.members?.length ?? 0,
        });
      }

      return this.toResponseDto(message, viewerId, {
        messageType: MessageType.DIRECT,
      });
    });
  }

  private toResponseDto(
    message: Message,
    viewerId: string,
    context: {
      messageType: MessageType;
      groupId?: string;
      groupName?: string;
      memberCount?: number;
    },
  ): ResponseMessageDto {
    const isGroup = context.messageType === MessageType.GROUP;
    const receipts = message.readReceipts ?? [];

    const viewerReceipt = receipts.find(
      (receipt) => receipt.userId === viewerId,
    );

    let isRead = false;
    let readAt: Date | undefined;
    let readCount: number | undefined;
    let totalRecipients: number | undefined;

    if (isGroup) {
      const memberCount = context.memberCount ?? 0;
      totalRecipients = Math.max(memberCount - 1, 0);
      readCount = receipts.length;

      if (message.senderId === viewerId) {
        isRead = readCount > 0;
      } else {
        isRead = Boolean(viewerReceipt);
        readAt = viewerReceipt?.readAt;
      }
    } else {
      const recipientReceipt = receipts.find(
        (receipt) => receipt.userId !== message.senderId,
      );

      isRead =
        message.senderId === viewerId
          ? Boolean(recipientReceipt)
          : Boolean(viewerReceipt);

      readAt =
        message.senderId === viewerId
          ? recipientReceipt?.readAt
          : viewerReceipt?.readAt;
    }

    return plainToInstance(ResponseMessageDto, {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      messageType: context.messageType,
      groupId: context.groupId,
      groupName: context.groupName,
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
      readCount,
      totalRecipients,
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
