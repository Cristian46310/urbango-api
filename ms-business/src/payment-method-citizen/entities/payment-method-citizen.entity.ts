import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Citizen } from '@/citizen/entities/citizen.entity';
import { PaymentMethod } from '@/payment-method/entities/payment-method.entity';

@Entity({ name: 'payment_method_citizens' })
export class PaymentMethodCitizen {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Citizen, { nullable: false })
  @JoinColumn({ name: 'citizen_id' })
  citizen!: Citizen;

  @ManyToOne(() => PaymentMethod, { nullable: false })
  @JoinColumn({ name: 'payment_method_id' })
  paymentMethod!: PaymentMethod;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  balance!: number;

  @Column({ type: 'varchar', length: 32, nullable: true, unique: true })
  cardNumber?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
