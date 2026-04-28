import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulerService } from './scheduler.service';
import { SchedulerController } from './scheduler.controller';
import { Scheduler } from './entities/scheduler.entity';
import { Bus } from 'src/bus/entities/bus.entity';
import { Route } from 'src/route/entities/route.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Scheduler, Bus, Route])],
  controllers: [SchedulerController],
  providers: [SchedulerService],
})
export class SchedulerModule {}
