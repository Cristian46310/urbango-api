import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateStopDto } from './dto/create-stop.dto';
import { UpdateStopDto } from './dto/update-stop.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Stop } from './entities/stop.entity';
import { Repository } from 'typeorm';
import { ResponseStopDto } from './dto/response-stop.dto';
import { plainToInstance } from 'class-transformer';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import { ResponseStopListDto } from './dto/response-stop-list.dto';
import { NearbyStopDto } from './dto/nearby-stop.dto';

@Injectable()
export class StopService {
  constructor(
    @InjectRepository(Stop)
    private readonly stopRepository: Repository<Stop>,
  ) {}
  async create(createStopDto: CreateStopDto): Promise<ResponseStopDto> {
    const stop = this.stopRepository.create(createStopDto);
    return plainToInstance(
      ResponseStopDto,
      await this.stopRepository.save(stop),
    );
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
    paginationQuery: PaginationQueryDto,
  ): Promise<ResponseStopListDto> {
    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;
    const [stops, totalItems] = await this.stopRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: plainToInstance(ResponseStopDto, stops),
      meta: this.buildPaginationMeta(page, limit, totalItems),
    };
  }

  async findOne(id: string): Promise<ResponseStopDto> {
    const stop = await this.stopRepository.findOne({ where: { id } });
    if (!stop) {
      throw new NotFoundException(`Stop with id ${id} not found`);
    }
    return plainToInstance(ResponseStopDto, stop);
  }

  async update(
    id: string,
    updateStopDto: UpdateStopDto,
  ): Promise<ResponseStopDto> {
    const stop = await this.stopRepository.preload({ id, ...updateStopDto });
    if (!stop) {
      throw new NotFoundException(`Stop with id ${id} not found`);
    }
    const updatedStop = await this.stopRepository.save(stop);
    return plainToInstance(ResponseStopDto, updatedStop);
  }

  async remove(id: string): Promise<void> {
    const stop = await this.stopRepository.findOne({ where: { id } });
    if (!stop) {
      throw new NotFoundException(`Stop with id ${id} not found`);
    }
    await this.stopRepository.delete(id);
    return;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private validateCoordinates(latitude: number, longitude: number): void {
    if (Number.isNaN(latitude) || latitude < -90 || latitude > 90) {
      throw new BadRequestException('Latitude must be between -90 and 90');
    }
    if (Number.isNaN(longitude) || longitude < -180 || longitude > 180) {
      throw new BadRequestException('Longitude must be between -180 and 180');
    }
  }

  async findNearbyStops(
    lat: number,
    lon: number,
    limit = 5,
    radiusMeters = 1000,
  ): Promise<NearbyStopDto[]> {
    this.validateCoordinates(lat, lon);

    const safeLimit = Math.max(1, Math.min(Math.trunc(limit), 100));
    const safeRadiusMeters = Math.max(1, Math.trunc(radiusMeters));

    const latDelta = safeRadiusMeters / 111320;
    const lonCos = Math.cos(this.toRadians(lat));
    const lonDelta =
      safeRadiusMeters / (111320 * Math.max(Math.abs(lonCos), 0.000001));

    const minLat = lat - latDelta;
    const maxLat = lat + latDelta;
    const minLon = lon - lonDelta;
    const maxLon = lon + lonDelta;

    const distanceExpr = `(
      6371000 * acos(
        cos(radians(:lat)) * cos(radians(s.latitude)) *
        cos(radians(s.longitude) - radians(:lon)) +
        sin(radians(:lat)) * sin(radians(s.latitude))
      )
    )`;

    // “Busca las paradas dentro de una zona aproximada cercana, 
    // calcula la distancia exacta desde mi ubicación, agrupa sus rutas, 
    // filtra solo las que estén dentro del radio permitido, 
    // ordénalas por cercanía y devuelve las más próximas.”

    const raw = await this.stopRepository
      .createQueryBuilder('s')
      .select('s.id', 'id')
      .addSelect('s.name', 'name')
      .addSelect('s.location', 'location')
      .addSelect('s.latitude', 'latitude')
      .addSelect('s.longitude', 'longitude')
      .addSelect(`ROUND((${distanceExpr})::numeric, 2)`, 'distanceMeters')
      .addSelect(
        `
        COALESCE(
          jsonb_agg(
            DISTINCT jsonb_build_object('id', r.id, 'name', r.name)
          ) FILTER (WHERE r.id IS NOT NULL),
          '[]'::jsonb
        )
        `,
        'routes',
      )
      .leftJoin('nodes', 'n', 'n."stopId" = s.id')
      .leftJoin('routes', 'r', 'r.id = n."routeId"')
      .where('s.latitude BETWEEN :minLat AND :maxLat', { minLat, maxLat })
      .andWhere('s.longitude BETWEEN :minLon AND :maxLon', { minLon, maxLon })
      .groupBy('s.id')
      .having(`${distanceExpr} <= :radiusMeters`, {
        radiusMeters: safeRadiusMeters,
      })
      .orderBy('"distanceMeters"', 'ASC')
      .limit(safeLimit)
      .setParameters({ lat, lon })
      .getRawMany();

    return raw.map((row) => {
      const routesValue =
        typeof row.routes === 'string' ? JSON.parse(row.routes) : row.routes;

      return {
        id: row.id,
        name: row.name,
        location: row.location,
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
        distanceMeters: Number(row.distanceMeters),
        routes: Array.isArray(routesValue)
          ? routesValue.map((route: { id: string; name: string }) => ({
              id: route.id,
              name: route.name,
            }))
          : [],
      };
    });
  }
}