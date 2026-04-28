import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { Citizen } from 'src/citizen/entities/citizen.entity';
import { PaymentMethodCitizen } from 'src/payment-method-citizen/entities/payment-method-citizen.entity';
import { Scheduler } from 'src/scheduler/entities/scheduler.entity';
import { History } from 'src/history/entities/history.entity';

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

  @OneToMany(() => History, (history) => history.ticket)
  histories?: History[];

  @CreateDateColumn()
  createdAt!: Date;
}
