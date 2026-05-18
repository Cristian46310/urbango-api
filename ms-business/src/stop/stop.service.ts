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
// Buscar paradas cercanas a una ubicación dentro de un radio específico
  // Utiliza dos estrategias: Bounding Box (cuadro delimitador) para filtrado rápido
  // y la fórmula Haversine para cálculo exacto de distancias en la base de datos
  async findNearbyStops(
    lat: number,
    lon: number,
    limit = 5,
    radiusMeters = 1000,
  ): Promise<NearbyStopDto[]> {
    this.validateCoordinates(lat, lon);

    const minLatitude = -90;
    const maxLatitude = 90;
    const minLongitude = -180;
    const maxLongitude = 180;
    const minNearbyLimit = 1;
    const maxNearbyLimit = 100;
    const minRadiusMeters = 1;
    const metersPerDegree = 111320;
    const earthRadiusMeters = 6371000;
    const minimumCosineValue = 0.000001;

    // Sanitizar el límite: mínimo 1, máximo 100 resultados
    const safeLimit = Math.max(minNearbyLimit, Math.min(Math.trunc(limit), maxNearbyLimit));
    // Sanitizar el radio: mínimo 1 metro
    const safeRadiusMeters = Math.max(minRadiusMeters, Math.trunc(radiusMeters));

    // ═══════════════════════════════════════════════════════════════
    // PASO 1: CÁLCULO DEL CUADRO DELIMITADOR (Bounding Box)
    // ═══════════════════════════════════════════════════════════════
    // metersPerDegree = metros por grado de latitud/longitud en el Ecuador (aprox)
    // Este es un valor empírico estándar usado globalmente para conversiones
    // entre grados de coordenadas y metros. Sirve para aproximar rápidamente
    // qué paradas están "cerca" antes de calcular la distancia exacta.
    const latDelta = safeRadiusMeters / metersPerDegree;
    
    // cos(latitud) = ajusta la longitud porque los meridianos convergen hacia los polos
    // Ejemplo: a 60° de latitud, cada grado de longitud = ~55 km (no 111 km)
    // Esto compensa la curvatura de la Tierra según la latitud actual
    const lonCos = Math.cos(this.toRadians(lat));
    
    // Delta de longitud ajustado por la latitud
    // Math.max(Math.abs(lonCos), minimumCosineValue) evita división por cero en los polos
    const lonDelta =
      safeRadiusMeters /
      (metersPerDegree * Math.max(Math.abs(lonCos), minimumCosineValue));

    // Crear el cuadro delimitador: [minLat, maxLat] x [minLon, maxLon]
    // Esto reduce drásticamente el conjunto de datos antes del cálculo exacto
    const minLat = lat - latDelta;
    const maxLat = lat + latDelta;
    const minLon = lon - lonDelta;
    const maxLon = lon + lonDelta;

    // ═══════════════════════════════════════════════════════════════
    // PASO 2: CÁLCULO DE DISTANCIA EXACTA (Fórmula Haversine)
    // ═══════════════════════════════════════════════════════════════
    // earthRadiusMeters = Radio de la Tierra en metros (6,371 km es el valor estándar)
    // acos() = arcocoseno (inverso del coseno, rango [0, π])
    // radians() = convierte grados a radianes (x * π/180)
    // 
    // La fórmula Haversine calcula la distancia sobre la esfera terrestre
    // entre dos puntos dados sus coordenadas en latitud/longitud:
    // d = R * arccos(cos(lat1) * cos(lat2) * cos(lon2-lon1) + sin(lat1) * sin(lat2))
    // Donde R = 6371000 metros (radio terrestre)
    const distanceExpr = `(
      ${earthRadiusMeters} * acos(
        cos(radians(:lat)) * cos(radians(s.latitude)) *
        cos(radians(s.longitude) - radians(:lon)) +
        sin(radians(:lat)) * sin(radians(s.latitude))
      )
    )`;

    // “Busca las paradas dentro de una zona aproximada cercana, 
    // calcula la distancia exacta desde mi ubicación, agrupa sus rutas, 
    // filtra solo las que estén dentro del radio permitido, 
    // ordénalas por cercanía y devuelve las más próximas.”
    // ═══════════════════════════════════════════════════════════════
    // PASO 3: CONSULTA A BASE DE DATOS CON FILTRO Y ORDENAMIENTO
    // ═══════════════════════════════════════════════════════════════
    // Selecciona paradas dentro del cuadro delimitador,
    // calcula distancias exactas, agrupa rutas asociadas,
    // filtra por radio exacto, ordena por proximidad.
    const raw = await this.stopRepository
      .createQueryBuilder('s')
      .select('s.id', 'id')
      .addSelect('s.name', 'name')
      .addSelect('s.location', 'location')
      .addSelect('s.latitude', 'latitude')
      .addSelect('s.longitude', 'longitude')
      // Calcula distancia en metros, redondea a 2 decimales
      .addSelect(`ROUND((${distanceExpr})::numeric, 2)`, 'distanceMeters')
      // Agrega las rutas asociadas como JSON array, vacío si no hay
      // COALESCE(valor1, valor2, ...) = función SQL que devuelve el PRIMER valor NO NULL
      // Si jsonb_agg() encuentra rutas, devuelve el array JSON con ellas
      // Si NO encuentra rutas (retorna NULL), devuelve '[]'::jsonb (array JSON vacío)
      // Esto evita que la respuesta tenga valores NULL para paradas sin rutas
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
      // Conecta: paradas → nodos → rutas
      .leftJoin('nodes', 'n', 'n."stopId" = s.id')
      .leftJoin('routes', 'r', 'r.id = n."routeId"')
      // FILTRO 1: Cuadro delimitador (rápido con índice)
      .where('s.latitude BETWEEN :minLat AND :maxLat', { minLat, maxLat })
      .andWhere('s.longitude BETWEEN :minLon AND :maxLon', { minLon, maxLon })
      // Agrupa por parada para usar funciones de agregación
      .groupBy('s.id')
      // FILTRO 2: Distancia exacta en metros
      .having(`${distanceExpr} <= :radiusMeters`, {
        radiusMeters: safeRadiusMeters,
      })
      // Ordena por distancia ascendente (más cercanas primero)
      .orderBy('"distanceMeters"', 'ASC')
      .limit(safeLimit)
      .setParameters({ lat, lon })
      .getRawMany();

      return raw.map((row) => {
        // Parsea rutas si vienen como string JSON, si no devuelve el array directamente
      const routesValue =
        typeof row.routes === 'string' ? JSON.parse(row.routes) : row.routes;

      // Crear instancia del DTO usando constructor
      const nearbyStop = new NearbyStopDto();
      nearbyStop.id = row.id;
      nearbyStop.name = row.name;
      nearbyStop.location = row.location;
      nearbyStop.latitude = Number(row.latitude);
      nearbyStop.longitude = Number(row.longitude);
      // Distancia calculada por Haversine en metros
      nearbyStop.distanceMeters = Number(row.distanceMeters);
      // Rutas asociadas a esta parada
      nearbyStop.routes = Array.isArray(routesValue)
        ? routesValue.map((route: { id: string; name: string }) => ({
            id: route.id,
            name: route.name,
          }))
        : [];
      
      return nearbyStop;
    });
  }
}