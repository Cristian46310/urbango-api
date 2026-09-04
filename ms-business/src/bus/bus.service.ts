import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateBusDto } from './dto/create-bus.dto';
import { UpdateBusDto } from './dto/update-bus.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Bus } from './entities/bus.entity';
import { Gps } from '@/gps/entities/gps.entity';
import { Enterprise } from '@/enterprise/entities/enterprise.entity';
import { Driver } from '@/driver/entities/driver.entity';
import { Turn, TurnStatus } from '@/turn/entities/turn.entity';
import {
  Scheduler,
  SchedulerStatus,
} from '@/scheduler/entities/scheduler.entity';
import { plainToInstance } from 'class-transformer';
import { ResponseBusDto } from './dto/response-bus.dto';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import { ResponseBusListDto } from './dto/response-bus-list.dto';
import { BusStatus } from './enums/bus-status.enum';
import * as QRCode from 'qrcode';

@Injectable()
export class BusService {
  constructor(
    @InjectRepository(Bus)
    private readonly busRepository: Repository<Bus>,
    @InjectRepository(Enterprise)
    private readonly enterpriseRepository: Repository<Enterprise>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    @InjectRepository(Turn)
    private readonly turnRepository: Repository<Turn>,
    @InjectRepository(Scheduler)
    private readonly schedulerRepository: Repository<Scheduler>,
  ) {}

  async resolveEnterpriseIdForUser(userId: string): Promise<string> {
    const driver = await this.driverRepository.findOne({
      where: { userId },
      relations: ['enterprise'],
    });

    const enterpriseId = driver?.enterprise?.id;
    if (enterpriseId) {
      return enterpriseId;
    }

    throw new BadRequestException(
      'Tu usuario no está asociado a una empresa. Registra tu perfil de conductor indicando la empresa.',
    );
  }

  async create(
    createBusDto: CreateBusDto,
    enterpriseId: string,
  ): Promise<ResponseBusDto> {
    this.validateCapacities(createBusDto);

    const ent = await this.enterpriseRepository.findOne({
      where: { id: enterpriseId },
    });
    if (!ent) {
      throw new BadRequestException('Enterprise not found');
    }

    const plateTaken = await this.busRepository.findOne({
      where: { plate: createBusDto.plate },
    });
    if (plateTaken) {
      throw new ConflictException(
        `A bus with plate "${createBusDto.plate}" is already registered`,
      );
    }

    const bus = this.busRepository.create({
      ...createBusDto,
      color: createBusDto.color?.trim() || 'Sin especificar',
      enterprise: { id: enterpriseId } as Enterprise,
    });

    const saved = await this.busRepository.save(bus);
    const qrCode = await this.generateQrCode(saved.id, enterpriseId, saved);
    return this.toResponse(saved, qrCode);
  }

