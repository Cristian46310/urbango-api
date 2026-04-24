import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Route } from './entities/route.entity';
import { In, Repository } from 'typeorm';
import { CreateRouteNodesDto } from './dto/create-route-nodes.dto';
import { Stop } from 'src/stop/entities/stop.entity';
import { Node } from 'src/node/entities/node.entity';
import { UpdateRouteNodesDto } from './dto/update-route-nodes.dto';

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
  async create(createRouteDto: CreateRouteNodesDto) {
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
      return await this.routeRepository.findOne({
        where: { id: savedRoute.id },
        relations: ['nodes'],
      });
    }

    return savedRoute;
  }

  async findAll() {
    return await this.routeRepository.find({ relations: ['nodes'] });
  }

  async findOne(id: string) {
    const route = await this.routeRepository.findOne({
      where: { id },
      relations: ['nodes'],
    });
    if (!route) {
      throw new BadRequestException('Ruta no encontrada');
    }
    return route;
  }

  async update(id: string, updateRouteDto: UpdateRouteNodesDto) {
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
    return await this.routeRepository.findOne({
      where: { id },
      relations: ['nodes'],
    });
  }

  async remove(id: string) {
    const route = await this.routeRepository.findOne({ where: { id } });
    if (!route) {
      throw new BadRequestException('Ruta no encontrada');
    }
    return await this.routeRepository.delete(id);
  }
}
