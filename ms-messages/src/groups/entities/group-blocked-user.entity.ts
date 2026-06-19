import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Group } from './group.entity';

@Entity('group_blocked_users')
@Index(['groupId', 'userId'], { unique: true })
export class GroupBlockedUser {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'group_id', type: 'uuid' })
  groupId!: string;

  @Column({ name: 'user_id', type: 'varchar', length: 64 })
  userId!: string;

  @Column({ name: 'blocked_by', type: 'varchar', length: 64 })
  blockedBy!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  reason?: string | null;

  @CreateDateColumn({ name: 'blocked_at', type: 'timestamptz' })
  blockedAt!: Date;

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group?: Group;
}
