import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { IncidentBus } from './incident-bus.entity';

@Entity('incident_photos')
export class IncidentPhoto {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => IncidentBus, (incidentBus) => incidentBus.photos, {
    onDelete: 'CASCADE',
  })
  incidentBus!: IncidentBus;

  @Column()
  path!: string;

  @Column({ nullable: true })
  publicUrl?: string;

  @Column({ nullable: true })
  originalName?: string;

  @Column({ nullable: true })
  mimeType?: string;

  @Column({ type: 'int', nullable: true })
  size?: number;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;
}
