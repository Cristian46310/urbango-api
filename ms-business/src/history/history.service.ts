import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateHistoryDto } from './dto/create-history.dto';
import { UpdateHistoryDto } from './dto/update-history.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { History } from './entities/history.entity';
import { Ticket } from '@/ticket/entities/ticket.entity';
import { Turn, TurnStatus } from '@/turn/entities/turn.entity';
import { Node } from '@/node/entities/node.entity';
import { ResponseTripDetailsDto } from './dto/response-trip-details.dto';
import { plainToInstance } from 'class-transformer';
import { ResponseBusDto } from '@/bus/dto/response-bus.dto';
import { ResponseDriverDto } from '@/driver/dto/response-driver.dto';
import { ResponseTurnDto } from '@/turn/dto/response-turn.dto';
import { ResponseSchedulerDto } from '@/scheduler/dto/response-scheduler.dto';
import { ResponseStopDto } from '@/stop/dto/response-stop.dto';
import { CitizenSummaryDto } from './dto/citizen-summary.dto';
import { ResponseHistoryDto } from './dto/response-history.dto';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import { RouteService } from '@/route/route.service';

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(History)
    private readonly historyRepository: Repository<History>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(Turn)
    private readonly turnRepository: Repository<Turn>,
    @InjectRepository(Node)
    private readonly nodeRepository: Repository<Node>,
    private readonly routeService: RouteService,
  ) {}

  private toResponse(history: History): ResponseHistoryDto {
    return plainToInstance(ResponseHistoryDto, {
      id: history.id,
      ticketId: history.ticket?.id,
      nodeId: history.node?.id,
      nodeOrder: history.node?.order,
      eventType: history.eventType,
      createdAt: history.createdAt,
    });
  }

  async create(createHistoryDto: CreateHistoryDto) {
    const t = await this.ticketRepository.findOne({
      where: { id: createHistoryDto.ticketId },
    });
    if (!t) throw new BadRequestException('Ticket not found');

    const n = await this.nodeRepository.findOne({
      where: { id: createHistoryDto.nodeId },
    });
    if (!n) throw new BadRequestException('Node not found');

    const hist = this.historyRepository.create({
      ticket: { id: createHistoryDto.ticketId } as Ticket,
      node: { id: createHistoryDto.nodeId } as Node,
      eventType: createHistoryDto.eventType,
    });

    const saved = await this.historyRepository.save(hist);
    const withRelations = await this.historyRepository.findOne({
      where: { id: saved.id },
      relations: ['ticket', 'node'],
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
    const [items, totalItems] = await this.historyRepository.findAndCount({
      relations: ['ticket', 'node', 'node.stop'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: items.map((item) => this.toResponse(item)),
      meta: this.buildPaginationMeta(page, limit, totalItems),
    };
  }

  async findOne(id: string) {
    const hist = await this.historyRepository.findOne({
      where: { id },
      relations: ['ticket', 'node', 'node.stop'],
    });
    if (!hist) throw new NotFoundException(`History ${id} not found`);
    return this.toResponse(hist);
  }

  async update(id: string, updateHistoryDto: UpdateHistoryDto) {
    const hist = await this.historyRepository.findOne({
      where: { id },
      relations: ['ticket', 'node'],
    });
    if (!hist) throw new NotFoundException(`History ${id} not found`);

    if (updateHistoryDto.ticketId) {
      const t = await this.ticketRepository.findOne({
        where: { id: updateHistoryDto.ticketId },
      });
      if (!t) throw new BadRequestException('Ticket not found');
      hist.ticket = { id: updateHistoryDto.ticketId } as Ticket;
    }
    if (updateHistoryDto.nodeId) {
      const n = await this.nodeRepository.findOne({
        where: { id: updateHistoryDto.nodeId },
      });
      if (!n) throw new BadRequestException('Node not found');
      hist.node = { id: updateHistoryDto.nodeId } as Node;
    }

    const saved = await this.historyRepository.save(hist);
    return this.toResponse(saved);
  }

  async remove(id: string) {
    const hist = await this.historyRepository.findOne({ where: { id } });
    if (!hist) throw new NotFoundException(`History ${id} not found`);
    await this.historyRepository.delete(id);
    return;
  }

  private formatTravelMinutes(minutes: number): string {
    const safe = Math.max(0, minutes);
    const hours = Math.floor(safe / 60);
    const mins = safe % 60;
    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h${mins}m`;
  }

  private async findTurnForTicket(
    busId: string,
    boardedAt: Date,
  ): Promise<Turn | null> {
    return this.turnRepository
      .createQueryBuilder('turn')
      .leftJoinAndSelect('turn.driver', 'driver')
      .where('turn.busId = :busId', { busId })
      .andWhere(
        `(turn.status = :inProgress
          OR (turn.startTime <= :boardedAt AND (turn.endTime IS NULL OR turn.endTime >= :boardedAt))
          OR (turn.actualStartTime IS NOT NULL AND turn.actualStartTime <= :boardedAt
              AND (turn.endTime IS NULL OR turn.endTime >= :boardedAt)))`,
        {
          inProgress: TurnStatus.IN_PROGRESS,
          boardedAt,
        },
      )
      .orderBy('turn.actualStartTime', 'DESC', 'NULLS LAST')
      .addOrderBy('turn.startTime', 'DESC')
      .getOne();
  }

  private async buildTripDetailsForTicket(
    ticket: Ticket,
  ): Promise<ResponseTripDetailsDto> {
    const histories = await this.historyRepository.find({
      where: { ticket: { id: ticket.id } },
      relations: ['node', 'node.stop'],
      order: { createdAt: 'ASC' },
    });

    const referenceTime = ticket.boardedAt ?? ticket.createdAt;
    const endTime = ticket.completedAt ?? new Date();
    const totalMs = Math.max(0, endTime.getTime() - referenceTime.getTime());
    const minutes = Math.round(totalMs / 60000);

    const scheduler = ticket.scheduler;
    const bus = scheduler?.bus;

    let turn: Turn | null = null;
    if (bus) {
      turn = await this.findTurnForTicket(bus.id, referenceTime);
    }

    const route =
      scheduler?.route?.id != null
        ? await this.routeService.findOne(scheduler.route.id)
        : null;

    return plainToInstance(ResponseTripDetailsDto, {
      tripId: ticket.id,
      route,
      bus: bus ? plainToInstance(ResponseBusDto, bus) : null,
      driver: turn?.driver
        ? plainToInstance(ResponseDriverDto, turn.driver)
        : null,
      turn: turn ? plainToInstance(ResponseTurnDto, turn) : null,
      scheduler: scheduler
        ? plainToInstance(ResponseSchedulerDto, {
            ...scheduler,
            departureTime: scheduler.startTime,
          })
        : null,
      validations: histories.map((h) => ({
        order: h.node?.order,
        stop: h.node?.stop
          ? plainToInstance(ResponseStopDto, h.node.stop)
          : null,
        validatedAt: h.createdAt,
        type: h.eventType,
      })),
      totalTime: {
        minutes,
        formatted: this.formatTravelMinutes(minutes),
      },
      citizen: plainToInstance(CitizenSummaryDto, {
        id: ticket.citizen?.id ?? '',
        name: ticket.citizen?.name ?? '',
        document: ticket.citizen?.document ?? undefined,
      }),
    });
  }

  private async loadTicketForTripDetails(ticketId: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
      relations: ['scheduler', 'scheduler.bus', 'scheduler.route', 'citizen'],
    });
    if (!ticket) {
      throw new NotFoundException(`Ticket ${ticketId} not found`);
    }
    return ticket;
  }

  async getTripDetails(historyId: string): Promise<ResponseTripDetailsDto> {
    const history = await this.historyRepository.findOne({
      where: { id: historyId },
      relations: ['ticket'],
    });

    if (!history?.ticket) {
      throw new NotFoundException(`History with id ${historyId} not found`);
    }

    const ticket = await this.loadTicketForTripDetails(history.ticket.id);
    return this.buildTripDetailsForTicket(ticket);
  }

  async getTripDetailsByTicketId(
    ticketId: string,
    citizenId?: string,
  ): Promise<ResponseTripDetailsDto> {
    const ticket = await this.loadTicketForTripDetails(ticketId);

    if (citizenId && ticket.citizen?.id !== citizenId) {
      throw new ForbiddenException(
        'Este viaje no pertenece al ciudadano autenticado',
      );
    }

    return this.buildTripDetailsForTicket(ticket);
  }
}
