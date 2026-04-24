import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateNodeDto } from './dto/create-node.dto';
import { UpdateNodeDto } from './dto/update-node.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Route } from 'src/route/entities/route.entity';
import { Stop } from 'src/stop/entities/stop.entity';
import { Node } from './entities/node.entity';

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

  async create(routeId: string, stopId: string, createNodeDto: CreateNodeDto) {
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

    return await this.nodeRepository.save(node);
  }

  async findAll() {
    return await this.nodeRepository.find();
  }

  async findOne(id: string) {
    const node = await this.nodeRepository.findOne({ where: { id } });
    if (!node) {
      throw new NotFoundException(`Node with id ${id} not found`);
    }
    return node;
  }

  async update(id: string, updateNodeDto: UpdateNodeDto) {
    const node = await this.findOne(id);
    Object.assign(node, updateNodeDto);
    return await this.nodeRepository.save(node);
  }

  async remove(id: string) {
    const node = await this.findOne(id);
    return await this.nodeRepository.remove(node);
  }
}
