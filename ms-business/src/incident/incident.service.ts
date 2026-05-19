import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { Incident } from './entities/incident.entity';
import { IncidentBus } from './entities/incident-bus.entity';
import { IncidentPhoto } from './entities/incident-photo.entity';
import { IncidentComment } from './entities/incident-comment.entity';
import { Bus } from '@/bus/entities/bus.entity';
import { Turn } from '@/turn/entities/turn.entity';
import { Driver } from '@/driver/entities/driver.entity';
import { Enterprise } from '@/enterprise/entities/enterprise.entity';
import { CreateIncidentDriverDto } from './dto/create-incident-driver.dto';
import {
  IncidentStorageFile,
  IncidentStorageService,
} from './incident-storage.service';
import { IncidentNotificationService } from './incident-notification.service';
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
import { ResponseIncidentPhotoDto } from './dto/response-incident-photo.dto';
import { ResponseIncidentStatisticsDto } from './dto/response-incident-statistics.dto';
import { CreateIncidentCommentDto } from './dto/create-incident-comment.dto';
import { ResponseIncidentCommentDto } from './dto/response-incident-comment.dto';
import { ResponseIncidentCommentListDto } from './dto/response-incident-comment-list.dto';
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
    @InjectRepository(IncidentPhoto)
    private readonly incidentPhotoRepository: Repository<IncidentPhoto>,
    @InjectRepository(IncidentComment)
    private readonly incidentCommentRepository: Repository<IncidentComment>,
    @InjectRepository(Bus)
    private readonly busRepository: Repository<Bus>,
    @InjectRepository(Turn)
    private readonly turnRepository: Repository<Turn>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    @InjectRepository(Enterprise)
    private readonly enterpriseRepository: Repository<Enterprise>,
    private readonly incidentStorageService: IncidentStorageService,
    private readonly incidentNotificationService: IncidentNotificationService,
  ) {}

  private isTurnActive(turn: Turn, now: Date) {
    if (turn.status) {
      return turn.status.toLowerCase() === 'active';
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
      .innerJoin('incident.incidentBuses', 'ib', 'ib.busId = :busId', {
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

  private toResponseIncident(
    incident: Incident,
    busId: string,
  ): ResponseIncidentDto {
    const incidentBus =
      incident.incidentBuses?.find((ib) => ib.bus?.id === busId) ??
      incident.incidentBuses?.[0];

    const photos = incidentBus?.photos ?? [];

    return plainToInstance(
      ResponseIncidentDto,
      {
        id: incident.id,
        reportedAt: incident.reportedAt,
        type: incident.type,
        severity: incident.severity,
        status: incident.status,
        description: incident.description,
        driver: plainToInstance(ResponseIncidentDriverDto, {
          id: incident.driver.id,
          name: incident.driver.name,
        }),
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
      .leftJoinAndSelect('incident.driver', 'driver')
      .leftJoinAndSelect('incident.incidentBuses', 'incidentBuses')
      .leftJoinAndSelect('incidentBuses.bus', 'bus')
      .leftJoinAndSelect('incidentBuses.photos', 'photos')
      .orderBy('incident.reportedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const incidents = await listQb.getMany();
    const statistics = await this.computeStatistics(busId, query);

    return {
      items: incidents.map((incident) =>
        this.toResponseIncident(incident, busId),
      ),
      meta: this.buildPaginationMeta(page, limit, totalItems),
      statistics,
    };
  }

  async findAll(paginationQuery: PaginationQueryDto) {
    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;
    const [items, totalItems] = await this.incidentRepository.findAndCount({
      relations: [
        'turn',
        'turn.bus',
        'turn.driver',
        'driver',
        'enterprise',
        'incidentBuses',
        'incidentBuses.bus',
        'incidentBuses.photos',
      ],
      order: { reportedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items,
      meta: this.buildPaginationMeta(page, limit, totalItems),
    };
  }

  private async findIncidentOrFail(incidentId: string): Promise<Incident> {
    const incident = await this.incidentRepository.findOne({
      where: { id: incidentId },
      relations: [
        'driver',
        'incidentBuses',
        'incidentBuses.bus',
        'incidentBuses.photos',
      ],
    });

    if (!incident) {
      throw new NotFoundException(`Incident with id ${incidentId} not found`);
    }

    return incident;
  }

  async addComment(
    incidentId: string,
    dto: CreateIncidentCommentDto,
    currentUser: JwtPayload,
  ): Promise<ResponseIncidentCommentDto> {
    await this.findIncidentOrFail(incidentId);

    const comment = await this.incidentCommentRepository.save(
      this.incidentCommentRepository.create({
        incident: { id: incidentId } as Incident,
        text: dto.text,
        authorUserId: currentUser.id,
        authorName: currentUser.name,
      }),
    );

    return plainToInstance(ResponseIncidentCommentDto, comment, {
      excludeExtraneousValues: true,
    });
  }

  async listComments(
    incidentId: string,
  ): Promise<ResponseIncidentCommentListDto> {
    await this.findIncidentOrFail(incidentId);

    const comments = await this.incidentCommentRepository.find({
      where: { incident: { id: incidentId } },
      order: { createdAt: 'ASC' },
    });

    return {
      items: plainToInstance(ResponseIncidentCommentDto, comments, {
        excludeExtraneousValues: true,
      }),
    };
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

    const busId =
      saved.incidentBuses?.find((ib) => ib.isPrimary)?.bus?.id ??
      saved.incidentBuses?.[0]?.bus?.id;

    if (!busId) {
      return plainToInstance(
        ResponseIncidentDto,
        {
          id: saved.id,
          reportedAt: saved.reportedAt,
          type: saved.type,
          severity: saved.severity,
          status: saved.status,
          description: saved.description,
          driver: plainToInstance(ResponseIncidentDriverDto, {
            id: saved.driver.id,
            name: saved.driver.name,
          }),
          photos: [],
        },
        { excludeExtraneousValues: true },
      );
    }

    return this.toResponseIncident(saved, busId);
  }

  /**
   * Crear incidente desde el driver autenticado
   */
  async createByDriver(
    currentUser: JwtPayload,
    dto: CreateIncidentDriverDto,
    photos: IncidentStorageFile[] = [],
  ) {
    if (photos.length > 5) {
      throw new BadRequestException('You can attach up to 5 photos');
    }

    const driver = await this.driverRepository.findOne({
      where: { userId: currentUser.id },
    });

    if (!driver) {
      throw new NotFoundException(
        'No tienes un perfil de conductor registrado. Completa el registro en el panel.',
      );
    }

    this.logger.debug(`✅ Found driver: ${driver.id} (${driver.email})`);

    const now = new Date();
    const activeTurn = await this.turnRepository.findOne({
      where: {
        driver: { id: driver.id },
      },
      relations: ['driver', 'bus', 'bus.enterprise'],
      order: { startTime: 'DESC' },
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

    if (!activeTurn.bus || !activeTurn.bus.enterprise) {
      throw new BadRequestException(
        'Active turn must have an assigned bus and enterprise.',
      );
    }

    const incident = this.incidentRepository.create({
      type: dto.type,
      severity: dto.severity,
      description: dto.description,
      latitude: dto.latitude,
      longitude: dto.longitude,
      reportedAt: dto.timestamp || now,
      turn: activeTurn,
      driver: driver,
      enterprise: activeTurn.bus.enterprise,
    });

    const savedIncident = await this.incidentRepository.save(incident);

    this.logger.log(
      `✅ Incident ${savedIncident.id} created by driver ${driver.id} for bus ${activeTurn.bus.id}`,
    );

    const incidentBus = await this.incidentBusRepository.save(
      this.incidentBusRepository.create({
        incident: savedIncident,
        bus: activeTurn.bus,
        isPrimary: true,
      }),
    );

    if (photos.length > 0) {
      const storedPhotos = await this.incidentStorageService.uploadMany(photos);

      await this.incidentPhotoRepository.save(
        storedPhotos.map((photo) =>
          this.incidentPhotoRepository.create({
            incidentBus,
            path: photo.path,
            publicUrl: photo.publicUrl,
            originalName: photo.originalName,
            mimeType: photo.mimeType,
            size: photo.size,
          }),
        ),
      );

      this.logger.log(
        `📸 ${storedPhotos.length} photos uploaded for incident ${savedIncident.id}`,
      );
    }

    const criticalSeverities = [
      IncidentSeverity.HIGH,
      IncidentSeverity.CRITICAL,
    ];
    if (criticalSeverities.includes(savedIncident.severity)) {
      await this.incidentNotificationService.notifySupervisorIfNeeded(
        savedIncident,
        incidentBus,
      );

      this.logger.log(
        `📧 Supervisor notification sent for incident ${savedIncident.id}`,
      );
    }

    return savedIncident;
  }
}
