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

@Entity('incidents')
export class Incident {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 32 })
  type!: 'mechanical' | 'accident' | 'delay' | 'other';

  @Column({ type: 'varchar', length: 16 })
  severity!: 'low' | 'medium' | 'high' | 'critical';

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude?: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude?: number;

  @Column({ type: 'varchar', length: 24, default: 'reported' })
  status!: 'reported' | 'in_review' | 'closed';

  @ManyToOne(() => Turn, { eager: true })
  turn!: Turn;

  @ManyToOne(() => Driver, { eager: true })
  driver!: Driver;

  @ManyToOne(() => Enterprise, { eager: true })
  enterprise!: Enterprise;

  @OneToMany(() => IncidentBus, (incidentBus) => incidentBus.incident)
  incidentBuses?: IncidentBus[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  reportedAt!: Date;
}