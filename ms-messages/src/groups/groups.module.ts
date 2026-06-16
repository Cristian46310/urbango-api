import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { Group } from './entities/group.entity';
import { GroupMember } from './entities/group-member.entity';
import { Conversation } from '@/conversations/entities/conversation.entity';
import { ConversationMember } from '@/conversations/entities/conversation-member.entity';
import { UsersModule } from '@/users/users.module';
import { RealtimeModule } from '@/realtime/realtime.module';
import { CitizenModule } from '@/citizen/citizen.module';
import { MessagesModule } from '@/messages/messages.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Group,
      GroupMember,
      Conversation,
      ConversationMember,
    ]),
    UsersModule,
    RealtimeModule,
    CitizenModule,
    forwardRef(() => MessagesModule),
  ],
  controllers: [GroupsController],
  providers: [GroupsService],
  exports: [GroupsService],
})
export class GroupsModule {}
