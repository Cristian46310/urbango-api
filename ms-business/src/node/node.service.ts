import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateNodeDto } from './dto/create-node.dto';
import { UpdateNodeDto } from './dto/update-node.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Route } from '@/route/entities/route.entity';
import { Stop } from '@/stop/entities/stop.entity';
import { Node } from './entities/node.entity';
import { ResponseNodeDto } from './dto/response-node.dto';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import { ResponseNodeListDto } from './dto/response-node-list.dto';

const MIN_ROUTE_NODES = 3;

@Injectable()
export class NodeService {
  constructor(
    @InjectRepository(Node)
    private readonly nodeRepository: Repository<Node>,
    @InjectRepository(Route)
    private readonly routeRepository: Repository<Route>,
    @InjectRepository(Stop)
    private readonly stopRepository: Repository<Stop>,
  ) {}

  private toResponse(node: Node): ResponseNodeDto {
    return {
      id: node.id,
      order: node.order,
      stopId: node.stop.id,
      routeId: node.route.id,
      estimatedTimeMinutes: node.estimatedTimeMinutes,
    };
  }

  private assertRouteNodeRules(
    nodes: Array<{
      id?: string;
      stopId: string;
      order: number;
      estimatedTimeMinutes: number;
    }>,
    options?: { enforceMinCount?: boolean },
  ): void {
    const enforceMinCount = options?.enforceMinCount ?? true;
    if (enforceMinCount && nodes.length < MIN_ROUTE_NODES) {
      throw new BadRequestException(
        `La ruta debe conservar al menos ${MIN_ROUTE_NODES} paraderos`,
      );
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

  private async loadRouteNodes(routeId: string): Promise<Node[]> {
    return this.nodeRepository.find({
      where: { route: { id: routeId } },
      relations: ['route', 'stop'],
      order: { order: 'ASC' },
    });
  }

  async create(
    routeId: string,
    stopId: string,
    createNodeDto: CreateNodeDto,
  ): Promise<ResponseNodeDto> {
    const route = await this.routeRepository.findOne({
      where: { id: routeId },
    });
    if (!route) {
      throw new NotFoundException(`Route with id ${routeId} not found`);
    }

    const stop = await this.stopRepository.findOne({ where: { id: stopId } });
    if (!stop) {
      throw new NotFoundException(`Stop with id ${stopId} not found`);
    }

    const existing = await this.loadRouteNodes(routeId);
    const projected = [
      ...existing.map((node) => ({
        id: node.id,
        stopId: node.stop.id,
        order: node.order,
        estimatedTimeMinutes: node.estimatedTimeMinutes,
      })),
      {
        stopId,
        order: createNodeDto.order,
        estimatedTimeMinutes: createNodeDto.estimatedTimeMinutes,
      },
    ];

    // Al crear el primer nodo de una ruta vacía no exigimos aún el mínimo de 3.
    this.assertRouteNodeRules(projected, {
      enforceMinCount: existing.length >= MIN_ROUTE_NODES,
    });

    const conflict = await this.nodeRepository.findOne({
      where: [
        { route: { id: routeId }, order: createNodeDto.order },
        { route: { id: routeId }, stop: { id: stopId } },
      ],
    });
    if (conflict) {
      throw new ConflictException(
        'Ya existe un nodo con ese orden o paradero en la ruta',
      );
    }

    const node = this.nodeRepository.create({
      route,
      stop,
      order: createNodeDto.order,
      estimatedTimeMinutes: createNodeDto.estimatedTimeMinutes,
    });
    const savedNode = await this.nodeRepository.save(node);
    const withRelations = await this.nodeRepository.findOne({
      where: { id: savedNode.id },
      relations: ['route', 'stop'],
    });
    return this.toResponse(withRelations ?? savedNode);
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
  ): Promise<ResponseNodeListDto> {
    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;
    const [nodes, totalItems] = await this.nodeRepository.findAndCount({
      relations: ['route', 'stop'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: nodes.map((node) => this.toResponse(node)),
      meta: this.buildPaginationMeta(page, limit, totalItems),
    };
  }

  async findOne(id: string): Promise<ResponseNodeDto> {
    const node = await this.nodeRepository.findOne({
      where: { id },
      relations: ['route', 'stop'],
    });
    if (!node) {
      throw new NotFoundException(`Node with id ${id} not found`);
    }
    return this.toResponse(node);
  }

  async update(
    id: string,
    updateNodeDto: UpdateNodeDto,
  ): Promise<ResponseNodeDto> {
    const node = await this.nodeRepository.findOne({
      where: { id },
      relations: ['route', 'stop'],
    });
    if (!node) {
      throw new NotFoundException(`Node with id ${id} not found`);
    }

    const siblings = await this.loadRouteNodes(node.route.id);
    const projected = siblings.map((sibling) => {
      if (sibling.id !== id) {
        return {
          id: sibling.id,
          stopId: sibling.stop.id,
          order: sibling.order,
          estimatedTimeMinutes: sibling.estimatedTimeMinutes,
        };
      }
      return {
        id: sibling.id,
        stopId: sibling.stop.id,
        order: updateNodeDto.order ?? sibling.order,
        estimatedTimeMinutes:
          updateNodeDto.estimatedTimeMinutes ?? sibling.estimatedTimeMinutes,
      };
    });
    this.assertRouteNodeRules(projected);

    if (updateNodeDto.order !== undefined) {
      node.order = updateNodeDto.order;
    }
    if (updateNodeDto.estimatedTimeMinutes !== undefined) {
      node.estimatedTimeMinutes = updateNodeDto.estimatedTimeMinutes;
    }

    const updatedNode = await this.nodeRepository.save(node);
    return this.toResponse(updatedNode);
  }

  async remove(id: string): Promise<void> {
    const node = await this.nodeRepository.findOne({
      where: { id },
      relations: ['route', 'stop'],
    });
    if (!node) {
      throw new NotFoundException(`Node with id ${id} not found`);
    }

    const siblings = await this.loadRouteNodes(node.route.id);
    if (siblings.length <= MIN_ROUTE_NODES) {
      throw new BadRequestException(
        `No se puede eliminar: la ruta debe conservar al menos ${MIN_ROUTE_NODES} paraderos`,
      );
    }

    const remaining = siblings
      .filter((sibling) => sibling.id !== id)
      .sort((left, right) => left.order - right.order);

    await this.nodeRepository.delete(id);

    for (let index = 0; index < remaining.length; index += 1) {
      const sibling = remaining[index];
      sibling.order = index + 1;
      if (index === 0) {
        sibling.estimatedTimeMinutes = 0;
      }
      await this.nodeRepository.save(sibling);
    }
  }
}
