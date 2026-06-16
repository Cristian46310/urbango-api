import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import type { Message } from './message.entity';

@Entity('message_read_receipts')
@Index(['messageId', 'userId'], { unique: true })
export class MessageReadReceipt {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'message_id', type: 'uuid' })
  messageId!: string;

  @Column({ name: 'user_id', type: 'varchar', length: 64 })
  userId!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  readAt!: Date;

  @ManyToOne('Message', 'readReceipts', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'message_id' })
  message?: Relation<Message>;
}
