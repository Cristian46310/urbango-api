import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { Message } from './entities/message.entity';
import { MessageReadReceipt } from './entities/message-read-receipt.entity';
import { ConversationsModule } from '@/conversations/conversations.module';
import { RealtimeModule } from '@/realtime/realtime.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, MessageReadReceipt]),
    ConversationsModule,
    RealtimeModule,
  ],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
