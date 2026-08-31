import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TurnService } from './turn.service';
import { TurnController } from './turn.controller';
import { Turn } from './entities/turn.entity';
import { Bus } from '@/bus/entities/bus.entity';
import { Driver } from '@/driver/entities/driver.entity';
import { GpsModule } from '@/gps/gps.module';
import { NotificationsModule } from '@/notifications/notifications.module';
import { TurnAssignedListener } from './listeners/turn-assigned.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([Turn, Bus, Driver]),
    GpsModule,
    NotificationsModule,
  ],
  controllers: [TurnController],
  providers: [TurnService, TurnAssignedListener],
  exports: [TurnService],
})
export class TurnModule {}
