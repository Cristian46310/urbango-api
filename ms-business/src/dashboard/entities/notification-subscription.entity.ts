import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Route } from '@/route/entities/route.entity';
import { Bus } from '@/bus/entities/bus.entity';
import { Stop } from '@/stop/entities/stop.entity';

@Entity({ name: 'notification_subscriptions' })
export class NotificationSubscription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  email!: string;

  @Column({ type: 'uuid', nullable: true })
  routeId?: string | null;

  @Column({ type: 'uuid', nullable: true })
  busId?: string | null;

  @Column({ type: 'uuid', nullable: true })
  stopId?: string | null;

  @ManyToOne(() => Route, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'routeId' })
  route?: Route | null;

  @ManyToOne(() => Bus, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'busId' })
  bus?: Bus | null;

  @ManyToOne(() => Stop, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'stopId' })
  stop?: Stop | null;

  @Column({ type: 'int', default: 10 })
  anticipationMinutes!: number;

  @Column({ type: 'text', nullable: true })
  message?: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  notifiedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
