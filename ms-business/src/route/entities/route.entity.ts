import { Node } from '@/node/entities/node.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('routes')
export class Route {
  @PrimaryGeneratedColumn('uuid')
  id!: string;
  @Column({ unique: true })
  code!: string;
  @Column()
  name!: string;
  @Column()
  description!: string;
  @Column()
  price!: number;
  @OneToMany(() => Node, (node) => node.route, { eager: true })
  nodes!: Node[];
  @CreateDateColumn()
  createdAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date | null;
}
