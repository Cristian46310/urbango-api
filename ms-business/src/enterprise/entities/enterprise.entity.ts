import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Bus } from '@/bus/entities/bus.entity';
import { Driver } from '@/driver/entities/driver.entity';

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

  @CreateDateColumn()
  createdAt!: Date;
}
