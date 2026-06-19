import { Injectable } from '@nestjs/common';
import { ChatEvent } from '../chat-events.enum';
import { ResponseMessageDto } from '@/messages/dto/response-message.dto';
import { GroupMemberRole } from '@/groups/enums/group-member-role.enum';
import type { ChatRealtimePort } from '../chat-realtime.port';
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
  private gateway?: ChatRealtimePort;

  setGateway(gateway: ChatRealtimePort): void {
    this.gateway = gateway;
  }

  /** Notifica a todos los miembros conectados de la conversación (sin fetch). */
  emitNewMessage(message: ResponseMessageDto): void {
    this.gateway?.emitToConversation(
      message.conversationId,
      ChatEvent.MESSAGE_NEW,
      message,
    );
  }

  emitMessageRead(payload: MessageReadPayload): void {
    this.gateway?.emitToConversation(
      payload.conversationId,
      ChatEvent.MESSAGE_READ,
      payload,
    );
  }

  emitMessageDeleted(payload: MessageDeletedPayload): void {
    this.gateway?.emitToConversation(
      payload.conversationId,
      ChatEvent.MESSAGE_DELETED,
      payload,
    );
  }

  emitGroupMemberAdded(userId: string, payload: GroupMemberAddedPayload): void {
    this.gateway?.emitToUser(userId, ChatEvent.GROUP_MEMBER_ADDED, payload);
  }

  emitGroupMemberLeft(
    adminUserId: string,
    payload: GroupMemberLeftPayload,
  ): void {
    this.gateway?.emitToUser(adminUserId, ChatEvent.GROUP_MEMBER_LEFT, payload);
  }

  emitGroupMemberRemoved(
    userId: string,
    payload: GroupMemberRemovedPayload,
  ): void {
    this.gateway?.emitToUser(userId, ChatEvent.GROUP_MEMBER_REMOVED, payload);
  }

  emitGroupMemberPromoted(
    userId: string,
    payload: GroupMemberPromotedPayload,
  ): void {
    this.gateway?.emitToUser(userId, ChatEvent.GROUP_MEMBER_PROMOTED, payload);
  }

  async removeUserFromConversation(
    userId: string,
    conversationId: string,
  ): Promise<void> {
    if (!this.gateway) return;
    await this.gateway.removeUserFromConversation(userId, conversationId);
  }

  async joinUsersToConversation(
    userIds: string[],
    conversationId: string,
  ): Promise<void> {
    if (!this.gateway) return;
    const uniqueUserIds = [...new Set(userIds)];
    await Promise.all(
      uniqueUserIds.map((userId) =>
        this.gateway!.joinUserToConversations(userId, [conversationId]),
      ),
    );
  }

  /** Push inmediato para alertas urgentes (room por usuario). */
  emitUrgentAlertPush(userId: string, alert: ResponseUserAlertDto): void {
    this.gateway?.emitToUser(userId, ChatEvent.ALERT_PUSH, alert);
  }

  /** Notificación de alerta masiva (no urgente) en bandeja del usuario. */
  emitNewAlert(userId: string, alert: ResponseUserAlertDto): void {
    this.gateway?.emitToUser(userId, ChatEvent.ALERT_NEW, alert);
  }
}
