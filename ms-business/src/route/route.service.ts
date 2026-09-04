import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Route } from './entities/route.entity';
import { CreateRouteNodesDto } from './dto/create-route-nodes.dto';
import { Stop } from '@/stop/entities/stop.entity';
import { Node } from '@/node/entities/node.entity';
import { UpdateRouteNodesDto } from './dto/update-route-nodes.dto';
import {
  ResponseRouteDto,
  ResponseRouteNodeDto,
} from './dto/response-route.dto';
import { ResponseRouteListDto } from './dto/response-route-list.dto';
import { RouteQueryDto } from './dto/route-query.dto';
import { BaseNodeDto } from '@/node/dto/base-node.dto';

@Injectable()
export class RouteService {
  constructor(
    @InjectRepository(Route)
    private readonly routeRepository: Repository<Route>,
    @InjectRepository(Node)
    private readonly nodeRepository: Repository<Node>,
    @InjectRepository(Stop)
    private readonly stopRepository: Repository<Stop>,
    private readonly dataSource: DataSource,
  ) {}

  private toResponseRouteDto(route: Route): ResponseRouteDto {
    const orderedNodes = (route.nodes ?? [])
      .slice()
      .sort((left, right) => left.order - right.order);

    const nodes = orderedNodes.map(
      (node): ResponseRouteNodeDto => ({
        id: node.id,
        order: node.order,
        estimatedTimeMinutes: node.estimatedTimeMinutes,
        stop: {
          id: node.stop.id,
          code: node.stop.code,
          name: node.stop.name,
          location: node.stop.location,
          latitude:
            node.stop.latitude !== undefined && node.stop.latitude !== null
              ? Number(node.stop.latitude)
              : undefined,
          longitude:
            node.stop.longitude !== undefined && node.stop.longitude !== null
              ? Number(node.stop.longitude)
              : undefined,
          type: node.stop.type,
          createdAt: node.stop.createdAt,
        },
      }),
    );

    return {
      id: route.id,
      code: route.code,
      name: route.name,
      description: route.description,
      price: route.price,
      stops: nodes.map((node) => node.stop),
      nodes,
      createdAt: route.createdAt,
    };
  }

  private validateNodes(nodes: BaseNodeDto[]) {
    if (nodes.length < 3) {
      throw new BadRequestException('La ruta debe tener al menos 3 paraderos');
    }

    const stopIds = nodes.map((node) => node.stopId);
    if (new Set(stopIds).size !== stopIds.length) {
      throw new BadRequestException(
        'La ruta no puede tener paraderos duplicados',
      );
    }

    const orders = nodes.map((node) => node.order);
    if (new Set(orders).size !== orders.length) {
      throw new BadRequestException('Los ordenes deben ser unicos en la ruta');
    }

    const sortedOrders = orders.slice().sort((left, right) => left - right);
    const isSequential = sortedOrders.every(
      (order, index) => order === index + 1,
    );
    if (!isSequential) {
      throw new BadRequestException(
        'Los ordenes deben ser secuenciales desde 1',
      );
    }

    const firstNode = nodes.find((node) => node.order === 1);
    if (firstNode && Number(firstNode.estimatedTimeMinutes) !== 0) {
      throw new BadRequestException(
        'El primer paradero debe tener tiempo estimado en 0',
      );
    }
  }

  private async validateStopsExist(stopIds: string[]): Promise<Stop[]> {
    const stops = await this.stopRepository.findBy({ id: In(stopIds) });

    if (stops.length !== stopIds.length) {
      throw new BadRequestException('Uno o mas stops no existen');
    }

    return stops;
  }

  private async generateRouteCode(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const suffix = attempt === 0 ? '' : `${attempt}`;
      const candidate = `RUT-${Date.now().toString(36).toUpperCase()}${suffix}`;
      const existing = await this.routeRepository.findOne({
        where: { code: candidate },
      });

      if (!existing) return candidate;
    }

