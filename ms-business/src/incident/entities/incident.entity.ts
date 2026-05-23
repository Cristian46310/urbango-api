import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';

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

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude!: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude!: number;

  @Column({
    type: 'enum',
    enum: IncidentStatus,
    default: IncidentStatus.REPORTED,
  })
  status!: IncidentStatus;

  @OneToMany(() => IncidentBus, (incidentBus) => incidentBus.incident)
  incidentBuses!: IncidentBus[];

  @OneToMany(() => IncidentComment, (comment) => comment.incident)
  comments?: IncidentComment[];

  @CreateDateColumn()
  createdAt!: Date;
}
