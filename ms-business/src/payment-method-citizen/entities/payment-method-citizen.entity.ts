import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Citizen } from 'src/citizen/entities/citizen.entity';
import { PaymentMethod } from 'src/payment-method/entities/payment-method.entity';

@Entity({ name: 'payment_method_citizens' })
export class PaymentMethodCitizen {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Citizen, { nullable: false })
  @JoinColumn({ name: 'citizen_id' })
  citizen: Citizen;

  @ManyToOne(() => PaymentMethod, { nullable: false })
  @JoinColumn({ name: 'payment_method_id' })
  paymentMethod: PaymentMethod;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}
