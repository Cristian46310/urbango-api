import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('stops')
export class Stop {
  @PrimaryGeneratedColumn('uuid')
  id!: string;
  @Column()
  name!: string;
  @Column()
  location!: string;
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude?: number;
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude?: number;
  @CreateDateColumn()
  createdAt!: Date;
}
