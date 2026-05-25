import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Bus } from '@/bus/entities/bus.entity';
import { Driver } from '@/driver/entities/driver.entity';
import { Supervisor } from '@/supervisor/entities/supervisor.entity';

@Entity('enterprises')
export class Enterprise {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  nit!: string;

  @OneToMany(() => Bus, (bus) => bus.enterprise)
  buses!: Bus[];

  
  @OneToMany(() => Driver, (driver) => driver.enterprise)
  drivers!: Driver[];

  @OneToMany(() => Supervisor, (supervisor) => supervisor.enterprise)
  supervisors?: Supervisor[];

  @CreateDateColumn()
  createdAt!: Date;
}
