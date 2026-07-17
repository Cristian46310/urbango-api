import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IncidentPhoto } from './entities/incident-photo.entity';
import { IncidentBus } from '@/incident/entities/incident-bus.entity';
import {
  IncidentStorageFile,
  IncidentStorageService,
  StoredIncidentPhoto,
} from './incident-storage.service';

@Injectable()
export class IncidentPhotoService {
  constructor(
    @InjectRepository(IncidentPhoto)
    private readonly incidentPhotoRepository: Repository<IncidentPhoto>,
    private readonly incidentStorageService: IncidentStorageService,
  ) {}

  async uploadOnly(
    photos: IncidentStorageFile[],
  ): Promise<StoredIncidentPhoto[]> {
    if (photos.length === 0) {
      return [];
    }
    if (photos.length > 5) {
      throw new BadRequestException('You can attach up to 5 photos');
    }
    return this.incidentStorageService.uploadMany(photos);
  }

  async persistUploaded(
    incidentBus: IncidentBus,
    storedPhotos: StoredIncidentPhoto[],
    repository: Repository<IncidentPhoto> = this.incidentPhotoRepository,
  ): Promise<IncidentPhoto[]> {
    if (storedPhotos.length === 0) {
      return [];
    }

    return repository.save(
      storedPhotos.map((photo) =>
        repository.create({
          incidentBus,
          photoUrl: photo.publicUrl,
        }),
      ),
    );
  }

  async attachPhotos(
    incidentBus: IncidentBus,
    photos: IncidentStorageFile[],
  ): Promise<IncidentPhoto[]> {
    const stored = await this.uploadOnly(photos);
    try {
      return await this.persistUploaded(incidentBus, stored);
    } catch (error) {
      await this.cleanupUploaded(stored);
      throw error;
    }
  }

  async cleanupUploaded(storedPhotos: StoredIncidentPhoto[]): Promise<void> {
    await Promise.all(
      storedPhotos.map((photo) =>
        this.incidentStorageService.delete(photo.path),
      ),
    );
  }
}
