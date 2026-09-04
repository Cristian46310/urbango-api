import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ConnectionManagerService } from './services/connection-manager.service';
import { RealtimeEmitterService } from './services/realtime-emitter.service';
import { ConversationsModule } from '@/conversations/conversations.module';
import { CHAT_REALTIME_PORT } from './chat-realtime.token';

@Module({
  imports: [ConversationsModule],
  providers: [
    ChatGateway,
    {
      provide: CHAT_REALTIME_PORT,
      useExisting: ChatGateway,
    },
    ConnectionManagerService,
    RealtimeEmitterService,
  ],
  exports: [RealtimeEmitterService],
})
export class RealtimeModule {}
