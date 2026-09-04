import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { Incident } from './entities/incident.entity';
import { IncidentBus } from './entities/incident-bus.entity';
import { IncidentPhoto } from '@/incident-photo/entities/incident-photo.entity';
import { Bus } from '@/bus/entities/bus.entity';
import { Turn, TurnStatus } from '@/turn/entities/turn.entity';
import { Driver } from '@/driver/entities/driver.entity';
import { CreateIncidentDriverDto } from './dto/create-incident-driver.dto';
import { IncidentNotificationService } from './incident-notification.service';
import { IncidentPhotoService } from '@/incident-photo/incident-photo.service';
import {
  IncidentStorageFile,
  StoredIncidentPhoto,
} from '@/incident-photo/incident-storage.service';
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
    private readonly dataSource: DataSource,
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
    const map = await this.resolveDriversForIncidents([incident], busId);
    return map.get(incident.id);
  }

  /**
   * Batch-resolves the driver on duty at each incident's createdAt for a bus
   * (avoids N+1 turn lookups in findByBus).
   */
  private async resolveDriversForIncidents(
    incidents: Incident[],
    busId: string,
  ): Promise<Map<string, ResponseIncidentDriverDto>> {
    const result = new Map<string, ResponseIncidentDriverDto>();
    if (!incidents.length) {
      return result;
    }

    const incidentIds = incidents.map((incident) => incident.id);
    const rows = await this.dataSource.query(
      `
      SELECT DISTINCT ON (i.id)
        i.id AS "incidentId",
        d.id AS "driverId",
        d.name AS "driverName"
      FROM incidents i
      INNER JOIN turns t
        ON t."busId" = $1
       AND t."startTime" <= i."createdAt"
       AND t."deletedAt" IS NULL
      INNER JOIN persons d ON d.id = t."driverId"
      WHERE i.id = ANY($2::uuid[])
      ORDER BY i.id, t."startTime" DESC
      `,
      [busId, incidentIds],
    );

    for (const row of rows as Array<{
      incidentId: string;
      driverId: string;
      driverName: string;
    }>) {
      result.set(
        row.incidentId,
        plainToInstance(ResponseIncidentDriverDto, {
          id: row.driverId,
          name: row.driverName,
        }),
      );
    }
    return result;
  }

  private async toResponseIncident(
    incident: Incident,
    busId: string,
    driverByIncidentId?: Map<string, ResponseIncidentDriverDto>,
  ): Promise<ResponseIncidentDto> {
    const incidentBus =
      incident.incidentBuses?.find((ib) => ib.bus?.id === busId) ??
      incident.incidentBuses?.[0];

    const photos = incidentBus?.photos ?? [];
    const driver =
      driverByIncidentId?.get(incident.id) ??
      (await this.resolveDriverForIncident(incident, busId));

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
        busPlate: incidentBus?.bus?.plate,
        photos: photos.map((photo) => ({
          id: photo.id,
          publicUrl: photo.photoUrl,
          createdAt: photo.createdAt,
        })),
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
    const drivers = await this.resolveDriversForIncidents(incidents, busId);

    const items = await Promise.all(
      incidents.map((incident) =>
        this.toResponseIncident(incident, busId, drivers),
      ),
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
    const [items, totalItems] = await this.incidentRepository
      .createQueryBuilder('incident')
      .leftJoinAndSelect('incident.incidentBuses', 'incidentBuses')
      .leftJoinAndSelect('incidentBuses.bus', 'bus')
      .leftJoinAndSelect('incidentBuses.photos', 'photos')
      .orderBy('incident.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

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
      .andWhere('incident.status != :closed', { closed: IncidentStatus.CLOSED })
      .getCount();
  }

  async countActiveIncidentsByBusIds(
    busIds: string[],
  ): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    if (!busIds.length) {
      return counts;
    }

    const rows = await this.incidentRepository
      .createQueryBuilder('incident')
      .innerJoin('incident.incidentBuses', 'ib')
      .select('ib.bus_id', 'busId')
      .addSelect('COUNT(DISTINCT incident.id)', 'count')
      .where('ib.bus_id IN (:...busIds)', { busIds })
      .andWhere('incident.status != :closed', { closed: IncidentStatus.CLOSED })
      .groupBy('ib.bus_id')
      .getRawMany<{ busId: string; count: string }>();

    for (const busId of busIds) {
      counts.set(busId, 0);
    }
    for (const row of rows) {
      counts.set(row.busId, Number.parseInt(row.count, 10) || 0);
    }
    return counts;
  }

  async findActiveIncidents(
    enterpriseId?: string,
  ): Promise<ResponseIncidentDto[]> {
    const query = this.incidentRepository
      .createQueryBuilder('incident')
      .leftJoinAndSelect('incident.incidentBuses', 'incidentBuses')
      .leftJoinAndSelect('incidentBuses.bus', 'bus')
      .leftJoinAndSelect('incidentBuses.photos', 'photos')
      .where('incident.status != :closed', { closed: IncidentStatus.CLOSED });

    if (enterpriseId) {
      query.innerJoin('bus.enterprise', 'enterprise');
      query.andWhere('enterprise.id = :enterpriseId', { enterpriseId });
    }

    const incidents = await query
      .orderBy('incident.createdAt', 'DESC')
      .take(200)
      .getMany();
    return Promise.all(
      incidents.map((incident) => {
        const incidentBus = incident.incidentBuses?.[0];
        const busPlate = incidentBus?.bus?.plate;
        const photos = incidentBus?.photos ?? [];
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
            photos: photos.map((photo) => ({
              id: photo.id,
              publicUrl: photo.photoUrl,
              createdAt: photo.createdAt,
            })),
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

    let uploaded: StoredIncidentPhoto[] = [];
    try {
      uploaded = await this.incidentPhotoService.uploadOnly(photos);

      const savedIncidentId = await this.dataSource.transaction(
        async (manager) => {
          const incidentRepo = manager.getRepository(Incident);
          const incidentBusRepo = manager.getRepository(IncidentBus);
          const photoRepo = manager.getRepository(IncidentPhoto);

          const savedIncident = await incidentRepo.save(incident);
          const incidentBus = await incidentBusRepo.save(
            incidentBusRepo.create({
              incident: savedIncident,
              bus: activeTurn.bus,
            }),
          );

          if (uploaded.length > 0) {
            await this.incidentPhotoService.persistUploaded(
              incidentBus,
              uploaded,
              photoRepo,
            );
          }

          return savedIncident.id;
        },
      );

      const withRelations = await this.findIncidentOrFail(savedIncidentId);

      if (
        [IncidentSeverity.HIGH, IncidentSeverity.CRITICAL].includes(
          withRelations.severity,
        )
      ) {
        const primaryBus =
          withRelations.incidentBuses?.find((ib) => ib.bus?.id) ??
          withRelations.incidentBuses?.[0];
        if (primaryBus) {
          await this.incidentNotificationService.notifySupervisorIfNeeded(
            withRelations,
            primaryBus,
          );
        }
      }

      const busId = activeTurn.bus.id;
      return this.toResponseIncident(withRelations, busId);
    } catch (error) {
      await this.incidentPhotoService.cleanupUploaded(uploaded);
      throw error;
    }
  }
}
