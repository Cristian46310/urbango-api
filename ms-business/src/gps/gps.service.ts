import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { Gps } from './entities/gps.entity';
import { Bus } from '@/bus/entities/bus.entity';
import { CreateGpsDto } from './dto/create-gps.dto';
import { UpdateGpsDto } from './dto/update-gps.dto';
import { ResponseGpsDto } from './dto/response-gps.dto';
import { ResponseGpsListDto } from './dto/response-gps-list.dto';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';

@Injectable()
export class GpsService {
  constructor(
    @InjectRepository(Gps)
    private readonly gpsRepository: Repository<Gps>,
    @InjectRepository(Bus)
    private readonly busRepository: Repository<Bus>,
  ) {}

  private buildPaginationMeta(page: number, limit: number, totalItems: number) {
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));

    return {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  private toResponse(gps: Gps): ResponseGpsDto {
    return plainToInstance(
      ResponseGpsDto,
      {
        id: gps.id,
        busId: gps.bus.id,
        latitude: Number(gps.latitude),
        longitude: Number(gps.longitude),
        updatedAt: gps.updatedAt,
      },
      { excludeExtraneousValues: true },
    );
  }

  async create(busId: string, dto: CreateGpsDto): Promise<ResponseGpsDto> {
    const bus = await this.busRepository.findOne({ where: { id: busId } });
    if (!bus) {
      throw new NotFoundException(`Bus with id ${busId} not found`);
    }

    const existing = await this.gpsRepository.findOne({
      where: { bus: { id: busId } },
    });
    if (existing) {
      throw new ConflictException(
        `Bus ${busId} already has a GPS record. Use PATCH to update it.`,
      );
    }

    const gps = this.gpsRepository.create({
      latitude: dto.latitude,
      longitude: dto.longitude,
      updatedAt: new Date(),
      bus,
    });

    const saved = await this.gpsRepository.save(gps);
    return this.toResponse(saved);
  }

  async findAll(paginationQuery: PaginationQueryDto): Promise<ResponseGpsListDto> {
    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;

    const [items, totalItems] = await this.gpsRepository.findAndCount({
      relations: ['bus'],
      order: { updatedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: items.map((gps) => this.toResponse(gps)),
      meta: this.buildPaginationMeta(page, limit, totalItems),
    };
  }

  async findOne(id: string): Promise<ResponseGpsDto> {
    const gps = await this.gpsRepository.findOne({
      where: { id },
      relations: ['bus'],
    });

    if (!gps) {
      throw new NotFoundException(`GPS record with id ${id} not found`);
    }

    return this.toResponse(gps);
  }

  async findByBusId(busId: string): Promise<ResponseGpsDto> {
    const gps = await this.gpsRepository.findOne({
      where: { bus: { id: busId } },
      relations: ['bus'],
    });

    if (!gps) {
      throw new NotFoundException(`GPS record for bus ${busId} not found`);
    }

    return this.toResponse(gps);
  }

  async update(id: string, dto: UpdateGpsDto): Promise<ResponseGpsDto> {
    const gps = await this.gpsRepository.findOne({
      where: { id },
      relations: ['bus'],
    });

    if (!gps) {
      throw new NotFoundException(`GPS record with id ${id} not found`);
    }

    if (dto.latitude !== undefined) {
      gps.latitude = dto.latitude;
    }
    if (dto.longitude !== undefined) {
      gps.longitude = dto.longitude;
    }
    gps.updatedAt = new Date();

    const saved = await this.gpsRepository.save(gps);
    return this.toResponse(saved);
  }

  async remove(id: string): Promise<void> {
    const gps = await this.gpsRepository.findOne({ where: { id } });
    if (!gps) {
      throw new NotFoundException(`GPS record with id ${id} not found`);
    }

    await this.gpsRepository.delete(id);
  }
}
