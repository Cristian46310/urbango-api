import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { GroupMemberRole } from '../enums/group-member-role.enum';
import { Group } from './group.entity';

@Entity('group_members')
@Index(['groupId', 'userId'], { unique: true })
export class GroupMember {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'group_id', type: 'uuid' })
  groupId!: string;

  @Column({ name: 'user_id', type: 'varchar', length: 64 })
  userId!: string;

  @Column({
    type: 'enum',
    enum: GroupMemberRole,
    default: GroupMemberRole.MEMBER,
  })
  role!: GroupMemberRole;

  @CreateDateColumn({ type: 'timestamptz' })
  joinedAt!: Date;

  @Column({ name: 'left_at', type: 'timestamptz', nullable: true })
  leftAt?: Date | null;

  @ManyToOne(() => Group, (group) => group.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group?: Group;
}
