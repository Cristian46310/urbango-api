import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulerService } from './scheduler.service';
import { SchedulerController } from './scheduler.controller';
import { Scheduler } from './entities/scheduler.entity';
import { Bus } from '@/bus/entities/bus.entity';
import { Route } from '@/route/entities/route.entity';
import { Turn } from '@/turn/entities/turn.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Scheduler, Bus, Route, Turn])],
  controllers: [SchedulerController],
  providers: [SchedulerService],
})
export class SchedulerModule {}
