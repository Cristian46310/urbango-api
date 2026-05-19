import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  TableInheritance,
  Index,
} from 'typeorm';

@Entity('persons')
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
@Index(['userId'], { unique: true, where: '"user_id" IS NOT NULL' })
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

  /** ID del usuario en ms-security (JWT sub / id). */
  @Column({ name: 'user_id', nullable: true, unique: true })
  userId?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
