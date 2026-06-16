import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverProfile } from './entities/driver-profile.entity';
import { DriverProfileService } from './services/driver-profile.service';
import { DriverGuard } from './guards/driver.guard';

@Module({
  imports: [TypeOrmModule.forFeature([DriverProfile])],
  providers: [DriverProfileService, DriverGuard],
  exports: [DriverProfileService, DriverGuard],
})
export class DriverModule {}
