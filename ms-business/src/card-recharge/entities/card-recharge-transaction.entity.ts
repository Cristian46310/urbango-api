import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { PaymentMethodCitizen } from '@/payment-method-citizen/entities/payment-method-citizen.entity';

@Entity({ name: 'card_recharge_transactions' })
export class CardRechargeTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'int' })
  amount!: number;

  @Column({ type: 'varchar', length: 128, nullable: true })
  epaycoTransactionId?: string;

  @ManyToOne(() => PaymentMethodCitizen, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'paymentMethodCitizenId' })
  paymentMethodCitizen!: PaymentMethodCitizen;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;
}
