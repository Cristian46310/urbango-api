import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateStopDto } from './dto/create-stop.dto';
import { UpdateStopDto } from './dto/update-stop.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Stop } from './entities/stop.entity';
import { Repository } from 'typeorm';
import { ResponseStopDto } from './dto/response-stop.dto';
import { plainToInstance } from 'class-transformer';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import { ResponseStopListDto } from './dto/response-stop-list.dto';

@Injectable()
export class StopService {
  constructor(
    @InjectRepository(Stop)
    private readonly stopRepository: Repository<Stop>,
  ) {}
  async create(createStopDto: CreateStopDto): Promise<ResponseStopDto> {
    const stop = this.stopRepository.create(createStopDto);
    return plainToInstance(
      ResponseStopDto,
      await this.stopRepository.save(stop),
    );
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

  async findAll(
    paginationQuery: PaginationQueryDto,
  ): Promise<ResponseStopListDto> {
    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;
    const [stops, totalItems] = await this.stopRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: plainToInstance(ResponseStopDto, stops),
      meta: this.buildPaginationMeta(page, limit, totalItems),
    };
  }

  async findOne(id: string): Promise<ResponseStopDto> {
    const stop = await this.stopRepository.findOne({ where: { id } });
    if (!stop) {
      throw new NotFoundException(`Stop with id ${id} not found`);
    }
    return plainToInstance(ResponseStopDto, stop);
  }

  async update(
    id: string,
    updateStopDto: UpdateStopDto,
  ): Promise<ResponseStopDto> {
    const stop = await this.stopRepository.preload({ id, ...updateStopDto });
    if (!stop) {
      throw new NotFoundException(`Stop with id ${id} not found`);
    }
    const updatedStop = await this.stopRepository.save(stop);
    return plainToInstance(ResponseStopDto, updatedStop);
  }

  async remove(id: string): Promise<void> {
    const stop = await this.stopRepository.findOne({ where: { id } });
    if (!stop) {
      throw new NotFoundException(`Stop with id ${id} not found`);
    }
    await this.stopRepository.delete(id);
    return;
  }
}
