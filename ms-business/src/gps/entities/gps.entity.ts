import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Bus } from '@/bus/entities/bus.entity';

@Entity('gps')
export class Gps {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude!: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude!: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  updatedAt?: Date;

  @OneToOne(() => Bus, (bus) => bus.gps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'busId' })
  bus!: Bus;

  @CreateDateColumn()
  createdAt!: Date;
}
