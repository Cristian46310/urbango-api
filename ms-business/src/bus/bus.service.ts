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
import { Repository } from 'typeorm';
import { Bus } from './entities/bus.entity';
import { Enterprise } from '@/enterprise/entities/enterprise.entity';
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
  ) {}

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
      enterprise: { id: enterpriseId } as Enterprise,
    });

    const saved = await this.busRepository.save(bus);
    saved.qrCode = await this.generateQrCode(saved.id, enterpriseId, saved);
    const withQr = await this.busRepository.save(saved);

    return this.toResponse(withQr);
  }

  async findAll(
    paginationQuery: PaginationQueryDto,
    enterpriseId?: string,
  ): Promise<ResponseBusListDto> {
    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;

    const [items, totalItems] = await this.busRepository.findAndCount({
      where: enterpriseId ? { enterprise: { id: enterpriseId } } : {},
      relations: ['enterprise'],
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
      relations: ['enterprise'],
    });
    if (!bus) throw new NotFoundException(`Bus ${id} not found`);
    return this.toResponse(bus);
  }

  async update(id: string, updateBusDto: UpdateBusDto): Promise<ResponseBusDto> {
    const bus = await this.busRepository.findOne({
      where: { id },
      relations: ['enterprise'],
    });
    if (!bus) throw new NotFoundException(`Bus ${id} not found`);

    if (updateBusDto.seatedCapacity !== undefined || updateBusDto.standingCapacity !== undefined || updateBusDto.capacity !== undefined) {
      this.validateCapacities({
        capacity: updateBusDto.capacity ?? bus.capacity,
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
    await this.busRepository.delete(id);
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

  private validateCapacities(dto: {
    capacity?: number;
    seatedCapacity?: number;
    standingCapacity?: number;
  }): void {
    const { capacity, seatedCapacity, standingCapacity } = dto;

    if (
      seatedCapacity != null &&
      standingCapacity != null &&
      capacity != null &&
      seatedCapacity + standingCapacity > capacity
    ) {
      throw new BadRequestException(
        'Seated plus standing capacity cannot exceed maximum passenger capacity',
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

  private toResponse(bus: Bus): ResponseBusDto {
    const dto = plainToInstance(ResponseBusDto, bus, {
      excludeExtraneousValues: true,
    });
    dto.enterpriseId = bus.enterprise?.id;
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
