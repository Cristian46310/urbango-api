import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
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
  @JoinColumn({ name: 'incident_id' })
  incident!: Incident;

  @ManyToOne(() => Bus, (bus) => bus.incidentBuses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'bus_id' })
  bus!: Bus;

  @OneToMany(() => IncidentPhoto, (photo) => photo.incidentBus)
  photos!: IncidentPhoto[];
}
