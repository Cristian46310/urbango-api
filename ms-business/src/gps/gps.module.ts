import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Gps } from './entities/gps.entity';
import { GpsService } from './gps.service';
import { GpsController } from './gps.controller';
import { Bus } from '@/bus/entities/bus.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Gps, Bus])],
  controllers: [GpsController],
  providers: [GpsService],
  exports: [TypeOrmModule, GpsService],
})
export class GpsModule {}
