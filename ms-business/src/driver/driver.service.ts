import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver } from './entities/driver.entity';
import { plainToInstance } from 'class-transformer';
import { ResponseDriverDto } from './dto/response-driver.dto';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';

@Injectable()
export class DriverService {
  constructor(
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
  ) {}

  async create(createDriverDto: CreateDriverDto) {
    const drv = this.driverRepository.create(
      createDriverDto as Partial<Driver>,
    );
    const saved = await this.driverRepository.save(drv);
    return plainToInstance(ResponseDriverDto, saved);
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
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: plainToInstance(ResponseDriverDto, items),
      meta: this.buildPaginationMeta(page, limit, totalItems),
    };
  }

  async findOne(id: string) {
    const drv = await this.driverRepository.findOne({ where: { id } });
    if (!drv) throw new NotFoundException(`Driver ${id} not found`);
    return plainToInstance(ResponseDriverDto, drv);
  }

  async update(id: string, updateDriverDto: UpdateDriverDto) {
    const drv = await this.driverRepository.preload({
      id,
      ...(updateDriverDto as Partial<Driver>),
    });
    if (!drv) throw new NotFoundException(`Driver ${id} not found`);
    const saved = await this.driverRepository.save(drv);
    return plainToInstance(ResponseDriverDto, saved);
  }

  async remove(id: string) {
    const drv = await this.driverRepository.findOne({ where: { id } });
    if (!drv) throw new NotFoundException(`Driver ${id} not found`);
    await this.driverRepository.delete(id);
    return;
  }
}
