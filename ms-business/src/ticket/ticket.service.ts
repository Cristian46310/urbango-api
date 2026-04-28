import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from './entities/ticket.entity';
import { Citizen } from 'src/citizen/entities/citizen.entity';
import { PaymentMethodCitizen } from 'src/payment-method-citizen/entities/payment-method-citizen.entity';
import { Scheduler } from 'src/scheduler/entities/scheduler.entity';
import { plainToInstance } from 'class-transformer';
import { ResponseTicketDto } from './dto/response-ticket.dto';
import { PaginationQueryDto } from 'src/shared/dto/pagination-query.dto';

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(Citizen)
    private readonly citizenRepository: Repository<Citizen>,
    @InjectRepository(PaymentMethodCitizen)
    private readonly pmcRepository: Repository<PaymentMethodCitizen>,
    @InjectRepository(Scheduler)
    private readonly schedulerRepository: Repository<Scheduler>,
  ) {}

  async create(createTicketDto: CreateTicketDto) {
    if (createTicketDto.citizenId) {
      const cit = await this.citizenRepository.findOne({
        where: { id: createTicketDto.citizenId },
      });
      if (!cit) throw new BadRequestException('Citizen not found');
    }
    if (createTicketDto.paymentMethodCitizenId) {
      const pmc = await this.pmcRepository.findOne({
        where: { id: createTicketDto.paymentMethodCitizenId },
      });
      if (!pmc) throw new BadRequestException('Payment method not found');
    }
    if (createTicketDto.schedulerId) {
      const sch = await this.schedulerRepository.findOne({
        where: { id: createTicketDto.schedulerId },
      });
      if (!sch) throw new BadRequestException('Scheduler not found');
    }

    const ticketData: Partial<Ticket> = {
      citizen: createTicketDto.citizenId
        ? ({ id: createTicketDto.citizenId } as Citizen)
        : undefined,
      paymentMethodCitizen: createTicketDto.paymentMethodCitizenId
        ? ({
            id: createTicketDto.paymentMethodCitizenId,
          } as PaymentMethodCitizen)
        : undefined,
      scheduler: createTicketDto.schedulerId
        ? ({ id: createTicketDto.schedulerId } as Scheduler)
        : undefined,
      buyedAt: createTicketDto.buyedAt
        ? new Date(createTicketDto.buyedAt)
        : undefined,
    };
    const ticket = this.ticketRepository.create(ticketData);

    const saved = await this.ticketRepository.save(ticket);
    return plainToInstance(ResponseTicketDto, saved);
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
    const [items, totalItems] = await this.ticketRepository.findAndCount({
      relations: ['citizen', 'scheduler'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: plainToInstance(ResponseTicketDto, items),
      meta: this.buildPaginationMeta(page, limit, totalItems),
    };
  }

  async findOne(id: string) {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
      relations: ['citizen', 'scheduler'],
    });
    if (!ticket) throw new NotFoundException(`Ticket ${id} not found`);
    return plainToInstance(ResponseTicketDto, ticket);
  }

  async update(id: string, updateTicketDto: UpdateTicketDto) {
    if (updateTicketDto.citizenId) {
      const cit = await this.citizenRepository.findOne({
        where: { id: updateTicketDto.citizenId },
      });
      if (!cit) throw new BadRequestException('Citizen not found');
    }
    if (updateTicketDto.paymentMethodCitizenId) {
      const pmc = await this.pmcRepository.findOne({
        where: { id: updateTicketDto.paymentMethodCitizenId },
      });
      if (!pmc) throw new BadRequestException('Payment method not found');
    }
    if (updateTicketDto.schedulerId) {
      const sch = await this.schedulerRepository.findOne({
        where: { id: updateTicketDto.schedulerId },
      });
      if (!sch) throw new BadRequestException('Scheduler not found');
    }

    const preloadData: Partial<Ticket> = {
      id,
      citizen: updateTicketDto.citizenId
        ? ({ id: updateTicketDto.citizenId } as Citizen)
        : undefined,
      paymentMethodCitizen: updateTicketDto.paymentMethodCitizenId
        ? ({
            id: updateTicketDto.paymentMethodCitizenId,
          } as PaymentMethodCitizen)
        : undefined,
      scheduler: updateTicketDto.schedulerId
        ? ({ id: updateTicketDto.schedulerId } as Scheduler)
        : undefined,
      buyedAt: updateTicketDto.buyedAt
        ? new Date(updateTicketDto.buyedAt)
        : undefined,
    };
    const ticket = await this.ticketRepository.preload(preloadData);
    if (!ticket) throw new NotFoundException(`Ticket ${id} not found`);
    const saved = await this.ticketRepository.save(ticket);
    return plainToInstance(ResponseTicketDto, saved);
  }

  async remove(id: string) {
    const ticket = await this.ticketRepository.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException(`Ticket ${id} not found`);
    await this.ticketRepository.delete(id);
    return;
  }
}
