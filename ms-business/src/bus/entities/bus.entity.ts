import { Enterprise } from '@/enterprise/entities/enterprise.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Turn } from '@/turn/entities/turn.entity';
import { Scheduler } from '@/scheduler/entities/scheduler.entity';
import { Gps } from '@/gps/entities/gps.entity';
import { BusPhoto } from '@/bus-photo/entities/bus-photo.entity';
import { IncidentBus } from '@/incident/entities/incident-bus.entity';
import { BusStatus } from '../enums/bus-status.enum';

@Entity('buses')
export class Bus {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  color!: string;

  @Column()
  model!: string;

  @Column({ unique: true })
  plate!: string;

  @Column({ type: 'int' })
  year!: number;

  @Column({ type: 'int' })
  seatedCapacity!: number;

  @Column({ type: 'int' })
  standingCapacity!: number;

  @Column({ type: 'varchar', default: BusStatus.OPERATIVO })
  status!: BusStatus;

  @ManyToOne(() => Enterprise, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'enterprise_id' })
  enterprise!: Enterprise;

  @OneToMany(() => Turn, (turn) => turn.bus)
  turns?: Turn[];

  @OneToMany(() => Scheduler, (scheduler) => scheduler.bus)
  schedulers?: Scheduler[];

  @OneToOne(() => Gps, (gps) => gps.bus, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'gps_id' })
  gps!: Gps;

  @OneToMany(() => BusPhoto, (photo) => photo.bus, {
    onDelete: 'CASCADE',
    eager: true,
  })
  photos?: BusPhoto[];

  @OneToMany(() => IncidentBus, (incidentBus) => incidentBus.bus)
  incidentBuses?: IncidentBus[];

  @CreateDateColumn()
  createdAt!: Date;
}
