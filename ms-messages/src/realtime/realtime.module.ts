import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ConnectionManagerService } from './services/connection-manager.service';
import { RealtimeEmitterService } from './services/realtime-emitter.service';
import { ConversationsModule } from '@/conversations/conversations.module';

@Module({
  imports: [ConversationsModule],
  providers: [ChatGateway, ConnectionManagerService, RealtimeEmitterService],
  exports: [RealtimeEmitterService],
})
export class RealtimeModule {}
