import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity({ name: 'addresses' })
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 512 })
  address!: string;

  @Column({ type: 'varchar', length: 128 })
  city!: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;
}
