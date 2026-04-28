import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { PaymentMethod } from './entities/payment-method.entity';
import { plainToInstance } from 'class-transformer';
import { ResponsePaymentMethodDto } from './dto/response-payment-method.dto';
import { PaginationQueryDto } from 'src/shared/dto/pagination-query.dto';
import { ResponsePaymentMethodListDto } from './dto/response-payment-method-list.dto';

@Injectable()
export class PaymentMethodService {
  constructor(
    @InjectRepository(PaymentMethod)
    private readonly pmRepository: Repository<PaymentMethod>,
  ) {}

  async create(
    createPaymentMethodDto: CreatePaymentMethodDto,
  ): Promise<ResponsePaymentMethodDto> {
    const pm = this.pmRepository.create(
      createPaymentMethodDto as Partial<PaymentMethod>,
    );
    const saved = await this.pmRepository.save(pm);
    return plainToInstance(ResponsePaymentMethodDto, saved);
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
    pagination: PaginationQueryDto,
  ): Promise<ResponsePaymentMethodListDto> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const [items, totalItems] = await this.pmRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      items: plainToInstance(ResponsePaymentMethodDto, items),
      meta: this.buildPaginationMeta(page, limit, totalItems),
    };
  }

  async findOne(id: string): Promise<ResponsePaymentMethodDto> {
    const pm = await this.pmRepository.findOne({ where: { id } });
    if (!pm) throw new NotFoundException(`PaymentMethod ${id} not found`);
    return plainToInstance(ResponsePaymentMethodDto, pm);
  }

  async update(
    id: string,
    updatePaymentMethodDto: UpdatePaymentMethodDto,
  ): Promise<ResponsePaymentMethodDto> {
    const preloadData: Partial<PaymentMethod> = {
      id,
      ...updatePaymentMethodDto,
    };
    const pm = await this.pmRepository.preload(preloadData);
    if (!pm) throw new NotFoundException(`PaymentMethod ${id} not found`);
    const saved = await this.pmRepository.save(pm);
    return plainToInstance(ResponsePaymentMethodDto, saved);
  }

  async remove(id: string): Promise<void> {
    const pm = await this.pmRepository.findOne({ where: { id } });
    if (!pm) throw new NotFoundException(`PaymentMethod ${id} not found`);
    await this.pmRepository.delete(id);
    return;
  }
}
