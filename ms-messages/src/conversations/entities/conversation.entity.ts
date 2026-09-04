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

  /** Sorted "userA:userB" for direct chats; unique when set. */
  @Column({
    name: 'direct_pair_key',
    type: 'varchar',
    length: 130,
    nullable: true,
  })
  directPairKey?: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @OneToMany(() => ConversationMember, (member) => member.conversation)
  members?: ConversationMember[];

  @OneToMany('Message', 'conversation')
  messages?: Message[];
}
