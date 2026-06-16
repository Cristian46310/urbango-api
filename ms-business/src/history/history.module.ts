import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistoryService } from './history.service';
import { HistoryController } from './history.controller';
import { History } from './entities/history.entity';
import { Ticket } from '@/ticket/entities/ticket.entity';
import { Node } from '@/node/entities/node.entity';
import { Turn } from '@/turn/entities/turn.entity';
import { Scheduler } from '@/scheduler/entities/scheduler.entity';
import { RouteModule } from '@/route/route.module';

@Module({
  imports: [
    RouteModule,
    TypeOrmModule.forFeature([History, Ticket, Node, Turn, Scheduler]),
  ],
  controllers: [HistoryController],
  providers: [HistoryService],
  exports: [HistoryService],
})
export class HistoryModule {}
