import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import type { MassAlert } from './mass-alert.entity';

@Entity('mass_alert_zones')
@Unique(['massAlertId', 'zoneName'])
export class MassAlertZone {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'mass_alert_id', type: 'uuid' })
  massAlertId!: string;

  /** Ciudad/zona destino (alineado con `addresses.city`, ms-business). */
  @Column({ name: 'zone_name', type: 'varchar', length: 128 })
  zoneName!: string;

  @ManyToOne('MassAlert', 'zones', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'mass_alert_id' })
  massAlert?: MassAlert;
}
