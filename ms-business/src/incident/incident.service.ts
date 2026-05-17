import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { Incident } from './entities/incident.entity';
import { IncidentBus } from './entities/incident-bus.entity';
import { IncidentPhoto } from './entities/incident-photo.entity';
import { Bus } from '@/bus/entities/bus.entity';
import { Turn } from '@/turn/entities/turn.entity';
import { Driver } from '@/driver/entities/driver.entity';
import { Enterprise } from '@/enterprise/entities/enterprise.entity';
import { CreateIncidentDto } from './dto/create-incident.dto';

type IncidentUploadFile = {
  path: string;
  originalname: string;
  mimetype: string;
  size: number;
};

@Injectable()
export class IncidentService {
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
  ) {}

  async create(dto: CreateIncidentDto, photos: IncidentUploadFile[] = []) {
    if (photos.length > 5) {
      throw new BadRequestException('You can attach up to 5 photos');
    }

    const driver = await this.driverRepository.findOne({
      where: { id: dto.driverId },
    });
    if (!driver) throw new NotFoundException('Driver not found');

    const now = new Date();
    const turn = await this.turnRepository.findOne({
      where: {
        driver: { id: dto.driverId },
        startTime: LessThanOrEqual(now),
        endTime: MoreThanOrEqual(now),
      },
      relations: ['bus', 'driver'],
    });

    if (!turn || !turn.bus) {
      throw new BadRequestException('No active turn found for this driver');
    }

    const busIds = dto.busIds?.length ? Array.from(new Set(dto.busIds)) : [turn.bus.id];
    if (!busIds.includes(turn.bus.id)) {
      busIds.unshift(turn.bus.id);
    }

    const buses = await this.busRepository.find({
      where: { id: In(busIds) },
      relations: ['enterprise'],
    });
    if (buses.length !== busIds.length) {
      throw new BadRequestException('One or more buses were not found');
    }

    const enterprise = turn.bus.enterprise;
    if (!enterprise) {
      throw new BadRequestException('Current bus has no enterprise assigned');
    }

    const incident = await this.incidentRepository.save(
      this.incidentRepository.create({
        type: dto.type,
        severity: dto.severity,
        description: dto.description,
        latitude: dto.latitude,
        longitude: dto.longitude,
        turn,
        driver,
        enterprise: enterprise as Enterprise,
      }),
    );

    const incidentBuses = await this.incidentBusRepository.save(
      buses.map((bus, index) =>
        this.incidentBusRepository.create({
          incident,
          bus,
          isPrimary: index === 0,
        }),
      ),
    );

    const primaryIncidentBus = incidentBuses.find((record) => record.isPrimary);
    if (primaryIncidentBus && photos.length > 0) {
      await this.incidentPhotoRepository.save(
        photos.map((photo) =>
          this.incidentPhotoRepository.create({
            incidentBus: primaryIncidentBus,
            path: photo.path,
            originalName: photo.originalname,
            mimeType: photo.mimetype,
            size: photo.size,
          }),
        ),
      );
    }

    return { incident, incidentBuses };
  }
}