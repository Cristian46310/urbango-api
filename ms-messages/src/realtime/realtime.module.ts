import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ConnectionManagerService } from './services/connection-manager.service';
import { RealtimeEmitterService } from './services/realtime-emitter.service';

@Module({
  providers: [ChatGateway, ConnectionManagerService, RealtimeEmitterService],
  exports: [RealtimeEmitterService],
})
export class RealtimeModule {}
