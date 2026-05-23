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

  @Column()
  email!: string;

  @Column()
  phone!: string;

  @Column({ nullable: true })
  birthDate?: Date;

  /** ID del usuario en ms-security (JWT sub / id). */
  @Column({ name: 'user_id' })
  userId!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
