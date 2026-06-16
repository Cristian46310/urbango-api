import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { CreateSchedulerDto } from './dto/create-scheduler.dto';
import { UpdateSchedulerDto } from './dto/update-scheduler.dto';
import {
  RecurrenceType,
  Scheduler,
  SchedulerStatus,
} from './entities/scheduler.entity';
import { Bus } from '@/bus/entities/bus.entity';
import { BusService } from '@/bus/bus.service';
import { Route } from '@/route/entities/route.entity';
import { plainToInstance } from 'class-transformer';
import { ResponseSchedulerDto } from './dto/response-scheduler.dto';
import { ResponseSchedulerListDto } from './dto/response-scheduler-list.dto';
import { Turn, TurnStatus } from '@/turn/entities/turn.entity';
import { SchedulerQueryDto } from './dto/scheduler-query.dto';

@Injectable()
export class SchedulerService {
  constructor(
    @InjectRepository(Scheduler)
    private readonly schedulerRepository: Repository<Scheduler>,
    @InjectRepository(Bus)
    private readonly busRepository: Repository<Bus>,
    @InjectRepository(Route)
    private readonly routeRepository: Repository<Route>,
    private readonly busService: BusService,
    @InjectRepository(Turn)
    private readonly turnRepository: Repository<Turn>,
  ) {}

  private toResponseDto(scheduler: Scheduler): ResponseSchedulerDto {
    return plainToInstance(ResponseSchedulerDto, {
      ...scheduler,
      departureTime: scheduler.startTime,
    });
  }

  private parseDepartureTime(value: string, date: string): Date {
    const isTimeOnly = /^\d{2}:\d{2}(:\d{2})?$/.test(value);
    const normalizedValue = isTimeOnly ? `${date}T${value}` : value;
    const departureTime = new Date(normalizedValue);

    if (Number.isNaN(departureTime.getTime())) {
      throw new BadRequestException('Hora de salida inválida');
    }

    return departureTime;
  }

  private computeRouteDurationMinutes(route: Route): number {
    const nodes = route.nodes ?? [];
    if (nodes.length === 0) {
      throw new BadRequestException(
        'La ruta no tiene paraderos configurados para calcular la duración del servicio',
      );
    }

    return nodes.reduce(
      (total, node) => total + Number(node.estimatedTimeMinutes),
      0,
    );
  }

  private computeEndTime(departureTime: Date, route: Route): Date {
    const durationMinutes = Math.max(
      1,
      this.computeRouteDurationMinutes(route),
    );
    return new Date(departureTime.getTime() + durationMinutes * 60 * 1000);
  }

  private getEffectiveWindowStart(
    departureTime: Date,
    toleranceMinutes: number,
  ): Date {
    return new Date(departureTime.getTime() - toleranceMinutes * 60 * 1000);
  }

  private async validateBusAvailability(
    busId: string,
    date: string,
    departureTime: Date,
    endTime: Date,
    toleranceMinutes: number,
    excludeSchedulerId?: string,
  ) {
    const effectiveStart = this.getEffectiveWindowStart(
      departureTime,
      toleranceMinutes,
    );

    const query = this.schedulerRepository
      .createQueryBuilder('scheduler')
      .where('scheduler.bus_id = :busId', { busId })
      .andWhere('scheduler.date = :date', { date })
      .andWhere('scheduler.status = :status', {
        status: SchedulerStatus.SCHEDULED,
      })
      .andWhere(
        `(scheduler.startTime - (scheduler.toleranceMinutes * interval '1 minute')) < :effectiveEnd`,
        { effectiveEnd: endTime },
      )
      .andWhere('scheduler.endTime > :effectiveStart', { effectiveStart });

    if (excludeSchedulerId) {
      query.andWhere('scheduler.id != :excludeSchedulerId', {
        excludeSchedulerId,
      });
    }

    const overlappingScheduler = await query.getOne();

    if (overlappingScheduler) {
      throw new ConflictException(
        'El bus ya tiene una programación en ese horario',
      );
    }
  }

  private async validateDriverAssignment(
    busId: string,
    departureTime: Date,
    endTime: Date,
    toleranceMinutes: number,
  ) {
    const effectiveStart = this.getEffectiveWindowStart(
      departureTime,
      toleranceMinutes,
    );

    const turn = await this.turnRepository.findOne({
      where: [
        {
          bus: { id: busId },
          startTime: LessThanOrEqual(effectiveStart),
          endTime: MoreThanOrEqual(endTime),
          status: TurnStatus.SCHEDULED,
        },
        {
          bus: { id: busId },
          startTime: LessThanOrEqual(effectiveStart),
          endTime: MoreThanOrEqual(endTime),
          status: TurnStatus.IN_PROGRESS,
        },
      ],
      relations: ['bus', 'driver'],
    });

    if (!turn?.driver?.id) {
      throw new BadRequestException(
        'No hay conductor asignado para este bus en el horario de la programación',
      );
    }
  }

