import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverService } from './driver.service';
import { DriverController } from './driver.controller';
import { Driver } from './entities/driver.entity';
import { Person } from '@/shared/entities/person.entitie';

@Module({
  imports: [TypeOrmModule.forFeature([Driver, Person])],
  controllers: [DriverController],
  providers: [DriverService],
})
export class DriverModule {}
