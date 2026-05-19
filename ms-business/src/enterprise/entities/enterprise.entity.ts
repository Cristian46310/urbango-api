import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Bus } from '@/bus/entities/bus.entity';

@Entity('enterprises')
export class Enterprise {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  nit!: string;

  @Column({ nullable: true })
  supervisorEmail?: string;

  @OneToMany(() => Bus, (bus) => bus.enterprise)
  buses?: Bus[];

  @CreateDateColumn()
  createdAt!: Date;
}
