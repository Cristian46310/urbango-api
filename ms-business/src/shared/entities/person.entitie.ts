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
@Index(['mongoUserId'], { unique: true, where: '"mongoUserId" IS NOT NULL' })
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

  @Column({ nullable: true, unique: true })
  mongoUserId?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
