import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  TableInheritance,
} from 'typeorm';

@Entity('persons')
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export class Person {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  document!: string;

  @Column({ unique: true, nullable: true })
  email?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ name: 'birth_date', type: 'date', nullable: true })
  birthDate?: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
