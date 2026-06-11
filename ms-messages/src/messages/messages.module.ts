import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { Message } from './entities/message.entity';
import { MessageReadReceipt } from './entities/message-read-receipt.entity';
import { ConversationsModule } from '@/conversations/conversations.module';
import { RealtimeModule } from '@/realtime/realtime.module';
import { GroupsModule } from '@/groups/groups.module';
import { DriverModule } from '@/driver/driver.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, MessageReadReceipt]),
    ConversationsModule,
    RealtimeModule,
    forwardRef(() => GroupsModule),
    DriverModule,
  ],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
