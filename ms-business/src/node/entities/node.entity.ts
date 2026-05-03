import { Route } from '../../route/entities/route.entity';
import { Stop } from '../../stop/entities/stop.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity('nodes')
@Unique(['route', 'order']) // Asegura que no haya dos nodos con el mismo orden en la misma ruta
export class Node {
  @PrimaryGeneratedColumn('uuid')
  id!: string;
  // Order of the node in the route
  @Column()
  order!: number;
  // que carge el stop al cargar el nodo y que no se puede eliminar un stop si tiene nodos asociados
  @ManyToOne(() => Stop, { onDelete: 'RESTRICT', eager: true })
  @JoinColumn({ name: 'stopId' })
  stop!: Stop;
  @ManyToOne(() => Route, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'routeId' })
  route!: Route;
  @CreateDateColumn()
  createdAt!: Date;
}