  async create(
    createSchedulerDto: CreateSchedulerDto,
  ): Promise<ResponseSchedulerDto> {
    const bus = await this.busRepository.findOne({
      where: { id: createSchedulerDto.busId },
    });
    if (!bus) throw new BadRequestException('Bus not found');
    this.busService.assertBusAvailableForScheduling(bus);

    const route = await this.routeRepository.findOne({
      where: { id: createSchedulerDto.routeId },
      relations: ['nodes'],
    });
    if (!route) throw new BadRequestException('Route not found');

    const departureTime = this.parseDepartureTime(
      createSchedulerDto.departureTime,
      createSchedulerDto.date,
    );
    const endTime = this.computeEndTime(departureTime, route);
    const toleranceMinutes = createSchedulerDto.toleranceMinutes ?? 0;

    await this.validateBusAvailability(
      bus.id,
      createSchedulerDto.date,
      departureTime,
      endTime,
      toleranceMinutes,
    );
    await this.validateDriverAssignment(
      bus.id,
      departureTime,
      endTime,
      toleranceMinutes,
    );

    const scheduler = this.schedulerRepository.create({
      bus: { id: bus.id } as Bus,
      route: { id: route.id } as Route,
      date: createSchedulerDto.date,
      startTime: departureTime,
      endTime,
      status: SchedulerStatus.SCHEDULED,
      toleranceMinutes,
      recurrenceType: createSchedulerDto.recurrenceType ?? RecurrenceType.NONE,
    });
    const saved = await this.schedulerRepository.save(scheduler);
    return this.toResponseDto(saved);
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

  async findAll(query: SchedulerQueryDto): Promise<ResponseSchedulerListDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where: FindOptionsWhere<Scheduler> = {
      status: query.status ?? SchedulerStatus.SCHEDULED,
    };

    if (query.date) where.date = query.date;
    if (query.routeId) where.route = { id: query.routeId };
    if (query.busId) where.bus = { id: query.busId };

    const [items, totalItems] = await this.schedulerRepository.findAndCount({
      where,
      relations: ['bus', 'route'],
      order: { startTime: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: items.map((item) => this.toResponseDto(item)),
      meta: this.buildPaginationMeta(page, limit, totalItems),
    };
  }

  async findOne(id: string): Promise<ResponseSchedulerDto> {
    const scheduler = await this.schedulerRepository.findOne({
      where: { id },
      relations: ['bus', 'route'],
    });
    if (!scheduler) throw new NotFoundException(`Scheduler ${id} not found`);
    return this.toResponseDto(scheduler);
  }

  async update(
    id: string,
    updateSchedulerDto: UpdateSchedulerDto,
  ): Promise<ResponseSchedulerDto> {
    const existing = await this.schedulerRepository.findOne({
      where: { id },
      relations: ['bus', 'route', 'route.nodes'],
    });
    if (!existing) throw new NotFoundException(`Scheduler ${id} not found`);

    const busId = updateSchedulerDto.busId ?? existing.bus.id;
    const routeId = updateSchedulerDto.routeId ?? existing.route.id;
    const date = updateSchedulerDto.date ?? existing.date;
    const toleranceMinutes =
      updateSchedulerDto.toleranceMinutes ?? existing.toleranceMinutes;

    if (updateSchedulerDto.busId) {
      const bus = await this.busRepository.findOne({
        where: { id: updateSchedulerDto.busId },
      });
      if (!bus) throw new BadRequestException('Bus not found');
      this.busService.assertBusAvailableForScheduling(bus);
    }

    let route = existing.route;
    if (updateSchedulerDto.routeId) {
      const loadedRoute = await this.routeRepository.findOne({
        where: { id: updateSchedulerDto.routeId },
        relations: ['nodes'],
      });
      if (!loadedRoute) throw new BadRequestException('Route not found');
      route = loadedRoute;
    } else if (!route.nodes?.length) {
      const loadedRoute = await this.routeRepository.findOne({
        where: { id: route.id },
        relations: ['nodes'],
      });
      if (loadedRoute) route = loadedRoute;
    }

    const departureTime = updateSchedulerDto.departureTime
      ? this.parseDepartureTime(updateSchedulerDto.departureTime, date)
      : existing.startTime;
    const endTime = this.computeEndTime(departureTime, route);

    await this.validateBusAvailability(
      busId,
      date,
      departureTime,
      endTime,
      toleranceMinutes,
      id,
    );
    await this.validateDriverAssignment(
      busId,
      departureTime,
      endTime,
      toleranceMinutes,
    );

    existing.bus = { id: busId } as Bus;
    existing.route = { id: routeId } as Route;
    existing.date = date;
    existing.startTime = departureTime;
    existing.endTime = endTime;
    existing.toleranceMinutes = toleranceMinutes;

    if (updateSchedulerDto.recurrenceType !== undefined) {
      existing.recurrenceType = updateSchedulerDto.recurrenceType;
    }
    if (updateSchedulerDto.status !== undefined) {
      existing.status = updateSchedulerDto.status;
    }

    const saved = await this.schedulerRepository.save(existing);
    return this.toResponseDto(saved);
  }

  async remove(id: string): Promise<void> {
    const scheduler = await this.schedulerRepository.findOne({ where: { id } });
    if (!scheduler) throw new NotFoundException(`Scheduler ${id} not found`);
    await this.schedulerRepository.delete(id);
  }
}
