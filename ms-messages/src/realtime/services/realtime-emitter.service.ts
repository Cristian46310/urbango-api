import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { ChatEvent } from '../chat-events.enum';
import { ResponseMessageDto } from '@/messages/dto/response-message.dto';
import { GroupMemberRole } from '@/groups/enums/group-member-role.enum';
import type { ChatRealtimePort } from '../chat-realtime.port';
import { CHAT_REALTIME_PORT } from '../chat-realtime.token';
import type { ResponseUserAlertDto } from '@/mass-alerts/dto/response-user-alert.dto';

export interface GroupMemberAddedPayload {
  groupId: string;
  groupName: string;
  conversationId: string;
  role: GroupMemberRole;
  welcomeMessage?: string;
}

export interface GroupMemberRemovedPayload {
  groupId: string;
  groupName: string;
  conversationId: string;
  reason?: string;
}

export interface GroupMemberPromotedPayload {
  groupId: string;
  groupName: string;
  conversationId: string;
  role: GroupMemberRole;
}

export interface GroupMemberLeftPayload {
  groupId: string;
  groupName: string;
  conversationId: string;
  userId: string;
}

export interface MessageReadPayload {
  messageId: string;
  conversationId: string;
  userId: string;
  readAt: Date;
  groupId?: string;
}

export interface MessageDeletedPayload {
  messageId: string;
  conversationId: string;
  groupId?: string;
}

@Injectable()
export class RealtimeEmitterService {
  private readonly logger = new Logger(RealtimeEmitterService.name);

  constructor(
    @Optional()
    @Inject(CHAT_REALTIME_PORT)
    private readonly gateway?: ChatRealtimePort,
  ) {}

  private requireGateway(): ChatRealtimePort | undefined {
    if (!this.gateway) {
      this.logger.warn('Realtime emit skipped: ChatGateway not available');
      return undefined;
    }
    return this.gateway;
  }

  /** Notifica a todos los miembros conectados de la conversación (sin fetch). */
  emitNewMessage(message: ResponseMessageDto): void {
    this.requireGateway()?.emitToConversation(
      message.conversationId,
      ChatEvent.MESSAGE_NEW,
      message,
    );
  }

  emitMessageRead(payload: MessageReadPayload): void {
    this.requireGateway()?.emitToConversation(
      payload.conversationId,
      ChatEvent.MESSAGE_READ,
      payload,
    );
  }

  emitMessageDeleted(payload: MessageDeletedPayload): void {
    this.requireGateway()?.emitToConversation(
      payload.conversationId,
      ChatEvent.MESSAGE_DELETED,
      payload,
    );
  }

  emitGroupMemberAdded(userId: string, payload: GroupMemberAddedPayload): void {
    this.requireGateway()?.emitToUser(
      userId,
      ChatEvent.GROUP_MEMBER_ADDED,
      payload,
    );
  }

  emitGroupMemberLeft(
    adminUserId: string,
    payload: GroupMemberLeftPayload,
  ): void {
    this.requireGateway()?.emitToUser(
      adminUserId,
      ChatEvent.GROUP_MEMBER_LEFT,
      payload,
    );
  }

  emitGroupMemberRemoved(
    userId: string,
    payload: GroupMemberRemovedPayload,
  ): void {
    this.requireGateway()?.emitToUser(
      userId,
      ChatEvent.GROUP_MEMBER_REMOVED,
      payload,
    );
  }

  emitGroupMemberPromoted(
    userId: string,
    payload: GroupMemberPromotedPayload,
  ): void {
    this.requireGateway()?.emitToUser(
      userId,
      ChatEvent.GROUP_MEMBER_PROMOTED,
      payload,
    );
  }

  async removeUserFromConversation(
    userId: string,
    conversationId: string,
  ): Promise<void> {
    const gateway = this.requireGateway();
    if (!gateway) return;
    await gateway.removeUserFromConversation(userId, conversationId);
  }

  async joinUsersToConversation(
    userIds: string[],
    conversationId: string,
  ): Promise<void> {
    const gateway = this.requireGateway();
    if (!gateway) return;
    const uniqueUserIds = [...new Set(userIds)];
    await Promise.all(
      uniqueUserIds.map((userId) =>
        gateway.joinUserToConversations(userId, [conversationId]),
      ),
    );
  }

  /** Push inmediato para alertas urgentes (room por usuario). */
  emitUrgentAlertPush(userId: string, alert: ResponseUserAlertDto): void {
    this.requireGateway()?.emitToUser(userId, ChatEvent.ALERT_PUSH, alert);
  }

  /** Notificación de alerta masiva (no urgente) en bandeja del usuario. */
  emitNewAlert(userId: string, alert: ResponseUserAlertDto): void {
    this.requireGateway()?.emitToUser(userId, ChatEvent.ALERT_NEW, alert);
  }
}
