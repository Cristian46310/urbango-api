import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistoryService } from './history.service';
import { HistoryController } from './history.controller';
import { History } from './entities/history.entity';
import { Ticket } from '@/ticket/entities/ticket.entity';
import { Node } from '@/node/entities/node.entity';
import { Turn } from '@/turn/entities/turn.entity';
import { Bus } from '@/bus/entities/bus.entity';
import { Driver } from '@/driver/entities/driver.entity';
import { Scheduler } from '@/scheduler/entities/scheduler.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      History,
      Ticket,
      Node,
      Turn,
      Bus,
      Driver,
      Scheduler,
    ]),
  ],
  controllers: [HistoryController],
  providers: [HistoryService],
})
export class HistoryModule {}
