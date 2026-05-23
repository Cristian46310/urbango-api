import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Node } from '@/node/entities/node.entity';
import { Ticket } from '@/ticket/entities/ticket.entity';

@Entity('histories')
@Index(['ticket', 'order'], { unique: true })
export class History {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Node, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'node_id' })
  node!: Node;

  @ManyToOne(() => Ticket, (ticket) => ticket.histories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ticket_id' })
  ticket!: Ticket;

  @CreateDateColumn()
  createdAt!: Date;
}
