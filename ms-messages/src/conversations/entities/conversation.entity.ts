import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ConversationType } from '../enums/conversation-type.enum';
import { ConversationMember } from './conversation-member.entity';
import type { Message } from '@/messages/entities/message.entity';

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: ConversationType,
    default: ConversationType.DIRECT,
  })
  type!: ConversationType;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @OneToMany(() => ConversationMember, (member) => member.conversation)
  members?: ConversationMember[];

  @OneToMany('Message', 'conversation')
  messages?: Message[];
}
