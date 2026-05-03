import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Route } from './entities/route.entity';
import { In, Repository } from 'typeorm';
import { CreateRouteNodesDto } from './dto/create-route-nodes.dto';
import { Stop } from 'src/stop/entities/stop.entity';
import { Node } from 'src/node/entities/node.entity';
import { UpdateRouteNodesDto } from './dto/update-route-nodes.dto';
import { ResponseRouteDto } from './dto/response-route.dto';
import { PaginationQueryDto } from 'src/shared/dto/pagination-query.dto';
import { ResponseRouteListDto } from './dto/response-route-list.dto';
import { ResponseStopDto } from 'src/stop/dto/response-stop.dto';

@Injectable()
export class RouteService {
  constructor(
    @InjectRepository(Route)
    private readonly routeRepository: Repository<Route>,
    @InjectRepository(Node)
    private readonly nodeRepository: Repository<Node>,
    @InjectRepository(Stop)
    private readonly stopRepository: Repository<Stop>,
  ) {}

  private toResponseRouteDto(route: Route): ResponseRouteDto {
    return {
      id: route.id,
      name: route.name,
      description: route.description,
      price: route.price,
      stops: (route.nodes ?? [])
        .slice()
        .sort((left, right) => left.order - right.order)
        .map((node): ResponseStopDto => ({
          id: node.stop.id,
          name: node.stop.name,
          location: node.stop.location,
          createdAt: node.stop.createdAt,
        })),
      createdAt: route.createdAt,
    };
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

    // 1. Crear la ruta primero
    const route = this.routeRepository.create({
      name,
      description,
      price,
    });
    const savedRoute = await this.routeRepository.save(route);

    // 2. Si vienen nodos, crear las relaciones
    if (nodes && nodes.length > 0) {
      // Validar que los stops existan
      const stopIds = nodes.map((node) => node.stopId);
      const stops = await this.stopRepository.findBy({ id: In(stopIds) });

      if (stops.length !== stopIds.length) {
        throw new BadRequestException('Uno o más stops no existen');
      }

      // Validar que los órdenes sean únicos
      const orders = nodes.map((node) => node.order);
      if (new Set(orders).size !== orders.length) {
        throw new BadRequestException(
          'Los órdenes deben ser únicos en la ruta',
        );
      }

      // 3. Crear los nodos en orden
      const createdNodes = nodes.map((nodeDto) => {
        const stop = stops.find((s) => s.id === nodeDto.stopId);
        return this.nodeRepository.create({
          route: savedRoute,
          stop: stop!,
          order: nodeDto.order,
        });
      });

      await this.nodeRepository.save(createdNodes);

      // Cargar la ruta con sus nodos ordenados
      const createdRoute = await this.routeRepository.findOne({
        where: { id: savedRoute.id },
        relations: ['nodes'],
      });
      if (!createdRoute) {
        throw new BadRequestException('Ruta no encontrada');
      }
      return this.toResponseRouteDto(createdRoute);
    }

    return this.toResponseRouteDto(savedRoute);
  }

  async findAll(
    paginationQuery: PaginationQueryDto,
  ): Promise<ResponseRouteListDto> {
    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;
    const [routes, totalItems] = await this.routeRepository.findAndCount({
      relations: ['nodes'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: routes.map((route) => this.toResponseRouteDto(route)),
      meta: this.buildPaginationMeta(page, limit, totalItems),
    };
  }

  async findOne(id: string): Promise<ResponseRouteDto> {
    const route = await this.routeRepository.findOne({
      where: { id },
      relations: ['nodes'],
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
    // 1. Validar que la ruta existe
    const route = await this.routeRepository.findOne({ where: { id } });
    if (!route) {
      throw new BadRequestException('Ruta no encontrada');
    }

    const { name, description, price, nodes } = updateRouteDto;

    // 2. Validar todos los nodos ANTES de hacer cualquier cambio
    let validatedStops: Stop[] = [];
    if (nodes !== undefined && nodes.length > 0) {
      // Validar que los stops existan
      const stopIds = nodes.map((node) => node.stopId);
      validatedStops = await this.stopRepository.findBy({ id: In(stopIds) });

      if (validatedStops.length !== stopIds.length) {
        throw new BadRequestException('Uno o más stops no existen');
      }

      // Validar que los órdenes sean únicos
      const orders = nodes.map((node) => node.order);
      if (new Set(orders).size !== orders.length) {
        throw new BadRequestException(
          'Los órdenes deben ser únicos en la ruta',
        );
      }
    }

    // 3. Si todas las validaciones pasaron, proceder con las actualizaciones
    // Actualizar los campos básicos de la ruta si vienen en el DTO
    const updateData: Partial<Route> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;

    if (Object.keys(updateData).length > 0) {
      await this.routeRepository.update(id, updateData);
    }

    // 4. Actualizar nodos si vienen en el DTO
    if (nodes !== undefined) {
      // Eliminar los nodos existentes de la ruta
      await this.nodeRepository.delete({ route: { id } });

      // Crear los nuevos nodos en orden
      if (nodes.length > 0) {
        const createdNodes = nodes.map((nodeDto) => {
          const stop = validatedStops.find((s) => s.id === nodeDto.stopId);
          return this.nodeRepository.create({
            route,
            stop: stop!,
            order: nodeDto.order,
          });
        });

        await this.nodeRepository.save(createdNodes);
      }
    }

    // 5. Retornar la ruta actualizada con sus nodos
    const updatedRoute = await this.routeRepository.findOne({
      where: { id },
      relations: ['nodes'],
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
    return await this.routeRepository.delete(id);
  }
}