  async findAll(
    paginationQuery: PaginationQueryDto,
    enterpriseId?: string,
  ): Promise<ResponseBusListDto> {
    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;

    const [items, totalItems] = await this.busRepository.findAndCount({
      where: enterpriseId ? { enterprise: { id: enterpriseId } } : {},
      relations: ['enterprise', 'photos'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: items.map((bus) => this.toResponse(bus)),
      meta: this.buildPaginationMeta(page, limit, totalItems),
    };
  }

  async findOne(id: string): Promise<ResponseBusDto> {
    const bus = await this.busRepository.findOne({
      where: { id },
      relations: ['enterprise', 'photos'],
    });
    if (!bus) throw new NotFoundException(`Bus ${id} not found`);
    return this.toResponse(bus);
  }

  async findAllWithGpsAndSchedules(enterpriseId?: string) {
    const qb = this.busRepository
      .createQueryBuilder('bus')
      .leftJoinAndMapOne('bus.gps', Gps, 'gps', 'gps."busId" = bus.id');

    if (enterpriseId) {
      qb.andWhere('bus.enterprise_id = :enterpriseId', { enterpriseId });
    }

    const buses = await qb.getMany();
    return this.attachRealtimeRelations(buses);
  }

  async findOneWithGpsAndSchedules(id: string) {
    const bus = await this.busRepository
      .createQueryBuilder('bus')
      .leftJoinAndMapOne('bus.gps', Gps, 'gps', 'gps."busId" = bus.id')
      .where('bus.id = :id', { id })
      .getOne();

    if (!bus) throw new NotFoundException(`Bus ${id} not found`);
    const [enriched] = await this.attachRealtimeRelations([bus]);
    return enriched;
  }

  /**
   * Loads turns/schedulers/routes in separate queries to avoid Cartesian explosion
   * (turns × schedulers × nodes) from a single multi-collection join.
   */
  private async attachRealtimeRelations(buses: Bus[]): Promise<Bus[]> {
    if (!buses.length) {
      return buses;
    }

    const busIds = buses.map((bus) => bus.id);
    const today = this.getLocalDateString(new Date());

    const [turns, schedulers] = await Promise.all([
      this.turnRepository.find({
        where: {
          bus: { id: In(busIds) },
          status: In([TurnStatus.SCHEDULED, TurnStatus.IN_PROGRESS]),
        },
        relations: ['bus'],
      }),
      this.schedulerRepository.find({
        where: {
          bus: { id: In(busIds) },
          status: SchedulerStatus.SCHEDULED,
          date: today,
        },
        relations: ['bus', 'route', 'route.nodes', 'route.nodes.stop'],
      }),
    ]);

    const turnsByBus = new Map<string, Turn[]>();
    for (const turn of turns) {
      const key = turn.bus?.id;
      if (!key) continue;
      const list = turnsByBus.get(key) ?? [];
      list.push(turn);
      turnsByBus.set(key, list);
    }

    const schedulersByBus = new Map<string, Scheduler[]>();
    for (const scheduler of schedulers) {
      const key = scheduler.bus?.id;
      if (!key) continue;
      const list = schedulersByBus.get(key) ?? [];
      list.push(scheduler);
      schedulersByBus.set(key, list);
    }

    for (const bus of buses) {
      bus.turns = turnsByBus.get(bus.id) ?? [];
      bus.schedulers = schedulersByBus.get(bus.id) ?? [];
    }

    return buses;
  }

  private getLocalDateString(date: Date): string {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date);
  }

  async update(
    id: string,
    updateBusDto: UpdateBusDto,
  ): Promise<ResponseBusDto> {
    const bus = await this.busRepository.findOne({
      where: { id },
      relations: ['enterprise', 'photos'],
    });
    if (!bus) throw new NotFoundException(`Bus ${id} not found`);

    if (
      updateBusDto.seatedCapacity !== undefined ||
      updateBusDto.standingCapacity !== undefined
    ) {
      this.validateCapacities({
        seatedCapacity: updateBusDto.seatedCapacity ?? bus.seatedCapacity,
        standingCapacity: updateBusDto.standingCapacity ?? bus.standingCapacity,
      });
    }

    Object.assign(bus, updateBusDto);
    const saved = await this.busRepository.save(bus);
    return this.toResponse(saved);
  }

  async remove(id: string): Promise<void> {
    const bus = await this.busRepository.findOne({ where: { id } });
    if (!bus) throw new NotFoundException(`Bus ${id} not found`);
    await this.busRepository.softDelete(id);
  }

  async assertBusBelongsToEnterprise(
    busId: string,
    enterpriseId: string,
  ): Promise<Bus> {
    const bus = await this.busRepository.findOne({
      where: { id: busId },
      relations: ['enterprise'],
    });
    if (!bus) {
      throw new NotFoundException(`Bus ${busId} not found`);
    }
    if (bus.enterprise?.id !== enterpriseId) {
      throw new ForbiddenException(
        'You do not have permission to modify this bus',
      );
    }
    return bus;
  }

  assertBusAvailableForScheduling(bus: Bus): void {
    if (bus.status !== BusStatus.OPERATIVO) {
      throw new BadRequestException(
        `Bus "${bus.plate}" is not available for scheduling (status: ${bus.status}). Only buses with status "operativo" can be assigned.`,
      );
    }
  }

  getTotalCapacity(bus: Bus): number {
    return (bus.seatedCapacity ?? 0) + (bus.standingCapacity ?? 0);
  }

  private validateCapacities(dto: {
    seatedCapacity?: number;
    standingCapacity?: number;
  }): void {
    const { seatedCapacity, standingCapacity } = dto;

    if (seatedCapacity != null && seatedCapacity < 0) {
      throw new BadRequestException('Seated capacity cannot be negative');
    }
    if (standingCapacity != null && standingCapacity < 0) {
      throw new BadRequestException('Standing capacity cannot be negative');
    }
    if (
      seatedCapacity != null &&
      standingCapacity != null &&
      seatedCapacity + standingCapacity === 0
    ) {
      throw new BadRequestException(
        'Bus must have at least one seat or standing place',
      );
    }
  }

  private async generateQrCode(
    busId: string,
    enterpriseId: string,
    bus: Pick<Bus, 'plate' | 'year' | 'model'>,
  ): Promise<string> {
    const qrData = {
      id: busId,
      plate: bus.plate,
      year: bus.year ?? null,
      model: bus.model ?? null,
      enterpriseId,
    };

    try {
      return await QRCode.toDataURL(JSON.stringify(qrData), {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 300,
      });
    } catch {
      throw new BadRequestException('Could not generate QR code for the bus');
    }
  }

  private toResponse(bus: Bus, qrCode?: string): ResponseBusDto {
    const dto = plainToInstance(ResponseBusDto, bus, {
      excludeExtraneousValues: true,
    });
    dto.enterpriseId = bus.enterprise?.id;
    dto.photoUrl = bus.photos?.[0]?.photoUrl;
    if (qrCode) {
      dto.qrCode = qrCode;
    }
    return dto;
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
}
