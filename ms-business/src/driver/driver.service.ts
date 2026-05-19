import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver } from './entities/driver.entity';
import { Enterprise } from '@/enterprise/entities/enterprise.entity';
import { plainToInstance } from 'class-transformer';
import { ResponseDriverDto } from './dto/response-driver.dto';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';

export type CreateDriverInput = CreateDriverDto & { userId: string };

@Injectable()
export class DriverService {
  constructor(
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    @InjectRepository(Enterprise)
    private readonly enterpriseRepository: Repository<Enterprise>,
  ) {}

  async create(input: CreateDriverInput) {
    const ent = await this.enterpriseRepository.findOne({
      where: { id: input.enterpriseId },
    });
    if (!ent) {
      throw new BadRequestException('Enterprise not found');
    }

    const existing = await this.driverRepository.findOne({
      where: { userId: input.userId },
    });
    if (existing) {
      throw new ConflictException(
        'Ya existe un perfil de conductor para este usuario',
      );
    }

    const drvData: Partial<Driver> = {
      name: input.name,
      document: input.document,
      email: input.email,
      phone: input.phone,
      userId: input.userId,
      licenseNumber: input.licenseNumber,
      licenseExpiry: input.licenseExpiry
        ? new Date(input.licenseExpiry)
        : undefined,
      enterprise: { id: input.enterpriseId } as Enterprise,
    };

    const drv = this.driverRepository.create(drvData);
    const saved = await this.driverRepository.save(drv);
    return this.toResponse(saved);
  }

  async findByUserId(userId: string) {
    const drv = await this.driverRepository.findOne({
      where: { userId },
      relations: ['enterprise'],
    });
    if (!drv) {
      throw new NotFoundException('Driver profile not found for this user');
    }
    return this.toResponse(drv);
  }

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

  async findAll(paginationQuery: PaginationQueryDto) {
    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;
    const [items, totalItems] = await this.driverRepository.findAndCount({
      relations: ['enterprise'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: items.map((item) => this.toResponse(item)),
      meta: this.buildPaginationMeta(page, limit, totalItems),
    };
  }

  async findOne(id: string) {
    const drv = await this.driverRepository.findOne({
      where: { id },
      relations: ['enterprise'],
    });
    if (!drv) throw new NotFoundException(`Driver ${id} not found`);
    return this.toResponse(drv);
  }

  async update(id: string, updateDriverDto: UpdateDriverDto) {
    const preload: Partial<Driver> = {
      id,
      ...(updateDriverDto as Partial<Driver>),
    };
    if (updateDriverDto.licenseExpiry) {
      preload.licenseExpiry = new Date(updateDriverDto.licenseExpiry);
    }

    const drv = await this.driverRepository.preload(preload);
    if (!drv) throw new NotFoundException(`Driver ${id} not found`);
    const saved = await this.driverRepository.save(drv);
    return this.toResponse(saved);
  }

  async remove(id: string) {
    const drv = await this.driverRepository.findOne({ where: { id } });
    if (!drv) throw new NotFoundException(`Driver ${id} not found`);
    await this.driverRepository.delete(id);
    return;
  }

  private toResponse(driver: Driver): ResponseDriverDto {
    const dto = plainToInstance(ResponseDriverDto, driver, {
      excludeExtraneousValues: true,
    });
    dto.enterpriseId = driver.enterprise?.id;
    return dto;
  }
}
