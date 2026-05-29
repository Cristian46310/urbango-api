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
import { HistoryEventType } from '../enums/history-event-type.enum';

@Entity('histories')
@Index(['ticket', 'node', 'eventType'], { unique: true })
export class History {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: HistoryEventType,
    enumName: 'history_event_type_enum',
  })
  eventType!: HistoryEventType;

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
