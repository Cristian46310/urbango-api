import { Enterprise } from '@/enterprise/entities/enterprise.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Turn } from '@/turn/entities/turn.entity';
import { Scheduler } from '@/scheduler/entities/scheduler.entity';
import { Gps } from '@/incident/entities/gps.entity';
import { IncidentBus } from '@/incident/entities/incident-bus.entity';
import { BusStatus } from '../enums/bus-status.enum';

@Entity('buses')
export class Bus {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  color?: string;

  @Column({ nullable: true })
  model?: string;

  @Column({ unique: true })
  plate!: string;

  @Column({ type: 'int', nullable: true })
  capacity?: number;

  @Column({ type: 'int', nullable: true })
  year?: number;

  @Column({ type: 'int', nullable: true })
  seatedCapacity?: number;

  @Column({ type: 'int', nullable: true })
  standingCapacity?: number;

  @Column({ type: 'varchar', default: BusStatus.OPERATIVO })
  status: BusStatus = BusStatus.OPERATIVO;

  @Column({ type: 'text', nullable: true })
  photoUrl?: string;

  @Column({ type: 'text', nullable: true })
  qrCode?: string;

  @ManyToOne(() => Enterprise, { onDelete: 'SET NULL', eager: true })
  enterprise?: Enterprise;

  @OneToMany(() => Turn, (turn) => turn.bus)
  turns?: Turn[];

  @OneToMany(() => Scheduler, (scheduler) => scheduler.bus)
  schedulers?: Scheduler[];

  @OneToOne(() => Gps, (gps) => gps.bus, { nullable: true, eager: true })
  gps?: Gps;

  @OneToMany(() => IncidentBus, (incidentBus) => incidentBus.bus)
  incidentBuses?: IncidentBus[];

  @CreateDateColumn()
  createdAt!: Date;
}
