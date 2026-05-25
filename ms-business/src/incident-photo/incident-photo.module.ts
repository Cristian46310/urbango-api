import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncidentPhotoService } from './incident-photo.service';
import { IncidentPhoto } from './entities/incident-photo.entity';
import { IncidentBus } from '@/incident/entities/incident-bus.entity';
import { IncidentStorageService } from './incident-storage.service';

@Module({
  imports: [TypeOrmModule.forFeature([IncidentPhoto, IncidentBus])],
  providers: [IncidentPhotoService, IncidentStorageService],
  exports: [IncidentPhotoService, TypeOrmModule],
})
export class IncidentPhotoModule {}
