import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Bus } from '@/bus/entities/bus.entity';
import { Driver } from '@/driver/entities/driver.entity';

@Entity({ name: 'turns' })
export class Turn {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'timestamp with time zone' })
  startTime!: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  endTime!: Date;

  @Column({ type: 'varchar', length: 64, nullable: true })
  status!: string;

  @ManyToOne(() => Bus, { nullable: true, eager: true })
  bus!: Bus;

  @ManyToOne(() => Driver, { nullable: true, eager: true })
  driver!: Driver;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;
}
