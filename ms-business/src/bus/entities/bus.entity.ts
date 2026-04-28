import { Enterprise } from 'src/enterprise/entities/enterprise.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Turn } from 'src/turn/entities/turn.entity';
import { Scheduler } from 'src/scheduler/entities/scheduler.entity';

@Entity('buses')
export class Bus {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  color?: string;

  @Column({ nullable: true })
  model?: string;

  @Column({ unique: true })
  plate!: string;

  @Column({ type: 'int', nullable: true })
  capacity?: number;

  @ManyToOne(() => Enterprise, { onDelete: 'SET NULL', eager: true })
  enterprise?: Enterprise;

  @OneToMany(() => Turn, (turn) => turn.bus)
  turns?: Turn[];

  @OneToMany(() => Scheduler, (scheduler) => scheduler.bus)
  schedulers?: Scheduler[];

  @CreateDateColumn()
  createdAt!: Date;
}
