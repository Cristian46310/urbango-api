import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import {
  IsNull,
  LessThanOrEqual,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
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
import { InboxQueryDto } from '@/inbox/dto/inbox-query.dto';
import { SecurityUserClientService } from '@/users/services/security-user-client.service';
import { ResponseUserSummaryDto } from '@/users/dto/response-user-summary.dto';

const PREVIEW_MAX_LENGTH = 120;

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
    private readonly securityUserClient: SecurityUserClientService,
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

    await this.realtimeEmitter.joinUsersToConversation(
      conversation.memberIds,
      conversation.id,
    );
    this.realtimeEmitter.emitNewMessage(response);

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

      this.realtimeEmitter.emitNewMessage(response);

      items.push(response);
    }

    return { items };
  }

  async findGroupMessages(
    groupId: string,
    userId: string,
    pagination: PaginationQueryDto,
    token?: string,
  ): Promise<ResponseMessageListDto> {
    const membership = await this.groupsService.getMembershipForHistory(
      groupId,
      userId,
    );

    if (!membership) {
      throw new ForbiddenException(
        'No tienes acceso al historial de este grupo',
      );
    }

    const group = await this.groupsService.findGroupById(groupId);
    if (!group) {
      throw new NotFoundException(`Group ${groupId} not found`);
    }

    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const skip = (page - 1) * limit;

    const isFormerMember = membership.leftAt != null;

    const [messages, totalItems] = await this.messageRepository.findAndCount({
      where: {
        conversationId: group.conversationId,
        deletedAt: IsNull(),
        ...(isFormerMember
          ? { createdAt: LessThanOrEqual(membership.leftAt!) }
          : {}),
      },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
      relations: ['readReceipts'],
    });

    const activeMembers = (group.members ?? []).filter((m) => m.leftAt == null);

    const items = await this.enrichMessages(messages, userId, token, {
      messageType: MessageType.GROUP,
      groupId: group.id,
      groupName: group.name,
      memberCount: activeMembers.length,
    });

    return this.toListDto(items, page, limit, totalItems);
  }

  async findConversationMessages(
    conversationId: string,
    userId: string,
    pagination: PaginationQueryDto,
    token?: string,
  ): Promise<ResponseMessageListDto> {
    await this.conversationsService.assertMember(conversationId, userId);

    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const skip = (page - 1) * limit;

    const [messages, totalItems] = await this.messageRepository.findAndCount({
      where: {
        conversationId,
        deletedAt: IsNull(),
      },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
      relations: ['readReceipts'],
    });

    const items = await this.enrichMessages(messages, userId, token);

    return this.toListDto(items, page, limit, totalItems);
  }

  async findSentMessages(
    userId: string,
    pagination: PaginationQueryDto,
    token?: string,
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

    const items = await this.enrichMessages(messages, userId, token);

    return this.toListDto(items, page, limit, totalItems);
  }

  async findInboxMessages(
    userId: string,
    query: InboxQueryDto,
    token?: string,
  ): Promise<ResponseMessageListDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const qb = this.buildInboxQueryBuilder(userId);

    this.applyInboxFilters(qb, userId, query);

    qb.orderBy('message.createdAt', 'DESC').skip(skip).take(limit);

    const [messages, totalItems] = await qb.getManyAndCount();
    const items = await this.enrichMessages(messages, userId, token);

    return this.toListDto(items, page, limit, totalItems);
  }

  async countUnreadInboxMessages(userId: string): Promise<number> {
    const qb = this.buildInboxQueryBuilder(userId);

    qb.andWhere(
      `NOT EXISTS (
        SELECT 1 FROM message_read_receipts rr
        WHERE rr.message_id = message.id AND rr.user_id = :userId
      )`,
    );

    return qb.getCount();
  }

  async getMessageById(
    messageId: string,
    userId: string,
    token?: string,
  ): Promise<ResponseMessageDto> {
    const message = await this.getActiveMessage(messageId, ['readReceipts']);

    await this.conversationsService.assertMember(
      message.conversationId,
      userId,
    );

    if (message.senderId !== userId) {
      const existing = await this.readReceiptRepository.findOne({
        where: { messageId, userId },
      });

      if (!existing) {
        return this.markAsRead(messageId, userId, token);
      }
    }

    const [response] = await this.enrichMessages([message], userId, token);
    return response;
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
    token?: string,
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
        this.realtimeEmitter.emitMessageRead({
          messageId,
          conversationId: message.conversationId,
          groupId: group.id,
          userId,
          readAt: receipt.readAt,
        });
      } else {
        this.realtimeEmitter.emitMessageRead({
          messageId,
          conversationId: message.conversationId,
          userId,
          readAt: receipt.readAt,
        });
      }
    }

    const context = group
      ? {
          messageType: MessageType.GROUP,
          groupId: group.id,
          groupName: group.name,
          memberCount: group.members?.length ?? 0,
        }
      : { messageType: MessageType.DIRECT };

    const [response] = await this.enrichMessages(
      [message],
      userId,
      token,
      context,
    );

    return response;
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

    this.realtimeEmitter.emitMessageDeleted({
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

  private buildInboxQueryBuilder(userId: string) {
    return this.messageRepository
      .createQueryBuilder('message')
      .innerJoin('message.conversation', 'conversation')
      .innerJoin('conversation.members', 'member')
      .where('member.userId = :userId', { userId })
      .andWhere('message.senderId != :userId', { userId })
      .andWhere('message.deletedAt IS NULL')
      .leftJoinAndSelect('message.readReceipts', 'readReceipts');
  }

  private applyInboxFilters(
    qb: SelectQueryBuilder<Message>,
    userId: string,
    query: InboxQueryDto,
  ): void {
    if (query.unreadOnly) {
      qb.andWhere(
        `NOT EXISTS (
          SELECT 1 FROM message_read_receipts rr
          WHERE rr.message_id = message.id AND rr.user_id = :userId
        )`,
      );
    }

    if (query.fromDate) {
      qb.andWhere('message.createdAt >= :fromDate', {
        fromDate: query.fromDate,
      });
    }

    if (query.toDate) {
      qb.andWhere('message.createdAt <= :toDate', {
        toDate: query.toDate,
      });
    }

    if (query.messageType === MessageType.DIRECT) {
      qb.andWhere(
        `NOT EXISTS (
          SELECT 1 FROM groups g WHERE g.conversation_id = conversation.id
        )`,
      );
    } else if (query.messageType === MessageType.GROUP) {
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM groups g WHERE g.conversation_id = conversation.id
        )`,
      );
    }
  }

  private async enrichMessages(
    messages: Message[],
    viewerId: string,
    token?: string,
    fixedContext?: {
      messageType: MessageType;
      groupId?: string;
      groupName?: string;
      memberCount?: number;
    },
  ): Promise<ResponseMessageDto[]> {
    const groupByConversation = new Map<string, Group>();

    if (!fixedContext) {
      const conversationIds = [
        ...new Set(messages.map((message) => message.conversationId)),
      ];

      await Promise.all(
        conversationIds.map(async (conversationId) => {
          const group =
            await this.groupsService.findByConversationId(conversationId);
          if (group) {
            groupByConversation.set(conversationId, group);
          }
        }),
      );
    }

    const items = messages.map((message) => {
      if (fixedContext) {
        return this.toResponseDto(message, viewerId, fixedContext);
      }

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

    if (!token) {
      return items;
    }

    const senderIds = [...new Set(messages.map((message) => message.senderId))];
    const senders = await this.resolveSenders(senderIds, token);

    return items.map((item) => {
      const sender = senders.get(item.senderId);
      if (!sender) {
        return item;
      }

      return plainToInstance(ResponseMessageDto, {
        ...item,
        senderName: sender.name,
        senderEmail: sender.email,
      });
    });
  }

  private async resolveSenders(
    senderIds: string[],
    token: string,
  ): Promise<Map<string, ResponseUserSummaryDto>> {
    const result = new Map<string, ResponseUserSummaryDto>();

    await Promise.all(
      senderIds.map(async (senderId) => {
        try {
          const user = await this.securityUserClient.getUserById(
            senderId,
            token,
          );
          result.set(senderId, user);
        } catch {
          // omit sender info when lookup fails
        }
      }),
    );

    return result;
  }

  private buildPreview(body: string): string {
    if (body.length <= PREVIEW_MAX_LENGTH) {
      return body;
    }

    return `${body.slice(0, PREVIEW_MAX_LENGTH)}...`;
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
      preview: this.buildPreview(message.body),
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
