import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import type { MassAlert } from './mass-alert.entity';

@Entity('mass_alert_routes')
@Unique(['massAlertId', 'routeId'])
export class MassAlertRoute {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'mass_alert_id', type: 'uuid' })
  massAlertId!: string;

  /** Ruta destino (tabla compartida `routes`, ms-business). */
  @Column({ name: 'route_id', type: 'uuid' })
  routeId!: string;

  @ManyToOne('MassAlert', 'routes', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'mass_alert_id' })
  massAlert?: MassAlert;
}
