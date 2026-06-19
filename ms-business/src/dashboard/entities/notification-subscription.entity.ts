import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'notification_subscriptions' })
export class NotificationSubscription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  email!: string;

  @Column({ nullable: true })
  routeId?: string;

  @Column({ nullable: true })
  busId?: string;

  @Column({ nullable: true })
  stopId?: string;

  @Column({ type: 'int', default: 10 })
  anticipationMinutes!: number;

  @Column({ type: 'text', nullable: true })
  message?: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  notifiedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
