import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { Incident } from './entities/incident.entity';
import { IncidentBus } from './entities/incident-bus.entity';
import { Bus } from '@/bus/entities/bus.entity';
import { Turn, TurnStatus } from '@/turn/entities/turn.entity';
import { Driver } from '@/driver/entities/driver.entity';
import { CreateIncidentDriverDto } from './dto/create-incident-driver.dto';
import { IncidentNotificationService } from './incident-notification.service';
import { IncidentPhotoService } from '@/incident-photo/incident-photo.service';
import { IncidentStorageFile } from '@/incident-photo/incident-storage.service';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import { JwtPayload } from '@/auth/types';
import {
  IncidentSeverity,
  IncidentStatus,
  IncidentType,
} from './enums/incident.enum';
import { BusIncidentQueryDto } from './dto/bus-incident-query.dto';
import { ResponseBusIncidentListDto } from './dto/response-bus-incident-list.dto';
import { ResponseIncidentDto } from './dto/response-incident.dto';
import { ResponseIncidentDriverDto } from './dto/response-incident-driver.dto';
import { ResponseIncidentPhotoDto } from '@/incident-photo/dto/response-incident-photo.dto';
import { ResponseIncidentStatisticsDto } from './dto/response-incident-statistics.dto';
import { UpdateIncidentStatusDto } from './dto/update-incident-status.dto';

const ALLOWED_STATUS_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  [IncidentStatus.REPORTED]: [IncidentStatus.IN_REVIEW, IncidentStatus.CLOSED],
  [IncidentStatus.IN_REVIEW]: [IncidentStatus.CLOSED, IncidentStatus.REPORTED],
  [IncidentStatus.CLOSED]: [IncidentStatus.IN_REVIEW],
};

@Injectable()
export class IncidentService {
  private readonly logger = new Logger(IncidentService.name);

  constructor(
    @InjectRepository(Incident)
    private readonly incidentRepository: Repository<Incident>,
    @InjectRepository(IncidentBus)
    private readonly incidentBusRepository: Repository<IncidentBus>,
    @InjectRepository(Bus)
    private readonly busRepository: Repository<Bus>,
    @InjectRepository(Turn)
    private readonly turnRepository: Repository<Turn>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    private readonly incidentPhotoService: IncidentPhotoService,
    private readonly incidentNotificationService: IncidentNotificationService,
  ) {}

