import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PaymentMethodCitizen } from '@/payment-method-citizen/entities/payment-method-citizen.entity';
import { Citizen } from '@/citizen/entities/citizen.entity';
import { CardRechargeStatus } from '../enums/card-recharge-status.enum';

@Entity({ name: 'card_recharge_transactions' })
export class CardRechargeTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  reference!: string;

  @Column({ type: 'int' })
  amount!: number;

  @Column({ type: 'int', default: 0 })
  feeAmount!: number;

  @Column({ type: 'int' })
  totalAmount!: number;

  @Column({
    type: 'enum',
    enum: CardRechargeStatus,
    default: CardRechargeStatus.PENDING,
  })
  status!: CardRechargeStatus;

  @Column({ type: 'varchar', length: 128, nullable: true })
  epaycoRefPayco?: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  epaycoTransactionId?: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  epaycoResponse?: string;

  @Column({ type: 'varchar', length: 256 })
  description!: string;

  @ManyToOne(() => PaymentMethodCitizen, { nullable: false })
  @JoinColumn({ name: 'paymentMethodCitizenId' })
  paymentMethodCitizen!: PaymentMethodCitizen;

  @ManyToOne(() => Citizen, { nullable: false })
  @JoinColumn({ name: 'citizenId' })
  citizen!: Citizen;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  completedAt?: Date;
}
