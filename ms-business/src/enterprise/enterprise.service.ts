import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CreateEnterpriseDto } from './dto/create-enterprise.dto';
import { UpdateEnterpriseDto } from './dto/update-enterprise.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enterprise } from './entities/enterprise.entity';
import { plainToInstance } from 'class-transformer';
import { ResponseEnterpriseDto } from './dto/response-enterprise.dto';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import { ResponseEnterpriseListDto } from './dto/response-enterprise-list.dto';

@Injectable()
export class EnterpriseService {
  constructor(
    @InjectRepository(Enterprise)
    private readonly enterpriseRepository: Repository<Enterprise>,
  ) {}

  async create(
    createEnterpriseDto: CreateEnterpriseDto,
  ): Promise<ResponseEnterpriseDto> {
    const existing = await this.enterpriseRepository.findOne({
      where: { nit: createEnterpriseDto.nit },
    });
    if (existing)
      throw new BadRequestException('Enterprise with same NIT already exists');
    const ent = this.enterpriseRepository.create(
      createEnterpriseDto as Partial<Enterprise>,
    );
    return plainToInstance(
      ResponseEnterpriseDto,
      await this.enterpriseRepository.save(ent),
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
  ): Promise<ResponseEnterpriseListDto> {
    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;
    const [items, totalItems] = await this.enterpriseRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: plainToInstance(ResponseEnterpriseDto, items),
      meta: this.buildPaginationMeta(page, limit, totalItems),
    };
  }

  async findOne(id: string): Promise<ResponseEnterpriseDto> {
    const ent = await this.enterpriseRepository.findOne({ where: { id } });
    if (!ent) throw new NotFoundException(`Enterprise ${id} not found`);
    return plainToInstance(ResponseEnterpriseDto, ent);
  }

  async update(
    id: string,
    updateEnterpriseDto: UpdateEnterpriseDto,
  ): Promise<ResponseEnterpriseDto> {
    const ent = await this.enterpriseRepository.preload({
      id,
      ...(updateEnterpriseDto as Partial<Enterprise>),
    });
    if (!ent) throw new NotFoundException(`Enterprise ${id} not found`);
    const saved = await this.enterpriseRepository.save(ent);
    return plainToInstance(ResponseEnterpriseDto, saved);
  }

  async remove(id: string): Promise<void> {
    const ent = await this.enterpriseRepository.findOne({ where: { id } });
    if (!ent) throw new NotFoundException(`Enterprise ${id} not found`);
    await this.enterpriseRepository.softDelete(id);
  }
}
