import { Module } from '@nestjs/common';
import { InboxController } from './inbox.controller';
import { MessagesModule } from '@/messages/messages.module';

@Module({
  imports: [MessagesModule],
  controllers: [InboxController],
})
export class InboxModule {}
