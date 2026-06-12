import { Injectable } from '@nestjs/common';
import { ChatEvent } from '../chat-events.enum';
import { ResponseMessageDto } from '@/messages/dto/response-message.dto';
import { GroupMemberRole } from '@/groups/enums/group-member-role.enum';
import type { ChatRealtimePort } from '../chat-realtime.port';

export interface GroupMemberAddedPayload {
  groupId: string;
  groupName: string;
  conversationId: string;
  role: GroupMemberRole;
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

  async joinUsersToConversation(
    userIds: string[],
    conversationId: string,
  ): Promise<void> {
    const uniqueUserIds = [...new Set(userIds)];
    await Promise.all(
      uniqueUserIds.map((userId) =>
        this.gateway?.joinUserToConversations(userId, [conversationId]),
      ),
    );
  }
}
