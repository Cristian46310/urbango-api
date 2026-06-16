import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import type { Conversation } from '@/conversations/entities/conversation.entity';
import type { MessageReadReceipt } from './message-read-receipt.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'conversation_id', type: 'uuid' })
  conversationId!: string;

  @Column({ name: 'sender_id', type: 'varchar', length: 64 })
  senderId!: string;

  @Column({ type: 'varchar', length: 500 })
  body!: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude?: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude?: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt?: Date | null;

  @ManyToOne('Conversation', 'messages', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation?: Conversation;

  @OneToMany('MessageReadReceipt', 'message')
  readReceipts?: Relation<MessageReadReceipt>[];
}
