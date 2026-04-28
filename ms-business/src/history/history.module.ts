import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistoryService } from './history.service';
import { HistoryController } from './history.controller';
import { History } from './entities/history.entity';
import { Ticket } from 'src/ticket/entities/ticket.entity';
import { Node } from 'src/node/entities/node.entity';
import { Turn } from 'src/turn/entities/turn.entity';
import { Bus } from 'src/bus/entities/bus.entity';
import { Driver } from 'src/driver/entities/driver.entity';
import { Scheduler } from 'src/scheduler/entities/scheduler.entity';

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
