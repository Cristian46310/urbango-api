import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IncidentPhoto } from './entities/incident-photo.entity';
import { IncidentBus } from '@/incident/entities/incident-bus.entity';
import {
  IncidentStorageFile,
  IncidentStorageService,
} from './incident-storage.service';

@Injectable()
export class IncidentPhotoService {
  constructor(
    @InjectRepository(IncidentPhoto)
    private readonly incidentPhotoRepository: Repository<IncidentPhoto>,
    private readonly incidentStorageService: IncidentStorageService,
  ) {}

  async attachPhotos(
    incidentBus: IncidentBus,
    photos: IncidentStorageFile[],
  ): Promise<IncidentPhoto[]> {
    if (photos.length === 0) {
      return [];
    }

    if (photos.length > 5) {
      throw new BadRequestException('You can attach up to 5 photos');
    }

    const storedPhotos = await this.incidentStorageService.uploadMany(photos);

    return this.incidentPhotoRepository.save(
      storedPhotos.map((photo) =>
        this.incidentPhotoRepository.create({
          incidentBus,
          path: photo.path,
          publicUrl: photo.publicUrl,
          originalName: photo.originalName,
          mimeType: photo.mimeType,
          size: photo.size,
        }),
      ),
    );
  }
}
