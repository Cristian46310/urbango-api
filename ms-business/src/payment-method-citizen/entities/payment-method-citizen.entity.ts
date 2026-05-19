import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Citizen } from '@/citizen/entities/citizen.entity';
import { PaymentMethod } from '@/payment-method/entities/payment-method.entity';

export enum PaymentMethodType {
  PREPAID = 'prepaid',
  CREDIT = 'credit',
  DEBIT = 'debit',
}

export enum PaymentMethodStatus {
  ACTIVE = 'active',
  BLOCKED = 'blocked',
}

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

  @Column({ type: 'enum', enum: PaymentMethodType, default: PaymentMethodType.PREPAID })
  type!: PaymentMethodType;

  @Column({ type: 'enum', enum: PaymentMethodStatus, default: PaymentMethodStatus.ACTIVE })
  status!: PaymentMethodStatus;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastUsedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;
}
