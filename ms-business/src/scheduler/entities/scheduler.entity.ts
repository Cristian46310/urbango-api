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

export enum SchedulerStatus {
  SCHEDULED = 'programado',
  CANCELLED = 'cancelado',
  COMPLETED = 'completado',
}

/** HU-011: lunes a viernes, fines de semana, diaria, o sin recurrencia */
export enum RecurrenceType {
  NONE = 'none',
  WEEKDAYS = 'weekdays',
  WEEKENDS = 'weekends',
  DAILY = 'daily',
}

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

  @Column({ type: 'date' })
  date!: string;

  /** Hora de salida programada */
  @Column({ type: 'timestamp with time zone' })
  startTime!: Date;

  /** Fin estimado del servicio (salida + duración de la ruta) */
  @Column({ type: 'timestamp with time zone' })
  endTime!: Date;

  @Column({
    type: 'enum',
    enum: SchedulerStatus,
    default: SchedulerStatus.SCHEDULED,
  })
  status!: SchedulerStatus;

  @Column({ name: 'tolerance_minutes', type: 'int', default: 0 })
  toleranceMinutes!: number;

  @Column({
    name: 'recurrence_type',
    type: 'enum',
    enum: RecurrenceType,
    enumName: 'scheduler_recurrence_enum',
    default: RecurrenceType.NONE,
  })
  recurrenceType!: RecurrenceType;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;
}
