import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { MassAlert } from './mass-alert.entity';

@Entity('mass_alert_recipients')
export class MassAlertRecipient {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'mass_alert_id', type: 'uuid' })
  massAlertId!: string;

  @Column({ name: 'user_id', type: 'varchar', length: 64 })
  userId!: string;

  /** Se asigna explícitamente al momento del envío (no en la creación de la alerta programada). */
  @Column({ name: 'delivered_at', type: 'timestamptz', nullable: true })
  deliveredAt?: Date | null;

  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt?: Date | null;

  @ManyToOne('MassAlert', 'recipients', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'mass_alert_id' })
  massAlert?: MassAlert;
}
