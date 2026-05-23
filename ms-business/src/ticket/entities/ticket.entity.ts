import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  Column,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Citizen } from '@/citizen/entities/citizen.entity';
import { PaymentMethodCitizen } from '@/payment-method-citizen/entities/payment-method-citizen.entity';
import { Scheduler } from '@/scheduler/entities/scheduler.entity';
import { History } from '@/history/entities/history.entity';

export enum TicketStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
}
@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Citizen, {
    eager: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'citizen_id' })
  citizen!: Citizen;

  @ManyToOne(() => PaymentMethodCitizen, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'payment_method_citizen_id' })
  paymentMethodCitizen!: PaymentMethodCitizen;

  @ManyToOne(() => Scheduler, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'scheduler_id' })
  scheduler!: Scheduler;

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.ACTIVE,
  })
  status!: TicketStatus;

  @OneToMany(() => History, (history) => history.ticket)
  histories!: History[];

  @CreateDateColumn()
  createdAt!: Date;
}
