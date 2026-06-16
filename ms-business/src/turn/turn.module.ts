import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TurnService } from './turn.service';
import { TurnController } from './turn.controller';
import { Turn } from './entities/turn.entity';
import { Bus } from '@/bus/entities/bus.entity';
import { Driver } from '@/driver/entities/driver.entity';
import { GpsModule } from '@/gps/gps.module';

@Module({
  imports: [TypeOrmModule.forFeature([Turn, Bus, Driver]), GpsModule],
  controllers: [TurnController],
  providers: [TurnService],
})
export class TurnModule {}
