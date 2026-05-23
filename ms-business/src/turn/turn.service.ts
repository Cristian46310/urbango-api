import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { CreateTurnDto } from './dto/create-turn.dto';
import { UpdateTurnDto } from './dto/update-turn.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { Turn, TurnStatus } from './entities/turn.entity';
import { Bus } from '@/bus/entities/bus.entity';
import { Driver } from '@/driver/entities/driver.entity';
import { plainToInstance } from 'class-transformer';
import { ResponseTurnDto } from './dto/response-turn.dto';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';

@Injectable()
export class TurnService {
  constructor(
    @InjectRepository(Turn)
    private readonly turnRepository: Repository<Turn>,
    @InjectRepository(Bus)
    private readonly busRepository: Repository<Bus>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
  ) {}

  async create(createTurnDto: CreateTurnDto): Promise<ResponseTurnDto> {
    if (createTurnDto.busId) {
      const bus = await this.busRepository.findOne({
        where: { id: createTurnDto.busId },
      });
      if (!bus) throw new BadRequestException('Bus not found');
    }
    if (createTurnDto.driverId) {
      const drv = await this.driverRepository.findOne({
        where: { id: createTurnDto.driverId },
      });
      if (!drv) throw new BadRequestException('Driver not found');
    }

    const turnData: Partial<Turn> = {
      startTime: new Date(createTurnDto.startTime),
      endTime: createTurnDto.endTime
        ? new Date(createTurnDto.endTime)
        : undefined,
      status: createTurnDto.status,
      bus: createTurnDto.busId
        ? ({ id: createTurnDto.busId } as Bus)
        : undefined,
      driver: createTurnDto.driverId
        ? ({ id: createTurnDto.driverId } as Driver)
        : undefined,
    };
    const turn = this.turnRepository.create(turnData);

    const saved = await this.turnRepository.save(turn);
    return plainToInstance(ResponseTurnDto, saved);
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
    const [items, totalItems] = await this.turnRepository.findAndCount({
      relations: ['bus', 'driver'],
      order: { startTime: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: plainToInstance(ResponseTurnDto, items),
      meta: this.buildPaginationMeta(page, limit, totalItems),
    };
  }

  async findOne(id: string) {
    const turn = await this.turnRepository.findOne({
      where: { id },
      relations: ['bus', 'driver'],
    });
    if (!turn) throw new NotFoundException(`Turn ${id} not found`);
    return plainToInstance(ResponseTurnDto, turn);
  }

  async startTurn(driverId: string, busStatus: string, observations?: string) {
    if (!busStatus?.trim()) {
      throw new BadRequestException('busStatus es requerido');
    }

    const now = new Date();
    const scheduledTurn = await this.turnRepository.findOne({
      where: {
        driver: { id: driverId },
        startTime: LessThanOrEqual(now),
        endTime: MoreThanOrEqual(now),
        status: TurnStatus.SCHEDULED,
      },
      relations: ['bus', 'driver'],
    });

    if (!scheduledTurn) {
      const unavailableTurn = await this.turnRepository.findOne({
        where: {
          driver: { id: driverId },
          startTime: LessThanOrEqual(now),
          endTime: MoreThanOrEqual(now),
        },
      });

      if (unavailableTurn) {
        throw new ConflictException('Turno ya iniciado o no disponible');
      }

      throw new NotFoundException('No hay turno programado para este horario');
    }

    if (scheduledTurn.actualStartTime) {
      throw new ConflictException('Turno ya iniciado');
    }

    if (!scheduledTurn.bus) {
      throw new BadRequestException('El turno no tiene bus asignado');
    }

    scheduledTurn.actualStartTime = now;
    scheduledTurn.busStatus = busStatus.trim();
    scheduledTurn.busObservations = observations?.trim() || null;
    scheduledTurn.status = TurnStatus.IN_PROGRESS;

    const saved = await this.turnRepository.save(scheduledTurn);

    return {
      turnId: saved.id,
      bus: {
        id: saved.bus.id,
        placa: saved.bus.plate,
        modelo: saved.bus.model,
      },
      actualStartTime: saved.actualStartTime!,
      status: saved.status,
    };
  }

  async update(id: string, updateTurnDto: UpdateTurnDto) {
    if (updateTurnDto.busId) {
      const bus = await this.busRepository.findOne({
        where: { id: updateTurnDto.busId },
      });
      if (!bus) throw new BadRequestException('Bus not found');
    }
    if (updateTurnDto.driverId) {
      const drv = await this.driverRepository.findOne({
        where: { id: updateTurnDto.driverId },
      });
      if (!drv) throw new BadRequestException('Driver not found');
    }

    const preloadData: Partial<Turn> = {
      id,
      startTime: updateTurnDto.startTime
        ? new Date(updateTurnDto.startTime)
        : undefined,
      endTime: updateTurnDto.endTime
        ? new Date(updateTurnDto.endTime)
        : undefined,
      status: updateTurnDto.status,
      bus: updateTurnDto.busId
        ? ({ id: updateTurnDto.busId } as Bus)
        : undefined,
      driver: updateTurnDto.driverId
        ? ({ id: updateTurnDto.driverId } as Driver)
        : undefined,
    };
    const turn = await this.turnRepository.preload(preloadData);
    if (!turn) throw new NotFoundException(`Turn ${id} not found`);
    const saved = await this.turnRepository.save(turn);
    return plainToInstance(ResponseTurnDto, saved);
  }

  async remove(id: string) {
    const turn = await this.turnRepository.findOne({ where: { id } });
    if (!turn) throw new NotFoundException(`Turn ${id} not found`);
    await this.turnRepository.delete(id);
    return;
  }
}
