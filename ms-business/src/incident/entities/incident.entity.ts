import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { Turn } from '@/turn/entities/turn.entity';
import { Driver } from '@/driver/entities/driver.entity';
import { Enterprise } from '@/enterprise/entities/enterprise.entity';
import { IncidentBus } from './incident-bus.entity';
import { IncidentComment } from '@/incident-comment/entities/incident-comment.entity';
import {
  IncidentType,
  IncidentSeverity,
  IncidentStatus,
} from '../enums/incident.enum';

@Entity('incidents')
export class Incident {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: IncidentType })
  type!: IncidentType;

  @Column({ type: 'enum', enum: IncidentSeverity })
  severity!: IncidentSeverity;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude?: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude?: number;

  @Column({
    type: 'enum',
    enum: IncidentStatus,
    default: IncidentStatus.REPORTED,
  })
  status!: IncidentStatus;

  @ManyToOne(() => Turn, { eager: true })
  turn!: Turn;

  @ManyToOne(() => Driver, { eager: true })
  driver!: Driver;

  @ManyToOne(() => Enterprise, { eager: true })
  enterprise!: Enterprise;

  @OneToMany(() => IncidentBus, (incidentBus) => incidentBus.incident)
  incidentBuses?: IncidentBus[];

  @OneToMany(() => IncidentComment, (comment) => comment.incident)
  comments?: IncidentComment[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  reportedAt!: Date;
}
