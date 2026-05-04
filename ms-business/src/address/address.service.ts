import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { Address } from './entities/address.entity';
import { plainToInstance } from 'class-transformer';
import { ResponseAddressDto } from './dto/response-address.dto';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import { ResponseAddressListDto } from './dto/response-address-list.dto';

@Injectable()
export class AddressService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
  ) {}

  async create(
    createAddressDto: CreateAddressDto,
  ): Promise<ResponseAddressDto> {
    const addr = this.addressRepository.create(
      createAddressDto as Partial<Address>,
    );
    const saved = await this.addressRepository.save(addr);
    return plainToInstance(ResponseAddressDto, saved);
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
  ): Promise<ResponseAddressListDto> {
    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;
    const [items, totalItems] = await this.addressRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      items: plainToInstance(ResponseAddressDto, items),
      meta: this.buildPaginationMeta(page, limit, totalItems),
    };
  }

  async findOne(id: string): Promise<ResponseAddressDto> {
    const addr = await this.addressRepository.findOne({ where: { id } });
    if (!addr) throw new NotFoundException(`Address ${id} not found`);
    return plainToInstance(ResponseAddressDto, addr);
  }

  async update(
    id: string,
    updateAddressDto: UpdateAddressDto,
  ): Promise<ResponseAddressDto> {
    const preloadData: Partial<Address> = { id, ...updateAddressDto };
    const addr = await this.addressRepository.preload(preloadData);
    if (!addr) throw new NotFoundException(`Address ${id} not found`);
    const saved = await this.addressRepository.save(addr);
    return plainToInstance(ResponseAddressDto, saved);
  }

  async remove(id: string): Promise<void> {
    const addr = await this.addressRepository.findOne({ where: { id } });
    if (!addr) throw new NotFoundException(`Address ${id} not found`);
    await this.addressRepository.delete(id);
    return;
  }
}
