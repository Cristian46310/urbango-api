import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { BusPhoto } from './entities/bus-photo.entity';
import { Bus } from '@/bus/entities/bus.entity';
import { ResponseBusPhotoDto } from './dto/response-bus-photo.dto';
import {
  BusPhotoStorageFile,
  BusPhotoStorageService,
} from './bus-photo-storage.service';

@Injectable()
export class BusPhotoService {
  constructor(
    @InjectRepository(BusPhoto)
    private readonly busPhotoRepository: Repository<BusPhoto>,
    @InjectRepository(Bus)
    private readonly busRepository: Repository<Bus>,
    private readonly busPhotoStorageService: BusPhotoStorageService,
  ) {}

  private toResponse(photo: BusPhoto): ResponseBusPhotoDto {
    return plainToInstance(
      ResponseBusPhotoDto,
      {
        id: photo.id,
        busId: photo.bus.id,
        photoUrl: photo.photoUrl,
      },
      { excludeExtraneousValues: true },
    );
  }

  async upsertForBus(
    busId: string,
    file: BusPhotoStorageFile,
  ): Promise<ResponseBusPhotoDto> {
    const bus = await this.busRepository.findOne({ where: { id: busId } });
    if (!bus) {
      throw new NotFoundException(`Bus with id ${busId} not found`);
    }

    const previous = await this.busPhotoRepository.findOne({
      where: { bus: { id: busId } },
      relations: ['bus'],
    });
    const previousPath = previous
      ? this.busPhotoStorageService.pathFromPublicUrl(previous.photoUrl)
      : undefined;

    const stored = await this.busPhotoStorageService.upload(file);

    try {
      let photo = previous;
      if (photo) {
        photo.photoUrl = stored.publicUrl;
      } else {
        photo = this.busPhotoRepository.create({
          bus,
          photoUrl: stored.publicUrl,
        });
      }

      const saved = await this.busPhotoRepository.save(photo);

      if (previousPath && previousPath !== stored.path) {
        await this.busPhotoStorageService.delete(previousPath);
      }

      return this.toResponse(saved);
    } catch (error) {
      await this.busPhotoStorageService.delete(stored.path);
      throw error;
    }
  }

  async createForBus(
    busId: string,
    file: BusPhotoStorageFile,
  ): Promise<ResponseBusPhotoDto> {
    const existing = await this.busPhotoRepository.findOne({
      where: { bus: { id: busId } },
    });
    if (existing) {
      throw new ConflictException(
        `Bus ${busId} already has a photo. Use PUT or POST .../photo on the bus to replace it.`,
      );
    }

    return this.upsertForBus(busId, file);
  }

  async findByBusId(busId: string): Promise<ResponseBusPhotoDto> {
    const photo = await this.busPhotoRepository.findOne({
      where: { bus: { id: busId } },
      relations: ['bus'],
    });

    if (!photo) {
      throw new NotFoundException(`Photo for bus ${busId} not found`);
    }

    return this.toResponse(photo);
  }

  async findOne(id: string): Promise<ResponseBusPhotoDto> {
    const photo = await this.busPhotoRepository.findOne({
      where: { id },
      relations: ['bus'],
    });

    if (!photo) {
      throw new NotFoundException(`Bus photo with id ${id} not found`);
    }

    return this.toResponse(photo);
  }

  async remove(id: string): Promise<void> {
    const photo = await this.busPhotoRepository.findOne({
      where: { id },
      relations: ['bus'],
    });

    if (!photo) {
      throw new NotFoundException(`Bus photo with id ${id} not found`);
    }

    const path = this.busPhotoStorageService.pathFromPublicUrl(photo.photoUrl);
    await this.busPhotoRepository.delete(id);
    if (path) {
      await this.busPhotoStorageService.delete(path);
    }
  }
}
