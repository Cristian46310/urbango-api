import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Bus } from '@/bus/entities/bus.entity';

@Entity('bus_photos')
export class BusPhoto {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => Bus, (bus) => bus.photo, { onDelete: 'CASCADE' })
  @JoinColumn()
  bus!: Bus;

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
