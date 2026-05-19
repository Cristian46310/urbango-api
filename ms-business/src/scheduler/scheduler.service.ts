import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
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
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import { ResponseSchedulerListDto } from './dto/response-scheduler-list.dto';
import { Turn, TurnStatus } from '@/turn/entities/turn.entity';

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

  private getDateValue(date: string | undefined, startTime: Date): string {
    return date ?? startTime.toISOString().slice(0, 10);
  }

  private parseDateTime(value: string, date?: string): Date {
    const isTimeOnly = /^\d{2}:\d{2}(:\d{2})?$/.test(value);
    const normalizedValue = isTimeOnly ? `${date}T${value}` : value;

    if (isTimeOnly && !date) {
      throw new BadRequestException('date is required when time has no date');
    }

    return new Date(normalizedValue);
  }

  private validateTimeRange(startTime: Date, endTime: Date) {
    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      throw new BadRequestException('Invalid scheduler time range');
    }

    if (startTime >= endTime) {
      throw new BadRequestException('endTime must be after startTime');
    }
  }

  private async validateBusAvailability(
    busId: string,
    date: string,
    startTime: Date,
    endTime: Date,
  ) {
    const overlappingScheduler = await this.schedulerRepository
      .createQueryBuilder('scheduler')
      .where('scheduler.bus_id = :busId', { busId })
      .andWhere('scheduler.date = :date', { date })
      .andWhere('scheduler.status = :status', {
        status: SchedulerStatus.SCHEDULED,
      })
      .andWhere('scheduler.startTime < :endTime', { endTime })
      .andWhere('scheduler.endTime > :startTime', { startTime })
      .getOne();

    if (overlappingScheduler) {
      throw new ConflictException(
        'El bus ya tiene una programación en ese horario',
      );
    }
  }

  private async validateDriverAssignment(
    busId: string,
    startTime: Date,
    endTime: Date,
  ) {
    const turn = await this.turnRepository.findOne({
      where: [
        {
          bus: { id: busId },
          startTime: LessThanOrEqual(startTime),
          endTime: MoreThanOrEqual(endTime),
          status: TurnStatus.SCHEDULED,
        },
        {
          bus: { id: busId },
          startTime: LessThanOrEqual(startTime),
          endTime: MoreThanOrEqual(endTime),
          status: TurnStatus.IN_PROGRESS,
        },
      ],
      relations: ['bus', 'driver'],
    });

    if (!turn) {
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
    });
    if (!route) throw new BadRequestException('Route not found');

    const startTime = this.parseDateTime(
      createSchedulerDto.startTime,
      createSchedulerDto.date,
    );
    const endTime = this.parseDateTime(
      createSchedulerDto.endTime,
      createSchedulerDto.date,
    );
    this.validateTimeRange(startTime, endTime);
    const date = this.getDateValue(createSchedulerDto.date, startTime);

    await this.validateBusAvailability(bus.id, date, startTime, endTime);
    await this.validateDriverAssignment(bus.id, startTime, endTime);

    const scheduler = this.schedulerRepository.create({
      bus: { id: bus.id } as Bus,
      route: { id: route.id } as Route,
      date,
      startTime,
      endTime,
      status: createSchedulerDto.status ?? SchedulerStatus.SCHEDULED,
      toleranceMinutes: createSchedulerDto.toleranceMinutes ?? 0,
      recurrenceType: createSchedulerDto.recurrenceType ?? RecurrenceType.NONE,
    } as Partial<Scheduler>);
    const saved = await this.schedulerRepository.save(scheduler);
    return plainToInstance(ResponseSchedulerDto, saved);
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
  ): Promise<ResponseSchedulerListDto> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const [items, totalItems] = await this.schedulerRepository.findAndCount({
      relations: ['bus', 'route'],
      order: { startTime: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      items: plainToInstance(ResponseSchedulerDto, items),
      meta: this.buildPaginationMeta(page, limit, totalItems),
    };
  }

  async findOne(id: string): Promise<ResponseSchedulerDto> {
    const scheduler = await this.schedulerRepository.findOne({
      where: { id },
      relations: ['bus', 'route'],
    });
    if (!scheduler) throw new NotFoundException(`Scheduler ${id} not found`);
    return plainToInstance(ResponseSchedulerDto, scheduler);
  }

  async update(
    id: string,
    updateSchedulerDto: UpdateSchedulerDto,
  ): Promise<ResponseSchedulerDto> {
    const preloadData: Partial<Scheduler> = { id };
    if (updateSchedulerDto.busId) {
      const bus = await this.busRepository.findOne({
        where: { id: updateSchedulerDto.busId },
      });
      if (!bus) throw new BadRequestException('Bus not found');
      this.busService.assertBusAvailableForScheduling(bus);
      preloadData.bus = { id: bus.id } as Bus;
    }
    if (updateSchedulerDto.routeId) {
      const route = await this.routeRepository.findOne({
        where: { id: updateSchedulerDto.routeId },
      });
      if (!route) throw new BadRequestException('Route not found');
      preloadData.route = { id: route.id } as Route;
    }
    if (updateSchedulerDto.startTime)
      preloadData.startTime = new Date(updateSchedulerDto.startTime);
    if (updateSchedulerDto.endTime)
      preloadData.endTime = new Date(updateSchedulerDto.endTime);
    if (updateSchedulerDto.date) preloadData.date = updateSchedulerDto.date;
    if (updateSchedulerDto.status)
      preloadData.status = updateSchedulerDto.status;
    if (updateSchedulerDto.toleranceMinutes !== undefined)
      preloadData.toleranceMinutes = updateSchedulerDto.toleranceMinutes;
    if (updateSchedulerDto.recurrenceType !== undefined)
      preloadData.recurrenceType = updateSchedulerDto.recurrenceType;

    const scheduler = await this.schedulerRepository.preload(preloadData);
    if (!scheduler) throw new NotFoundException(`Scheduler ${id} not found`);
    const saved = await this.schedulerRepository.save(scheduler);
    return plainToInstance(ResponseSchedulerDto, saved);
  }

  async remove(id: string): Promise<void> {
    const scheduler = await this.schedulerRepository.findOne({ where: { id } });
    if (!scheduler) throw new NotFoundException(`Scheduler ${id} not found`);
    await this.schedulerRepository.delete(id);
    return;
  }
}
