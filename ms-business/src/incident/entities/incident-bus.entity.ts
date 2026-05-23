import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  OneToMany,
} from 'typeorm';
import { Incident } from './incident.entity';
import { Bus } from '@/bus/entities/bus.entity';
import { IncidentPhoto } from '@/incident-photo/entities/incident-photo.entity';

@Entity('incident_buses')
export class IncidentBus {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Incident, (incident) => incident.incidentBuses, {
    onDelete: 'CASCADE',
  })
  incident!: Incident;

  @ManyToOne(() => Bus, (bus) => bus.incidentBuses, { eager: true })
  bus!: Bus;

  @Column({ default: true })
  isPrimary!: boolean;

  @OneToMany(() => IncidentPhoto, (photo) => photo.incidentBus)
  photos?: IncidentPhoto[];
}
