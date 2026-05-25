import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum StopType {
  TERMINAL = 'terminal',
  INTERMEDIATE = 'intermediate',
  REGULAR = 'regular',
}

@Entity('stops')
export class Stop {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  code!: string;

  @Column()
  name!: string;

  @Column()
  location!: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude!: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude!: number;

  @Column({
    type: 'enum',
    enum: StopType,
    default: StopType.REGULAR,
  })
  type!: StopType;

  @CreateDateColumn()
  createdAt!: Date;
}
