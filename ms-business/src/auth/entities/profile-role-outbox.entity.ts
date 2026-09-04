import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProfileRoleOutboxStatus {
  PENDING = 'pending',
  DONE = 'done',
  FAILED = 'failed',
}

@Entity({ name: 'profile_role_outbox' })
@Index(['status', 'nextRetryAt'])
export class ProfileRoleOutbox {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid' })
  profileId!: string;

  /** citizen | driver | supervisor */
  @Column({ type: 'varchar', length: 32 })
  profileType!: string;

  /** CITIZEN | DRIVER | SUPERVISOR */
  @Column({ type: 'varchar', length: 32 })
  roleName!: string;

  @Column({
    type: 'varchar',
    length: 16,
    default: ProfileRoleOutboxStatus.PENDING,
  })
  status!: ProfileRoleOutboxStatus;

  @Column({ type: 'int', default: 0 })
  attempts!: number;

  @Column({ type: 'text', nullable: true })
  lastError?: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  nextRetryAt?: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  processedAt?: Date | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;
}
