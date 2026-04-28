import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateBusDto } from './dto/create-bus.dto';
import { UpdateBusDto } from './dto/update-bus.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bus } from './entities/bus.entity';
import { Enterprise } from 'src/enterprise/entities/enterprise.entity';
import { plainToInstance } from 'class-transformer';
import { ResponseBusDto } from './dto/response-bus.dto';
import { PaginationQueryDto } from 'src/shared/dto/pagination-query.dto';
import { ResponseBusListDto } from './dto/response-bus-list.dto';

@Injectable()
export class BusService {
  constructor(
    @InjectRepository(Bus)
    private readonly busRepository: Repository<Bus>,
    @InjectRepository(Enterprise)
    private readonly enterpriseRepository: Repository<Enterprise>,
  ) {}

  async create(createBusDto: CreateBusDto): Promise<ResponseBusDto> {
    if (createBusDto.enterpriseId) {
      const ent = await this.enterpriseRepository.findOne({
        where: { id: createBusDto.enterpriseId },
      });
      if (!ent) throw new BadRequestException('Enterprise not found');
    }
    const busData: Partial<Bus> = {
      plate: createBusDto.plate,
      model: createBusDto.model,
      color: createBusDto.color,
      capacity: createBusDto.capacity,
      enterprise: createBusDto.enterpriseId
        ? ({ id: createBusDto.enterpriseId } as Enterprise)
        : undefined,
    };
    const bus = this.busRepository.create(busData);
    const saved = await this.busRepository.save(bus);
    return plainToInstance(ResponseBusDto, saved);
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
  ): Promise<ResponseBusListDto> {
    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;
    const [items, totalItems] = await this.busRepository.findAndCount({
      relations: ['enterprise'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: plainToInstance(ResponseBusDto, items),
      meta: this.buildPaginationMeta(page, limit, totalItems),
    };
  }

  async findOne(id: string): Promise<ResponseBusDto> {
    const bus = await this.busRepository.findOne({
      where: { id },
      relations: ['enterprise'],
    });
    if (!bus) throw new NotFoundException(`Bus ${id} not found`);
    return plainToInstance(ResponseBusDto, bus);
  }

  async update(
    id: string,
    updateBusDto: UpdateBusDto,
  ): Promise<ResponseBusDto> {
    if (updateBusDto.enterpriseId) {
      const ent = await this.enterpriseRepository.findOne({
        where: { id: updateBusDto.enterpriseId },
      });
      if (!ent) throw new BadRequestException('Enterprise not found');
    }
    const preloadData: Partial<Bus> = {
      id,
      plate: updateBusDto.plate,
      model: updateBusDto.model,
      color: updateBusDto.color,
      capacity: updateBusDto.capacity,
      enterprise: updateBusDto.enterpriseId
        ? ({ id: updateBusDto.enterpriseId } as Enterprise)
        : undefined,
    };
    const bus = await this.busRepository.preload(preloadData);
    if (!bus) throw new NotFoundException(`Bus ${id} not found`);
    const saved = await this.busRepository.save(bus);
    return plainToInstance(ResponseBusDto, saved);
  }

  async remove(id: string): Promise<void> {
    const bus = await this.busRepository.findOne({ where: { id } });
    if (!bus) throw new NotFoundException(`Bus ${id} not found`);
    await this.busRepository.delete(id);
    return;
  }
}
