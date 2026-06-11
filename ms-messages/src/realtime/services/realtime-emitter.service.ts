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

@Injectable()
export class RealtimeEmitterService {
  private gateway?: ChatRealtimePort;

  setGateway(gateway: ChatRealtimePort): void {
    this.gateway = gateway;
  }

  emitNewMessage(recipientId: string, message: ResponseMessageDto): void {
    this.gateway?.emitToUser(recipientId, ChatEvent.MESSAGE_NEW, message);
  }

  emitMessageRead(
    senderId: string,
    payload: { messageId: string; conversationId: string; readAt: Date },
  ): void {
    this.gateway?.emitToUser(senderId, ChatEvent.MESSAGE_READ, payload);
  }

  emitGroupMemberAdded(userId: string, payload: GroupMemberAddedPayload): void {
    this.gateway?.emitToUser(userId, ChatEvent.GROUP_MEMBER_ADDED, payload);
  }

  emitMessageDeleted(
    userIds: string[],
    payload: {
      messageId: string;
      conversationId: string;
      groupId: string;
    },
  ): void {
    for (const userId of userIds) {
      this.gateway?.emitToUser(userId, ChatEvent.MESSAGE_DELETED, payload);
    }
  }

  emitGroupMessageRead(
    userIds: string[],
    payload: {
      messageId: string;
      conversationId: string;
      groupId: string;
      userId: string;
      readAt: Date;
    },
  ): void {
    for (const userId of userIds) {
      this.gateway?.emitToUser(userId, ChatEvent.MESSAGE_READ, payload);
    }
  }
}
