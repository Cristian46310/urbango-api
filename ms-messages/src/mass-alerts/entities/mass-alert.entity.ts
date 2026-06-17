import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { MassAlertScope } from '../enums/mass-alert-scope.enum';
import { MassAlertStatus } from '../enums/mass-alert-status.enum';
import type { MassAlertRecipient } from './mass-alert-recipient.entity';
import type { MassAlertRoute } from './mass-alert-route.entity';
import type { MassAlertZone } from './mass-alert-zone.entity';

@Entity('mass_alerts')
export class MassAlert {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * ID del administrador emisor en ms-security (JWT `id` / MongoDB User).
   * Referencia lógica externa; no hay FK en PostgreSQL (mismo criterio que `messages.sender_id`).
   */
  @Column({ name: 'sender_id', type: 'varchar', length: 64 })
  senderId!: string;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'varchar', length: 2000 })
  body!: string;

  @Column({
    type: 'enum',
    enum: MassAlertScope,
  })
  scope!: MassAlertScope;

  @Column({ name: 'is_urgent', type: 'boolean', default: false })
  isUrgent!: boolean;

  @Column({ name: 'scheduled_at', type: 'timestamptz', nullable: true })
  scheduledAt?: Date | null;

  @Column({
    type: 'enum',
    enum: MassAlertStatus,
    default: MassAlertStatus.SCHEDULED,
  })
  status!: MassAlertStatus;

  @Column({ name: 'recipient_count', type: 'int', default: 0 })
  recipientCount!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt?: Date | null;

  @OneToMany('MassAlertRecipient', 'massAlert')
  recipients?: Relation<MassAlertRecipient[]>;

  @OneToMany('MassAlertRoute', 'massAlert')
  routes?: Relation<MassAlertRoute[]>;

  @OneToMany('MassAlertZone', 'massAlert')
  zones?: Relation<MassAlertZone[]>;
}
