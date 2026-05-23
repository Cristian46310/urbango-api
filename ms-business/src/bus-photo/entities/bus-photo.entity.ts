import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { Bus } from '@/bus/entities/bus.entity';

@Entity('bus_photos')
export class BusPhoto {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Bus, (bus) => bus.photos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bus_id' })
  bus!: Bus;

  @Column()
  photoUrl!: string;
}
