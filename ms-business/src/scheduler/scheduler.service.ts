import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSchedulerDto } from './dto/create-scheduler.dto';
import { UpdateSchedulerDto } from './dto/update-scheduler.dto';
import { Scheduler } from './entities/scheduler.entity';
import { Bus } from 'src/bus/entities/bus.entity';
import { Route } from 'src/route/entities/route.entity';
import { plainToInstance } from 'class-transformer';
import { ResponseSchedulerDto } from './dto/response-scheduler.dto';
import { PaginationQueryDto } from 'src/shared/dto/pagination-query.dto';
import { ResponseSchedulerListDto } from './dto/response-scheduler-list.dto';

@Injectable()
export class SchedulerService {
  constructor(
    @InjectRepository(Scheduler)
    private readonly schedulerRepository: Repository<Scheduler>,
    @InjectRepository(Bus)
    private readonly busRepository: Repository<Bus>,
    @InjectRepository(Route)
    private readonly routeRepository: Repository<Route>,
  ) {}

  async create(
    createSchedulerDto: CreateSchedulerDto,
  ): Promise<ResponseSchedulerDto> {
    const bus = await this.busRepository.findOne({
      where: { id: createSchedulerDto.busId },
    });
    if (!bus) throw new BadRequestException('Bus not found');
    const route = await this.routeRepository.findOne({
      where: { id: createSchedulerDto.routeId },
    });
    if (!route) throw new BadRequestException('Route not found');

    const scheduler = this.schedulerRepository.create({
      bus: { id: bus.id } as Bus,
      route: { id: route.id } as Route,
      startTime: new Date(createSchedulerDto.startTime),
      endTime: new Date(createSchedulerDto.endTime),
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
