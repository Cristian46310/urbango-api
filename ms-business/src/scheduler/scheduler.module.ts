import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulerService } from './scheduler.service';
import { SchedulerController } from './scheduler.controller';
import { InternalSchedulerController } from './internal-scheduler.controller';
import { Scheduler } from './entities/scheduler.entity';
import { Bus } from '@/bus/entities/bus.entity';
import { Route } from '@/route/entities/route.entity';
import { BusModule } from '@/bus/bus.module';
import { Turn } from '@/turn/entities/turn.entity';
import { InternalKeyGuard } from '@/auth/guards/internal-key.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Scheduler, Bus, Route, Turn]), BusModule],
  controllers: [SchedulerController, InternalSchedulerController],
  providers: [SchedulerService, InternalKeyGuard],
  exports: [SchedulerService],
})
export class SchedulerModule {}
