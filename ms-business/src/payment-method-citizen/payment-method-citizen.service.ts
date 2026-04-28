import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePaymentMethodCitizenDto } from './dto/create-payment-method-citizen.dto';
import { UpdatePaymentMethodCitizenDto } from './dto/update-payment-method-citizen.dto';
import { PaymentMethodCitizen } from './entities/payment-method-citizen.entity';
import { Citizen } from '@/citizen/entities/citizen.entity';
import { PaymentMethod } from '@/payment-method/entities/payment-method.entity';
import { plainToInstance } from 'class-transformer';
import { ResponsePaymentMethodCitizenDto } from './dto/response-payment-method-citizen.dto';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import { ResponsePaymentMethodCitizenListDto } from './dto/response-payment-method-citizen-list.dto';

@Injectable()
export class PaymentMethodCitizenService {
  constructor(
    @InjectRepository(PaymentMethodCitizen)
    private readonly pmcRepository: Repository<PaymentMethodCitizen>,
    @InjectRepository(Citizen)
    private readonly citizenRepository: Repository<Citizen>,
    @InjectRepository(PaymentMethod)
    private readonly pmRepository: Repository<PaymentMethod>,
  ) {}

  async create(
    createDto: CreatePaymentMethodCitizenDto,
  ): Promise<ResponsePaymentMethodCitizenDto> {
    const citizen = await this.citizenRepository.findOne({
      where: { id: createDto.citizenId },
    });
    if (!citizen) throw new BadRequestException('Citizen not found');
    const pm = await this.pmRepository.findOne({
      where: { id: createDto.paymentMethodId },
    });
    if (!pm) throw new BadRequestException('Payment method not found');

    const pmc = this.pmcRepository.create({
      citizen: { id: citizen.id } as Citizen,
      paymentMethod: { id: pm.id } as PaymentMethod,
    } as Partial<PaymentMethodCitizen>);
    const saved = await this.pmcRepository.save(pmc);
    return plainToInstance(ResponsePaymentMethodCitizenDto, saved);
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
  ): Promise<ResponsePaymentMethodCitizenListDto> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const [items, totalItems] = await this.pmcRepository.findAndCount({
      relations: ['citizen', 'paymentMethod'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      items: plainToInstance(ResponsePaymentMethodCitizenDto, items),
      meta: this.buildPaginationMeta(page, limit, totalItems),
    };
  }

  async findOne(id: string): Promise<ResponsePaymentMethodCitizenDto> {
    const pmc = await this.pmcRepository.findOne({
      where: { id },
      relations: ['citizen', 'paymentMethod'],
    });
    if (!pmc)
      throw new NotFoundException(`PaymentMethodCitizen ${id} not found`);
    return plainToInstance(ResponsePaymentMethodCitizenDto, pmc);
  }

  async update(
    id: string,
    updateDto: UpdatePaymentMethodCitizenDto,
  ): Promise<ResponsePaymentMethodCitizenDto> {
    const preloadData: Partial<PaymentMethodCitizen> = { id };
    if (updateDto.citizenId) {
      const citizen = await this.citizenRepository.findOne({
        where: { id: updateDto.citizenId },
      });
      if (!citizen) throw new BadRequestException('Citizen not found');
      preloadData.citizen = { id: citizen.id } as Citizen;
    }
    if (updateDto.paymentMethodId) {
      const pm = await this.pmRepository.findOne({
        where: { id: updateDto.paymentMethodId },
      });
      if (!pm) throw new BadRequestException('Payment method not found');
      preloadData.paymentMethod = { id: pm.id } as PaymentMethod;
    }
    const pmc = await this.pmcRepository.preload(preloadData);
    if (!pmc)
      throw new NotFoundException(`PaymentMethodCitizen ${id} not found`);
    const saved = await this.pmcRepository.save(pmc);
    return plainToInstance(ResponsePaymentMethodCitizenDto, saved);
  }

  async remove(id: string): Promise<void> {
    const pmc = await this.pmcRepository.findOne({ where: { id } });
    if (!pmc)
      throw new NotFoundException(`PaymentMethodCitizen ${id} not found`);
    await this.pmcRepository.delete(id);
    return;
  }
}
