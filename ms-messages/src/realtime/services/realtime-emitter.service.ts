import { Injectable } from '@nestjs/common';
import { ChatEvent } from '../chat-events.enum';
import { ResponseMessageDto } from '@/messages/dto/response-message.dto';
import type { ChatRealtimePort } from '../chat-realtime.port';

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
}
