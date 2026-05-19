import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePaymentMethodCitizenDto } from './dto/create-payment-method-citizen.dto';
import { UpdatePaymentMethodCitizenDto } from './dto/update-payment-method-citizen.dto';
import {
  PaymentMethodCitizen,
  PaymentMethodStatus,
  PaymentMethodType,
} from './entities/payment-method-citizen.entity';
import { Citizen } from '@/citizen/entities/citizen.entity';
import { PaymentMethod } from '@/payment-method/entities/payment-method.entity';
import { plainToInstance } from 'class-transformer';
import { ResponsePaymentMethodCitizenDto } from './dto/response-payment-method-citizen.dto';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import { ResponsePaymentMethodCitizenListDto } from './dto/response-payment-method-citizen-list.dto';
import { generateTransportCardNumber } from '@/card-recharge/utils/card-number.util';

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

    const pmcData: Partial<PaymentMethodCitizen> = {
      citizen: { id: citizen.id } as Citizen,
      paymentMethod: { id: pm.id } as PaymentMethod,
      balance: createDto.balance ?? 0,
      type: createDto.type ?? PaymentMethodType.PREPAID,
      status: createDto.status ?? PaymentMethodStatus.ACTIVE,
    };

    if (pm.isRechargeable) {
      pmcData.cardNumber = await this.generateUniqueCardNumber();
    }

    const pmc = this.pmcRepository.create(pmcData);
    const saved = await this.pmcRepository.save(pmc);
    const withRelations = await this.pmcRepository.findOne({
      where: { id: saved.id },
      relations: ['paymentMethod', 'citizen'],
    });
    return plainToInstance(
      ResponsePaymentMethodCitizenDto,
      withRelations ?? saved,
      { enableImplicitConversion: true },
    );
  }

  async createForCitizenUser(
    userId: string,
    paymentMethodId: string,
  ): Promise<ResponsePaymentMethodCitizenDto> {
    const citizen = await this.citizenRepository.findOne({
      where: { userId },
    });
    if (!citizen) {
      throw new BadRequestException(
        'Debe registrar su perfil de ciudadano antes de solicitar una tarjeta',
      );
    }

    const existing = await this.pmcRepository.findOne({
      where: {
        citizen: { id: citizen.id },
        paymentMethod: { id: paymentMethodId },
      },
      relations: ['paymentMethod', 'citizen'],
    });
    if (existing) {
      return plainToInstance(ResponsePaymentMethodCitizenDto, existing, {
        enableImplicitConversion: true,
      });
    }

    return this.create({
      citizenId: citizen.id,
      paymentMethodId,
    });
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
    if (updateDto.balance !== undefined)
      preloadData.balance = updateDto.balance;
    if (updateDto.type !== undefined) preloadData.type = updateDto.type;
    if (updateDto.status !== undefined) preloadData.status = updateDto.status;
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

  private async generateUniqueCardNumber(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generateTransportCardNumber();
      const exists = await this.pmcRepository.exists({
        where: { cardNumber: candidate },
      });
      if (!exists) return candidate;
    }
    throw new BadRequestException(
      'No se pudo generar un número de tarjeta único',
    );
  }
}
