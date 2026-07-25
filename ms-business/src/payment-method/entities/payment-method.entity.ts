import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity({ name: 'payment_methods' })
export class PaymentMethod {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Código estable del catálogo: CASH | SYSTEM_CARD | EXTERNAL_CARD */
  @Column({ type: 'varchar', length: 32, unique: true, nullable: true })
  code?: string;

  @Column({ type: 'varchar', length: 128 })
  name!: string;

  @Column({ type: 'boolean', default: false })
  isRechargeable!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
