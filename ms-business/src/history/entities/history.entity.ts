import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Node } from '@/node/entities/node.entity';
import { Ticket } from '@/ticket/entities/ticket.entity';

@Entity('histories')
@Index(['ticket', 'order'], { unique: true })
export class History {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'int' })
  order!: number;

  @ManyToOne(() => Node, { onDelete: 'SET NULL', eager: true })
  node?: Node;

  @ManyToOne(() => Ticket, (ticket) => ticket.histories, {
    onDelete: 'CASCADE',
  })
  ticket?: Ticket;

  @CreateDateColumn()
  createdAt!: Date;
}
