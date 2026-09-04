import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverService } from './driver.service';
import { DriverController } from './driver.controller';
import { Driver } from './entities/driver.entity';
import { Person } from '@/shared/entities/person.entity';
import { Enterprise } from '@/enterprise/entities/enterprise.entity';
import { UserPhotoModule } from '@/user-photo/user-photo.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Driver, Person, Enterprise]),
    UserPhotoModule,
  ],
  controllers: [DriverController],
  providers: [DriverService],
  exports: [DriverService],
})
export class DriverModule {}
