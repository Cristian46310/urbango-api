import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverService } from './driver.service';
import { DriverController } from './driver.controller';
import { Driver } from './entities/driver.entity';
import { Person } from '@/shared/entities/person.entitie';
import { Enterprise } from '@/enterprise/entities/enterprise.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Driver, Person, Enterprise])],
  controllers: [DriverController],
  providers: [DriverService],
  exports: [DriverService],
})
export class DriverModule {}
