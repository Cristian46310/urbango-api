import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { AlightTicketDto } from './dto/alight-ticket.dto';
import { AlightResponseDto } from './dto/alight-response.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Ticket, TicketStatus } from './entities/ticket.entity';
import { Citizen } from '@/citizen/entities/citizen.entity';
import { PaymentMethodCitizen } from '@/payment-method-citizen/entities/payment-method-citizen.entity';
import { Scheduler } from '@/scheduler/entities/scheduler.entity';
import { History } from '@/history/entities/history.entity';
import { HistoryEventType } from '@/history/enums/history-event-type.enum';
import { Node } from '@/node/entities/node.entity';
import { plainToInstance } from 'class-transformer';
import { ResponseTicketDto } from './dto/response-ticket.dto';
import { ResponseCitizenTicketDto } from './dto/response-citizen-ticket.dto';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import { TicketQueryDto } from './dto/ticket-query.dto';

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
    @InjectRepository(Node)
    private readonly nodeRepository: Repository<Node>,
    private readonly dataSource: DataSource,
  ) {}

  private toResponse(ticket: Ticket): ResponseTicketDto {
    return plainToInstance(ResponseTicketDto, {
      id: ticket.id,
      status: ticket.status,
      createdAt: ticket.createdAt,
      boardedAt: ticket.boardedAt,
      completedAt: ticket.completedAt,
      routePrice: ticket.scheduler?.route?.price,
    });
  }

  private toCitizenResponse(ticket: Ticket): ResponseCitizenTicketDto {
    const base = this.toResponse(ticket);
    const reference = ticket.boardedAt ?? ticket.createdAt;
    const end = ticket.completedAt;
    let totalTravelTimeMinutes: number | undefined;
    if (end) {
      totalTravelTimeMinutes = Math.max(
        0,
        Math.round((end.getTime() - reference.getTime()) / 60000),
      );
    }

    const firstHistory = [...(ticket.histories ?? [])].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    )[0];

    return plainToInstance(ResponseCitizenTicketDto, {
      ...base,
      routeName: ticket.scheduler?.route?.name,
      routeId: ticket.scheduler?.route?.id,
      busPlate: ticket.scheduler?.bus?.plate,
      totalTravelTimeMinutes,
      tripDetailHistoryId: firstHistory?.id,
    });
  }

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
    if (!createTicketDto.schedulerId) {
      throw new BadRequestException('schedulerId is required');
    }

    const sch = await this.schedulerRepository.findOne({
      where: { id: createTicketDto.schedulerId },
      relations: ['route'],
    });
    if (!sch) throw new BadRequestException('Scheduler not found');

    const ticketData: Partial<Ticket> = {
      citizen: createTicketDto.citizenId
        ? ({ id: createTicketDto.citizenId } as Citizen)
        : undefined,
      paymentMethodCitizen: createTicketDto.paymentMethodCitizenId
        ? ({
            id: createTicketDto.paymentMethodCitizenId,
          } as PaymentMethodCitizen)
        : undefined,
      scheduler: { id: createTicketDto.schedulerId } as Scheduler,
      status: createTicketDto.status ?? TicketStatus.ACTIVE,
    };
    const ticket = this.ticketRepository.create(ticketData);

    const saved = await this.ticketRepository.save(ticket);
    const withRelations = await this.ticketRepository.findOne({
      where: { id: saved.id },
      relations: ['scheduler', 'scheduler.route'],
    });
    return this.toResponse(withRelations ?? saved);
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
      relations: ['citizen', 'scheduler', 'scheduler.route'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: items.map((item) => this.toResponse(item)),
      meta: this.buildPaginationMeta(page, limit, totalItems),
    };
  }

  async findForCitizen(citizenId: string, query: TicketQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where: { citizen: { id: string }; status?: TicketStatus } = {
      citizen: { id: citizenId },
    };
    if (query.status) {
      where.status = query.status;
    }

    const [items, totalItems] = await this.ticketRepository.findAndCount({
      where,
      relations: [
        'citizen',
        'scheduler',
        'scheduler.route',
        'scheduler.bus',
        'histories',
      ],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: items.map((item) => this.toCitizenResponse(item)),
      meta: this.buildPaginationMeta(page, limit, totalItems),
    };
  }

  async findOne(id: string) {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
      relations: ['citizen', 'scheduler', 'scheduler.route'],
    });
    if (!ticket) throw new NotFoundException(`Ticket ${id} not found`);
    return this.toResponse(ticket);
  }

  async countActiveTicketsByBus(busId: string): Promise<number> {
    return this.ticketRepository
      .createQueryBuilder('ticket')
      .innerJoin('ticket.scheduler', 'scheduler')
      .innerJoin('scheduler.bus', 'bus')
      .where('ticket.status = :active', { active: TicketStatus.ACTIVE })
      .andWhere('bus.id = :busId', { busId })
      .getCount();
  }

  async countActiveTicketsByBusIds(
    busIds: string[],
  ): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    if (!busIds.length) {
      return counts;
    }

    const rows = await this.ticketRepository
      .createQueryBuilder('ticket')
      .innerJoin('ticket.scheduler', 'scheduler')
      .innerJoin('scheduler.bus', 'bus')
      .select('bus.id', 'busId')
      .addSelect('COUNT(ticket.id)', 'count')
      .where('ticket.status = :active', { active: TicketStatus.ACTIVE })
      .andWhere('bus.id IN (:...busIds)', { busIds })
      .groupBy('bus.id')
      .getRawMany<{ busId: string; count: string }>();

    for (const busId of busIds) {
      counts.set(busId, 0);
    }
    for (const row of rows) {
      counts.set(row.busId, Number.parseInt(row.count, 10) || 0);
    }
    return counts;
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
      status: updateTicketDto.status,
    };
    const ticket = await this.ticketRepository.preload(preloadData);
    if (!ticket) throw new NotFoundException(`Ticket ${id} not found`);
    const saved = await this.ticketRepository.save(ticket);
    const withRelations = await this.ticketRepository.findOne({
      where: { id: saved.id },
      relations: ['scheduler', 'scheduler.route'],
    });
    return this.toResponse(withRelations ?? saved);
  }

  async remove(id: string) {
    const ticket = await this.ticketRepository.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException(`Ticket ${id} not found`);
    await this.ticketRepository.delete(id);
    return;
  }

  async alightTicket(
    ticketId: string,
    alightTicketDto: AlightTicketDto,
    citizenId: string,
  ): Promise<AlightResponseDto> {
    const alightNode = await this.nodeRepository.findOne({
      where: { id: alightTicketDto.nodeId },
      relations: ['stop', 'route'],
    });

    if (!alightNode) {
      throw new NotFoundException(
        `Node (stop) ${alightTicketDto.nodeId} not found`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const ticket = await manager.findOne(Ticket, {
        where: { id: ticketId },
        relations: [
          'citizen',
          'scheduler',
          'scheduler.bus',
          'scheduler.route',
          'histories',
          'histories.node',
          'histories.node.stop',
        ],
        lock: { mode: 'pessimistic_write' },
      });

      if (!ticket) {
        throw new NotFoundException(`Ticket ${ticketId} not found`);
      }

      if (ticket.citizen?.id !== citizenId) {
        throw new ForbiddenException(
          'Este boleto no pertenece al ciudadano autenticado',
        );
      }

      if (ticket.status !== TicketStatus.ACTIVE) {
        throw new BadRequestException(
          `Ticket is not active. Current status: ${ticket.status}`,
        );
      }

      if (ticket.scheduler?.bus?.id !== alightTicketDto.busId) {
        throw new BadRequestException('Bus ID does not match the ticket bus');
      }

      if (alightNode.route?.id !== ticket.scheduler?.route?.id) {
        throw new BadRequestException(
          'Node does not belong to the ticket route',
        );
      }

      const now = new Date();
      const alightHistory = manager.create(History, {
        ticket,
        node: alightNode,
        eventType: HistoryEventType.ALIGHTING,
      });

      await manager.save(alightHistory);

      ticket.status = TicketStatus.COMPLETED;
      ticket.completedAt = now;
      await manager.save(ticket);

      let totalTravelTime = 0;
      const allHistories = [
        ...(ticket.histories ?? []),
        { ...alightHistory, createdAt: now },
      ];
      if (allHistories.length > 0) {
        const times = allHistories.map((h) =>
          ('createdAt' in h && h.createdAt ? h.createdAt : now).getTime(),
        );
        const firstTime = Math.min(...times);
        const lastTime = Math.max(...times);
        totalTravelTime = Math.round((lastTime - firstTime) / 60000);
      }

      const response = new AlightResponseDto();
      response.message = 'Viaje completado - Gracias por usar nuestro servicio';
      response.ticketId = ticket.id;
      response.completedAt = now;
      response.stopName = alightNode.stop?.name ?? 'Unknown Stop';
      response.totalTravelTime = totalTravelTime;
      return response;
    });
  }
}
