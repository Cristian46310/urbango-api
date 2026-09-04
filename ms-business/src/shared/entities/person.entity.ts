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

  /** URL pública en Supabase Storage (`SUPABASE_USER_BUCKET`). */
  @Column({ name: 'photo_url', nullable: true })
  photoUrl?: string;

  /** ID del usuario en ms-security (JWT sub / id). */
  @Column({ name: 'user_id' })
  userId!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
