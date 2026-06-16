import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CitizenProfile } from './entities/citizen-profile.entity';
import { CitizenProfileService } from './services/citizen-profile.service';
import { CitizenGuard } from './guards/citizen.guard';

@Module({
  imports: [TypeOrmModule.forFeature([CitizenProfile])],
  providers: [CitizenProfileService, CitizenGuard],
  exports: [CitizenProfileService, CitizenGuard],
})
export class CitizenModule {}
