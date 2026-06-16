import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { IncidentBus } from '@/incident/entities/incident-bus.entity';

@Entity('incident_photos')
export class IncidentPhoto {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => IncidentBus, (incidentBus) => incidentBus.photos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'incident_bus_id' })
  incidentBus!: IncidentBus;

  @Column()
  photoUrl!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
