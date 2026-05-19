import { Injectable, NotFoundException } from '@nestjs/common';
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

    const node = this.nodeRepository.create({
      route,
      stop: stop,
      order: createNodeDto.order,
      distanceFromPrevious: createNodeDto.distanceFromPrevious,
      estimatedTimeMinutes: createNodeDto.estimatedTimeMinutes,
    });
    const savedNode = await this.nodeRepository.save(node);
    return {
      order: savedNode.order,
      stopId: savedNode.stop.id,
      routeId: savedNode.route.id,
      distanceFromPrevious: Number(savedNode.distanceFromPrevious),
      estimatedTimeMinutes: savedNode.estimatedTimeMinutes,
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
      items: nodes.map((node) => ({
        order: node.order,
        stopId: node.stop.id,
        routeId: node.route.id,
        distanceFromPrevious: Number(node.distanceFromPrevious),
        estimatedTimeMinutes: node.estimatedTimeMinutes,
      })),
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
    return {
      order: node.order,
      stopId: node.stop.id,
      routeId: node.route.id,
      distanceFromPrevious: Number(node.distanceFromPrevious),
      estimatedTimeMinutes: node.estimatedTimeMinutes,
    };
  }

  async update(
    id: string,
    updateNodeDto: UpdateNodeDto,
  ): Promise<ResponseNodeDto> {
    const node = await this.nodeRepository.preload({ id, ...updateNodeDto });
    if (!node) {
      throw new NotFoundException(`Node with id ${id} not found`);
    }
    if (updateNodeDto.order !== undefined) {
      node.order = updateNodeDto.order;
    }
    if (updateNodeDto.distanceFromPrevious !== undefined) {
      node.distanceFromPrevious = updateNodeDto.distanceFromPrevious;
    }
    if (updateNodeDto.estimatedTimeMinutes !== undefined) {
      node.estimatedTimeMinutes = updateNodeDto.estimatedTimeMinutes;
    }
    const updatedNode = await this.nodeRepository.save(node);
    // Reload with relations to ensure route is loaded
    const nodeWithRelations = await this.nodeRepository.findOne({
      where: { id: updatedNode.id },
      relations: ['route', 'stop'],
    });
    if (!nodeWithRelations) {
      throw new NotFoundException(`Node with id ${id} not found`);
    }
    return {
      order: nodeWithRelations.order,
      stopId: nodeWithRelations.stop.id,
      routeId: nodeWithRelations.route.id,
      distanceFromPrevious: Number(nodeWithRelations.distanceFromPrevious),
      estimatedTimeMinutes: nodeWithRelations.estimatedTimeMinutes,
    };
  }

  async remove(id: string): Promise<void> {
    const node = await this.findOne(id);
    if (!node) {
      throw new NotFoundException(`Node with id ${id} not found`);
    }
    await this.nodeRepository.delete(id);
    return;
  }
}
