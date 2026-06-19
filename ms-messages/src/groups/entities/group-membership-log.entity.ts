import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { GroupMembershipAction } from '../enums/group-membership-action.enum';
import { Group } from './group.entity';

@Entity('group_membership_logs')
@Index(['groupId', 'createdAt'])
export class GroupMembershipLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'group_id', type: 'uuid' })
  groupId!: string;

  @Column({
    type: 'enum',
    enum: GroupMembershipAction,
  })
  action!: GroupMembershipAction;

  @Column({ name: 'actor_user_id', type: 'varchar', length: 64 })
  actorUserId!: string;

  @Column({
    name: 'target_user_id',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  targetUserId?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group?: Group;
}
