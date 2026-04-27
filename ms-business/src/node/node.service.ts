import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateNodeDto } from './dto/create-node.dto';
import { UpdateNodeDto } from './dto/update-node.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Route } from 'src/route/entities/route.entity';
import { Stop } from 'src/stop/entities/stop.entity';
import { Node } from './entities/node.entity';
import { ResponseNodeDto } from './dto/response-node.dto';

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
    });
    const savedNode = await this.nodeRepository.save(node);
    return {
      order: savedNode.order,
      stopId: savedNode.stop.id,
      routeId: savedNode.route.id,
    };
  }

  async findAll(): Promise<ResponseNodeDto[]> {
    const nodes = await this.nodeRepository.find({ relations: ['route', 'stop'] });
    return nodes.map((node) => ({
      order: node.order,
      stopId: node.stop.id,
      routeId: node.route.id,
    }));
  }

  async findOne(id: string): Promise<ResponseNodeDto> {
    const node = await this.nodeRepository.findOne({ where: { id }, relations: ['route', 'stop'] });
    if (!node) {
      throw new NotFoundException(`Node with id ${id} not found`);
    }
    return {
      order: node.order,
      stopId: node.stop.id,
      routeId: node.route.id,
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
    const updatedNode = await this.nodeRepository.save(node);
    // Reload with relations to ensure route is loaded
    const nodeWithRelations = await this.nodeRepository.findOne({ where: { id: updatedNode.id }, relations: ['route', 'stop'] });
    if (!nodeWithRelations) {
      throw new NotFoundException(`Node with id ${id} not found`);
    }
    return {
      order: nodeWithRelations.order,
      stopId: nodeWithRelations.stop.id,
      routeId: nodeWithRelations.route.id,
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
