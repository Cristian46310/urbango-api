import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { GroupVisibility } from '../enums/group-visibility.enum';
import type { GroupMember } from './group-member.entity';
import { Conversation } from '@/conversations/entities/conversation.entity';

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: GroupVisibility,
    default: GroupVisibility.PUBLIC,
  })
  visibility!: GroupVisibility;

  @Column({ name: 'icon_url', type: 'varchar', length: 2048, nullable: true })
  iconUrl?: string;

  @Column({ name: 'created_by', type: 'varchar', length: 64 })
  createdBy!: string;

  @Column({ name: 'conversation_id', type: 'uuid' })
  conversationId!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @OneToOne(() => Conversation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation?: Conversation;

  @OneToMany('GroupMember', 'group')
  members?: GroupMember[];
}
