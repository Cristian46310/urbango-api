import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { Bus } from '@/bus/entities/bus.entity';
import { Route } from '@/route/entities/route.entity';

@Entity({ name: 'schedulers' })
export class Scheduler {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Bus, { nullable: false })
  @JoinColumn({ name: 'bus_id' })
  bus!: Bus;

  @ManyToOne(() => Route, { nullable: false })
  @JoinColumn({ name: 'route_id' })
  route!: Route;

  @Column({ type: 'timestamp with time zone' })
  startTime!: Date;

  @Column({ type: 'timestamp with time zone' })
  endTime!: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;
}
