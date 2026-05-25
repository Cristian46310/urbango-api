import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Bus } from '@/bus/entities/bus.entity';
import { Driver } from '@/driver/entities/driver.entity';

export enum TurnStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity({ name: 'turns' })
export class Turn {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'timestamp with time zone' })
  startTime!: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  endTime!: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  actualStartTime?: Date | null;

  @Column({
    type: 'enum',
    enum: TurnStatus,
    enumName: 'turn_status_enum',
    default: TurnStatus.SCHEDULED,
  })
  status!: TurnStatus;

  @Column({ type: 'varchar', length: 64, nullable: true })
  busStatus?: string | null;

  @Column({ type: 'text', nullable: true })
  busObservations?: string | null;

  @ManyToOne(() => Bus, { nullable: true, eager: true })
  bus!: Bus;

  @ManyToOne(() => Driver, { nullable: true, eager: true })
  driver!: Driver;

  @CreateDateColumn()
  createdAt!: Date;
}
