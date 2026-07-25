import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { PaymentMethod } from './entities/payment-method.entity';
import { plainToInstance } from 'class-transformer';
import { ResponsePaymentMethodDto } from './dto/response-payment-method.dto';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
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
    if (createPaymentMethodDto.code) {
      const existingCode = await this.pmRepository.findOne({
        where: { code: createPaymentMethodDto.code },
      });
      if (existingCode) {
        throw new BadRequestException(
          `Ya existe un método de pago con code ${createPaymentMethodDto.code}`,
        );
      }
    }

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

  async findRechargeable(): Promise<ResponsePaymentMethodDto[]> {
    const items = await this.pmRepository.find({
      where: { isRechargeable: true },
      order: { name: 'ASC' },
    });
    return plainToInstance(ResponsePaymentMethodDto, items);
  }

  async findDefaultRechargeable(): Promise<PaymentMethod | null> {
    const byCode = await this.pmRepository.findOne({
      where: { code: 'SYSTEM_CARD' },
    });
    if (byCode) return byCode;

    return this.pmRepository.findOne({
      where: { isRechargeable: true },
      order: { createdAt: 'ASC' },
    });
  }

  async findByCode(code: string): Promise<PaymentMethod | null> {
    return this.pmRepository.findOne({ where: { code } });
  }

  async findAll(
    pagination: PaginationQueryDto,
  ): Promise<ResponsePaymentMethodListDto> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const [items, totalItems] = await this.pmRepository.findAndCount({
      order: { createdAt: 'ASC' },
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
    if (updatePaymentMethodDto.code) {
      const existingCode = await this.pmRepository.findOne({
        where: { code: updatePaymentMethodDto.code },
      });
      if (existingCode && existingCode.id !== id) {
        throw new BadRequestException(
          `Ya existe un método de pago con code ${updatePaymentMethodDto.code}`,
        );
      }
    }

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
    if (pm.code && ['CASH', 'SYSTEM_CARD', 'EXTERNAL_CARD'].includes(pm.code)) {
      throw new BadRequestException(
        `No se puede eliminar el método de catálogo ${pm.code}`,
      );
    }
    await this.pmRepository.delete(id);
    return;
  }
}
