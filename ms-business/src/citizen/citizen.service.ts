import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { CreateCitizenDto } from './dto/create-citizen.dto';
import { UpdateCitizenDto } from './dto/update-citizen.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Citizen } from './entities/citizen.entity';
import { Address } from '@/address/entities/address.entity';
import { plainToInstance } from 'class-transformer';
import { ResponseCitizenDto } from './dto/response-citizen.dto';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';

export type CreateCitizenInput = CreateCitizenDto & { userId: string };

@Injectable()
export class CitizenService {
  constructor(
    @InjectRepository(Citizen)
    private readonly citizenRepository: Repository<Citizen>,
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
  ) {}

  async create(input: CreateCitizenInput) {
    const existing = await this.citizenRepository.findOne({
      where: { userId: input.userId },
    });
    if (existing) {
      throw new ConflictException(
        'Ya existe un perfil de ciudadano para este usuario',
      );
    }

    if (input.addressId) {
      const addr = await this.addressRepository.findOne({
        where: { id: input.addressId },
      });
      if (!addr) throw new BadRequestException('Address not found');
    }

    const citData: Partial<Citizen> = {
      name: input.name,
      document: input.document,
      email: input.email,
      phone: input.phone,
      userId: input.userId,
      extraInfo: input.extraInfo,
      address: input.addressId
        ? ({ id: input.addressId } as Address)
        : undefined,
    };
    const cit = this.citizenRepository.create(citData);
    const saved = await this.citizenRepository.save(cit);
    return plainToInstance(ResponseCitizenDto, saved);
  }

  async findByUserId(userId: string) {
    const cit = await this.citizenRepository.findOne({
      where: { userId },
      relations: ['address'],
    });
    if (!cit) {
      throw new NotFoundException('Citizen profile not found for this user');
    }
    return plainToInstance(ResponseCitizenDto, cit);
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
    const [items, totalItems] = await this.citizenRepository.findAndCount({
      relations: ['address'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: plainToInstance(ResponseCitizenDto, items),
      meta: this.buildPaginationMeta(page, limit, totalItems),
    };
  }

  async findOne(id: string) {
    const cit = await this.citizenRepository.findOne({
      where: { id },
      relations: ['address'],
    });
    if (!cit) throw new NotFoundException(`Citizen ${id} not found`);
    return plainToInstance(ResponseCitizenDto, cit);
  }

  async update(id: string, updateCitizenDto: UpdateCitizenDto) {
    if (updateCitizenDto.addressId) {
      const addr = await this.addressRepository.findOne({
        where: { id: updateCitizenDto.addressId },
      });
      if (!addr) throw new BadRequestException('Address not found');
    }
    const preloadData: Partial<Citizen> = {
      id,
      name: updateCitizenDto.name,
      document: updateCitizenDto.document,
      email: updateCitizenDto.email,
      phone: updateCitizenDto.phone,
      extraInfo: updateCitizenDto.extraInfo,
      address: updateCitizenDto.addressId
        ? ({ id: updateCitizenDto.addressId } as Address)
        : undefined,
    };
    const cit = await this.citizenRepository.preload(preloadData);
    if (!cit) throw new NotFoundException(`Citizen ${id} not found`);
    const saved = await this.citizenRepository.save(cit);
    return plainToInstance(ResponseCitizenDto, saved);
  }

  async remove(id: string) {
    const cit = await this.citizenRepository.findOne({ where: { id } });
    if (!cit) throw new NotFoundException(`Citizen ${id} not found`);
    await this.citizenRepository.delete(id);
    return;
  }
}
