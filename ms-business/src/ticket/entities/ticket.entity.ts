import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { Citizen } from '@/citizen/entities/citizen.entity';
import { PaymentMethodCitizen } from '@/payment-method-citizen/entities/payment-method-citizen.entity';
import { Scheduler } from '@/scheduler/entities/scheduler.entity';
import { History } from '@/history/entities/history.entity';

export enum TicketStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELED = 'canceled'
}

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Citizen, (citizen) => citizen.tickets, {
    eager: true,
    onDelete: 'SET NULL',
  })
  citizen?: Citizen;

  @ManyToOne(() => PaymentMethodCitizen, { onDelete: 'SET NULL', eager: false })
  paymentMethodCitizen?: PaymentMethodCitizen;

  @ManyToOne(() => Scheduler, { onDelete: 'SET NULL', eager: true })
  scheduler?: Scheduler;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  buyedAt!: Date;

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.ACTIVE,
  })
  status!: TicketStatus;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date | null;

  @OneToMany(() => History, (history) => history.ticket)
  histories?: History[];

  @CreateDateColumn()
  createdAt!: Date;
}
