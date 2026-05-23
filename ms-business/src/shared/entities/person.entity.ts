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
@Index(['userId', 'type'], {
  unique: true,
  where: '"user_id" IS NOT NULL',
})
@Index(['email', 'type'], {
  unique: true,
  where: '"email" IS NOT NULL',
})
@Index(['document', 'type'], { unique: true })
export class Person {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  document!: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ name: 'birth_date', type: 'date', nullable: true })
  birthDate?: Date;

  /** ID del usuario en ms-security (JWT sub / id). */
  @Column({ name: 'user_id', nullable: true })
  userId?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
