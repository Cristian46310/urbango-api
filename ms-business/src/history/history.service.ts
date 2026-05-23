import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateHistoryDto } from './dto/create-history.dto';
import { UpdateHistoryDto } from './dto/update-history.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { History } from './entities/history.entity';
import { Ticket } from '@/ticket/entities/ticket.entity';
import { Turn } from '@/turn/entities/turn.entity';
import { Bus } from '@/bus/entities/bus.entity';
import { Driver } from '@/driver/entities/driver.entity';
import { Node } from '@/node/entities/node.entity';
import { ResponseTripDetailsDto } from './dto/response-trip-details.dto';
import { plainToInstance } from 'class-transformer';
import { ResponseRouteDto } from '@/route/dto/response-route.dto';
import { ResponseBusDto } from '@/bus/dto/response-bus.dto';
import { ResponseDriverDto } from '@/driver/dto/response-driver.dto';
import { ResponseTurnDto } from '@/turn/dto/response-turn.dto';
import { ResponseSchedulerDto } from '@/scheduler/dto/response-scheduler.dto';
import { ResponseStopDto } from '@/stop/dto/response-stop.dto';
import { CitizenSummaryDto } from './dto/citizen-summary.dto';
import { ResponseHistoryDto } from './dto/response-history.dto';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(History)
    private readonly historyRepository: Repository<History>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(Turn)
    private readonly turnRepository: Repository<Turn>,
    @InjectRepository(Bus)
    private readonly busRepository: Repository<Bus>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    @InjectRepository(Node)
    private readonly nodeRepository: Repository<Node>,
  ) {}
  async create(createHistoryDto: CreateHistoryDto) {
    if (createHistoryDto.ticketId) {
      const t = await this.ticketRepository.findOne({
        where: { id: createHistoryDto.ticketId },
      });
      if (!t) throw new BadRequestException('Ticket not found');
    }
    if (createHistoryDto.nodeId) {
      const n = await this.nodeRepository.findOne({
        where: { id: createHistoryDto.nodeId },
      });
      if (!n) throw new BadRequestException('Node not found');
    }

    const histData: Partial<History> = {
      ticket: createHistoryDto.ticketId
        ? ({ id: createHistoryDto.ticketId } as Ticket)
        : undefined,
      node: createHistoryDto.nodeId
        ? ({ id: createHistoryDto.nodeId } as Node)
        : undefined,
      order: createHistoryDto.order,
      eventType: createHistoryDto.eventType,
      eventTimestamp: createHistoryDto.eventTimestamp
        ? new Date(createHistoryDto.eventTimestamp)
        : undefined,
    };
    const hist = this.historyRepository.create(histData);

    const saved = await this.historyRepository.save(hist);
    return plainToInstance(ResponseHistoryDto, saved);
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
      items: plainToInstance(ResponseHistoryDto, items),
      meta: this.buildPaginationMeta(page, limit, totalItems),
    };
  }

  async findOne(id: string) {
    const hist = await this.historyRepository.findOne({
      where: { id },
      relations: ['ticket', 'node', 'node.stop'],
    });
    if (!hist) throw new NotFoundException(`History ${id} not found`);
    return plainToInstance(ResponseHistoryDto, hist);
  }

  async update(id: string, updateHistoryDto: UpdateHistoryDto) {
    if (updateHistoryDto.ticketId) {
      const t = await this.ticketRepository.findOne({
        where: { id: updateHistoryDto.ticketId },
      });
      if (!t) throw new BadRequestException('Ticket not found');
    }
    if (updateHistoryDto.nodeId) {
      const n = await this.nodeRepository.findOne({
        where: { id: updateHistoryDto.nodeId },
      });
      if (!n) throw new BadRequestException('Node not found');
    }

    const preloadData: Partial<History> = {
      id,
      ticket: updateHistoryDto.ticketId
        ? ({ id: updateHistoryDto.ticketId } as Ticket)
        : undefined,
      node: updateHistoryDto.nodeId
        ? ({ id: updateHistoryDto.nodeId } as Node)
        : undefined,
      order: updateHistoryDto.order,
      eventType: updateHistoryDto.eventType,
      eventTimestamp: updateHistoryDto.eventTimestamp
        ? new Date(updateHistoryDto.eventTimestamp)
        : undefined,
    };
    const hist = await this.historyRepository.preload(preloadData);
    if (!hist) throw new NotFoundException(`History ${id} not found`);
    const saved = await this.historyRepository.save(hist);
    return plainToInstance(ResponseHistoryDto, saved);
  }

  async remove(id: string) {
    const hist = await this.historyRepository.findOne({ where: { id } });
    if (!hist) throw new NotFoundException(`History ${id} not found`);
    await this.historyRepository.delete(id);
    return;
  }

  async getTripDetails(historyId: string): Promise<ResponseTripDetailsDto> {
    const history = await this.historyRepository.findOne({
      where: { id: historyId },
      relations: [
        'ticket',
        'ticket.scheduler',
        'ticket.scheduler.bus',
        'ticket.scheduler.route',
        'ticket.citizen',
        'node',
        'node.stop',
        'node.route',
      ],
    });

    if (!history || !history.ticket) {
      throw new NotFoundException(`History with id ${historyId} not found`);
    }

    const ticket = history.ticket;

    const histories = await this.historyRepository.find({
      where: { ticket: { id: ticket.id } },
      relations: ['node', 'node.stop'],
      order: { order: 'ASC' },
    });

    const times = histories.map((h) => h.createdAt.getTime());
    const first = Math.min(...times);
    const last = Math.max(...times);
    const totalMs = isFinite(last - first) ? last - first : 0;
    const minutes = Math.round(totalMs / 60000);

    // Bus and scheduler
    const scheduler = ticket.scheduler;
    const bus = scheduler?.bus;

    // Find active turn for the bus at ticket.buyedAt
    let turn: Turn | null = null;
    let driver: Driver | null = null;
    if (bus && ticket.buyedAt) {
      turn = await this.turnRepository.findOne({
        where: {
          bus: { id: bus.id },
          startTime: LessThanOrEqual(ticket.buyedAt),
          endTime: MoreThanOrEqual(ticket.buyedAt),
        },
        relations: ['driver'],
      });
      driver = turn?.driver ?? null;
    }

    const response: ResponseTripDetailsDto = plainToInstance(
      ResponseTripDetailsDto,
      {
        tripId: ticket.id,
        route: scheduler?.route
          ? plainToInstance(ResponseRouteDto, scheduler.route)
          : null,
        bus: bus ? plainToInstance(ResponseBusDto, bus) : null,
        driver: driver ? plainToInstance(ResponseDriverDto, driver) : null,
        turn: turn ? plainToInstance(ResponseTurnDto, turn) : null,
        scheduler: scheduler
          ? plainToInstance(ResponseSchedulerDto, {
              ...scheduler,
              departureTime: scheduler.startTime,
            })
          : null,
        validations: histories.map((h) => ({
          order: h.order,
          stop: h.node?.stop
            ? plainToInstance(ResponseStopDto, h.node.stop)
            : null,
          validatedAt: h.eventTimestamp ?? h.createdAt,
          type: h.eventType,
        })),
        totalTime: { minutes, formatted: `${minutes} min` },
        citizen: plainToInstance(CitizenSummaryDto, {
          id: ticket.citizen?.id ?? '',
          name: ticket.citizen?.name ?? '',
          document: ticket.citizen?.document ?? undefined,
        }),
      },
    );

    return response;
  }
}