    throw new BadRequestException(
      'No se pudo generar un codigo unico para la ruta',
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

  async create(createRouteDto: CreateRouteNodesDto): Promise<ResponseRouteDto> {
    const { name, description, price, nodes } = createRouteDto;

    if (!nodes) {
      throw new BadRequestException('La ruta debe tener al menos 3 paraderos');
    }

    this.validateNodes(nodes);

    const stopIds = nodes.map((node) => node.stopId);
    const stops = await this.validateStopsExist(stopIds);
    const code = await this.generateRouteCode();

    const savedRouteId = await this.dataSource.transaction(async (manager) => {
      const routeRepo = manager.getRepository(Route);
      const nodeRepo = manager.getRepository(Node);

      const route = routeRepo.create({
        code,
        name,
        description,
        price,
      });
      const savedRoute = await routeRepo.save(route);

      const createdNodes = nodes.map((nodeDto) => {
        const stop = stops.find((s) => s.id === nodeDto.stopId);
        return nodeRepo.create({
          route: savedRoute,
          stop: stop!,
          order: nodeDto.order,
          estimatedTimeMinutes: nodeDto.estimatedTimeMinutes,
        });
      });

      await nodeRepo.save(createdNodes);
      return savedRoute.id;
    });

    const createdRoute = await this.routeRepository.findOne({
      where: { id: savedRouteId },
      relations: ['nodes', 'nodes.stop'],
    });
    if (!createdRoute) {
      throw new BadRequestException('Ruta no encontrada');
    }
    return this.toResponseRouteDto(createdRoute);
  }

  async findAll(query: RouteQueryDto): Promise<ResponseRouteListDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const qb = this.routeRepository
      .createQueryBuilder('route')
      .leftJoinAndSelect('route.nodes', 'node')
      .leftJoinAndSelect('node.stop', 'stop')
      .orderBy('route.createdAt', 'DESC');

    if (query.name?.trim()) {
      qb.andWhere('LOWER(route.name) LIKE LOWER(:name)', {
        name: `%${query.name.trim()}%`,
      });
    }

    const [routes, totalItems] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: routes.map((route) => this.toResponseRouteDto(route)),
      meta: this.buildPaginationMeta(page, limit, totalItems),
    };
  }

  async findOne(id: string): Promise<ResponseRouteDto> {
    const route = await this.routeRepository.findOne({
      where: { id },
      relations: ['nodes', 'nodes.stop'],
    });
    if (!route) {
      throw new BadRequestException('Ruta no encontrada');
    }
    return this.toResponseRouteDto(route);
  }

  async update(
    id: string,
    updateRouteDto: UpdateRouteNodesDto,
  ): Promise<ResponseRouteDto> {
    const route = await this.routeRepository.findOne({ where: { id } });
    if (!route) {
      throw new BadRequestException('Ruta no encontrada');
    }

    const { name, description, price, nodes } = updateRouteDto;

    let validatedStops: Stop[] = [];
    if (nodes !== undefined) {
      this.validateNodes(nodes);
      const stopIds = nodes.map((node) => node.stopId);
      validatedStops = await this.validateStopsExist(stopIds);
    }

    const updateData: Partial<Route> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;

    await this.dataSource.transaction(async (manager) => {
      const routeRepo = manager.getRepository(Route);
      const nodeRepo = manager.getRepository(Node);

      if (Object.keys(updateData).length > 0) {
        await routeRepo.update(id, updateData);
      }

      if (nodes !== undefined) {
        await nodeRepo.delete({ route: { id } });

        const createdNodes = nodes.map((nodeDto) => {
          const stop = validatedStops.find((s) => s.id === nodeDto.stopId);
          return nodeRepo.create({
            route,
            stop: stop!,
            order: nodeDto.order,
            estimatedTimeMinutes: nodeDto.estimatedTimeMinutes,
          });
        });

        await nodeRepo.save(createdNodes);
      }
    });

    const updatedRoute = await this.routeRepository.findOne({
      where: { id },
      relations: ['nodes', 'nodes.stop'],
    });
    if (!updatedRoute) {
      throw new BadRequestException('Ruta no encontrada');
    }
    return this.toResponseRouteDto(updatedRoute);
  }

  async remove(id: string) {
    const route = await this.routeRepository.findOne({ where: { id } });
    if (!route) {
      throw new BadRequestException('Ruta no encontrada');
    }
    return await this.routeRepository.softDelete(id);
  }
}