  private isTurnActive(turn: Turn, now: Date) {
    if (turn.status === TurnStatus.IN_PROGRESS) {
      return true;
    }
    return turn.startTime <= now && (!turn.endTime || turn.endTime >= now);
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

  private createBusIncidentQueryBuilder(busId: string) {
    return this.incidentRepository
      .createQueryBuilder('incident')
      .innerJoin('incident.incidentBuses', 'ib', 'ib.bus_id = :busId', {
        busId,
      });
  }

  private applyBusIncidentFilters(
    qb: ReturnType<IncidentService['createBusIncidentQueryBuilder']>,
    query: BusIncidentQueryDto,
  ) {
    if (query.type) {
      qb.andWhere('incident.type = :type', { type: query.type });
    }
    if (query.status) {
      qb.andWhere('incident.status = :status', { status: query.status });
    }
    return qb;
  }

  private async resolveDriverForIncident(
    incident: Incident,
    busId: string,
  ): Promise<ResponseIncidentDriverDto | undefined> {
    const turn = await this.turnRepository.findOne({
      where: {
        bus: { id: busId },
        startTime: LessThanOrEqual(incident.createdAt),
      },
      relations: ['driver'],
      order: { startTime: 'DESC' },
    });

    if (!turn?.driver) {
      return undefined;
    }

    return plainToInstance(ResponseIncidentDriverDto, {
      id: turn.driver.id,
      name: turn.driver.name,
    });
  }

  private async toResponseIncident(
    incident: Incident,
    busId: string,
  ): Promise<ResponseIncidentDto> {
    const incidentBus =
      incident.incidentBuses?.find((ib) => ib.bus?.id === busId) ??
      incident.incidentBuses?.[0];

    const photos = incidentBus?.photos ?? [];
    const driver = await this.resolveDriverForIncident(incident, busId);

    return plainToInstance(
      ResponseIncidentDto,
      {
        id: incident.id,
        createdAt: incident.createdAt,
        type: incident.type,
        severity: incident.severity,
        status: incident.status,
        description: incident.description,
        driver,
        photos: plainToInstance(ResponseIncidentPhotoDto, photos),
      },
      { excludeExtraneousValues: true },
    );
  }

  private async computeStatistics(
    busId: string,
    query: BusIncidentQueryDto,
  ): Promise<ResponseIncidentStatisticsDto> {
    const statsQb = this.applyBusIncidentFilters(
      this.createBusIncidentQueryBuilder(busId),
      query,
    );

    const rows = await statsQb
      .select('incident.type', 'type')
      .addSelect('incident.status', 'status')
      .addSelect('COUNT(incident.id)', 'count')
      .groupBy('incident.type')
      .addGroupBy('incident.status')
      .getRawMany<{
        type: IncidentType;
        status: IncidentStatus;
        count: string;
      }>();

    const byType: Record<IncidentType, number> = {
      [IncidentType.MECHANICAL]: 0,
      [IncidentType.ACCIDENT]: 0,
      [IncidentType.DELAY]: 0,
      [IncidentType.PASSENGER]: 0,
      [IncidentType.OTHER]: 0,
    };

    let total = 0;
    let closedCount = 0;

    for (const row of rows) {
      const count = Number(row.count);
      total += count;
      byType[row.type] = (byType[row.type] ?? 0) + count;
      if (row.status === IncidentStatus.CLOSED) {
        closedCount += count;
      }
    }

    return plainToInstance(
      ResponseIncidentStatisticsDto,
      {
        total,
        byType,
        resolutionRate: total === 0 ? 0 : closedCount / total,
      },
      { excludeExtraneousValues: true },
    );
  }

  async findByBus(
    busId: string,
    query: BusIncidentQueryDto,
  ): Promise<ResponseBusIncidentListDto> {
    const bus = await this.busRepository.findOne({ where: { id: busId } });
    if (!bus) {
      throw new NotFoundException(`Bus with id ${busId} not found`);
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const countQb = this.applyBusIncidentFilters(
      this.createBusIncidentQueryBuilder(busId),
      query,
    );
    const totalItems = await countQb.getCount();

    const listQb = this.applyBusIncidentFilters(
      this.createBusIncidentQueryBuilder(busId),
      query,
    )
      .leftJoinAndSelect('incident.incidentBuses', 'incidentBuses')
      .leftJoinAndSelect('incidentBuses.bus', 'bus')
      .leftJoinAndSelect('incidentBuses.photos', 'photos')
      .orderBy('incident.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const incidents = await listQb.getMany();
    const statistics = await this.computeStatistics(busId, query);

    const items = await Promise.all(
      incidents.map((incident) => this.toResponseIncident(incident, busId)),
    );

    return {
      items,
      meta: this.buildPaginationMeta(page, limit, totalItems),
      statistics,
    };
  }

  async findAll(paginationQuery: PaginationQueryDto) {
    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;
    const [items, totalItems] = await this.incidentRepository.findAndCount({
      relations: ['incidentBuses', 'incidentBuses.bus', 'incidentBuses.photos'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items,
      meta: this.buildPaginationMeta(page, limit, totalItems),
    };
  }

  async countActiveIncidentsByBus(busId: string): Promise<number> {
    return this.incidentRepository
      .createQueryBuilder('incident')
      .innerJoin('incident.incidentBuses', 'ib', 'ib.bus_id = :busId', {
        busId,
      })
      .andWhere('incident.status != :closed', { closed: 'CLOSED' })
      .getCount();
  }

  async findActiveIncidents(
    enterpriseId?: string,
  ): Promise<ResponseIncidentDto[]> {
    const query = this.incidentRepository
      .createQueryBuilder('incident')
      .leftJoinAndSelect('incident.incidentBuses', 'incidentBuses')
      .leftJoinAndSelect('incidentBuses.bus', 'bus')
      .leftJoinAndSelect('incidentBuses.photos', 'photos')
      .where('incident.status != :closed', { closed: 'CLOSED' });

    if (enterpriseId) {
      query.innerJoin('bus.enterprise', 'enterprise');
      query.andWhere('enterprise.id = :enterpriseId', { enterpriseId });
    }

    const incidents = await query
      .orderBy('incident.createdAt', 'DESC')
      .getMany();
    return Promise.all(
      incidents.map((incident) => {
        const busPlate = incident.incidentBuses?.[0]?.bus?.plate;
        return plainToInstance(
          ResponseIncidentDto,
          {
            id: incident.id,
            createdAt: incident.createdAt,
            type: incident.type,
            severity: incident.severity,
            status: incident.status,
            description: incident.description,
            driver: undefined,
            photos: plainToInstance(
              ResponseIncidentPhotoDto,
              incident.incidentBuses?.[0]?.photos ?? [],
            ),
            busPlate,
          },
          { excludeExtraneousValues: true },
        );
      }),
    );
  }

  private async findIncidentOrFail(incidentId: string): Promise<Incident> {
    const incident = await this.incidentRepository.findOne({
      where: { id: incidentId },
      relations: ['incidentBuses', 'incidentBuses.bus', 'incidentBuses.photos'],
    });

    if (!incident) {
      throw new NotFoundException(`Incident with id ${incidentId} not found`);
    }

    return incident;
  }

  async updateStatus(
    incidentId: string,
    dto: UpdateIncidentStatusDto,
  ): Promise<ResponseIncidentDto> {
    const incident = await this.findIncidentOrFail(incidentId);

    const allowed = ALLOWED_STATUS_TRANSITIONS[incident.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition incident status from "${incident.status}" to "${dto.status}"`,
      );
    }

    incident.status = dto.status;
    const saved = await this.incidentRepository.save(incident);

    const busId = saved.incidentBuses?.[0]?.bus?.id;
    if (!busId) {
      return plainToInstance(
        ResponseIncidentDto,
        {
          id: saved.id,
          createdAt: saved.createdAt,
          type: saved.type,
          severity: saved.severity,
          status: saved.status,
          description: saved.description,
          photos: [],
        },
        { excludeExtraneousValues: true },
      );
    }

    return this.toResponseIncident(saved, busId);
  }

  async createByDriver(
    currentUser: JwtPayload,
    dto: CreateIncidentDriverDto,
    photos: IncidentStorageFile[] = [],
  ) {
    const driver = await this.driverRepository.findOne({
      where: { userId: currentUser.id },
    });

    if (!driver) {
      throw new NotFoundException(
        'No tienes un perfil de conductor registrado. Completa el registro en el panel.',
      );
    }

    const now = new Date();
    const activeTurn = await this.turnRepository.findOne({
      where: {
        driver: { id: driver.id },
        status: TurnStatus.IN_PROGRESS,
      },
      relations: ['driver', 'bus', 'bus.enterprise'],
      order: { actualStartTime: 'DESC', startTime: 'DESC' },
    });

    if (!activeTurn) {
      throw new BadRequestException(
        'No active turn found for this driver. Driver must have an active turn to report an incident.',
      );
    }

    if (!this.isTurnActive(activeTurn, now)) {
      throw new BadRequestException(
        `Turn ${activeTurn.id} is not active. Cannot report incident.`,
      );
    }

    if (!activeTurn.bus) {
      throw new BadRequestException('Active turn must have an assigned bus.');
    }

    const incident = this.incidentRepository.create({
      type: dto.type,
      severity: dto.severity,
      description: dto.description,
      latitude: dto.latitude,
      longitude: dto.longitude,
    });

    const savedIncident = await this.incidentRepository.save(incident);

    const incidentBus = await this.incidentBusRepository.save(
      this.incidentBusRepository.create({
        incident: savedIncident,
        bus: activeTurn.bus,
      }),
    );

    if (photos.length > 0) {
      await this.incidentPhotoService.attachPhotos(incidentBus, photos);
    }

    if (
      [IncidentSeverity.HIGH, IncidentSeverity.CRITICAL].includes(
        savedIncident.severity,
      )
    ) {
      await this.incidentNotificationService.notifySupervisorIfNeeded(
        savedIncident,
        incidentBus,
      );
    }

    const busId = activeTurn.bus.id;
    const withRelations = await this.findIncidentOrFail(savedIncident.id);
    return this.toResponseIncident(withRelations, busId);
  }
}
