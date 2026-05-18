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
  @Column()
  latitude!: number;
  @Column()
  longitude!: number;
  @CreateDateColumn()
  createdAt!: Date;

}
