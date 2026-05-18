import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Incident } from './entities/incident.entity';
import { IncidentBus } from './entities/incident-bus.entity';
import { IncidentPhoto } from './entities/incident-photo.entity';
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
import { PaginationService } from '@/shared/services/pagination.service';
import { JwtPayload } from '@/auth/types';
import { IncidentSeverity } from './enums/incident.enum';

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
    private readonly paginationService: PaginationService,
  ) {}

  private isTurnActive(turn: Turn, now: Date) {
    if (turn.status) {
      return turn.status.toLowerCase() === 'active';
    }

    return turn.startTime <= now && (!turn.endTime || turn.endTime >= now);
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
      meta: this.paginationService.buildPaginationMeta(page, limit, totalItems),
    };
  }

  /**
   * Crear incidente desde el driver autenticado
   * Usa información del token (JWT) para obtener:
   * - ID del conductor
   * - Su turno actual
   * - El bus del turno
   * - La empresa del bus
   */
  async createByDriver(
    currentUser: JwtPayload,
    dto: CreateIncidentDriverDto,
    photos: IncidentStorageFile[] = [],
  ) {
    if (photos.length > 5) {
      throw new BadRequestException('You can attach up to 5 photos');
    }

    // 1. Obtener el driver desde la BD
    // El currentUser.id viene de ms-security (MongoDB ObjectId)
    // Buscamos directamente por mongoUserId en la entidad Driver
    let driver = await this.driverRepository.findOne({
      where: { mongoUserId: currentUser.id },
    });

    if (!driver) {
      throw new NotFoundException(
        `Driver with ID ${currentUser.id} not found in database`,
      );
    }

    this.logger.debug(`✅ Found driver: ${driver.id} (${driver.email})`);

    // 2. Obtener el turno ACTIVO del conductor
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

    // 3. Crear el incidente con la información del turno
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

    // 4. Crear relación incidente-bus
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

    // 5. Notificar si es de severidad alta o crítica
    const criticalSeverities = [IncidentSeverity.HIGH, IncidentSeverity.CRITICAL];
    if (criticalSeverities.includes(savedIncident.severity as IncidentSeverity)) {
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
