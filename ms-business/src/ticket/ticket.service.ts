import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { AlightTicketDto } from './dto/alight-ticket.dto';
import { AlightResponseDto } from './dto/alight-response.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket, TicketStatus } from './entities/ticket.entity';
import { Citizen } from '@/citizen/entities/citizen.entity';
import { PaymentMethodCitizen } from '@/payment-method-citizen/entities/payment-method-citizen.entity';
import { Scheduler } from '@/scheduler/entities/scheduler.entity';
import { History } from '@/history/entities/history.entity';
import { Node } from '@/node/entities/node.entity';
import { plainToInstance } from 'class-transformer';
import { ResponseTicketDto } from './dto/response-ticket.dto';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(Citizen)
    private readonly citizenRepository: Repository<Citizen>,
    @InjectRepository(PaymentMethodCitizen)
    private readonly pmcRepository: Repository<PaymentMethodCitizen>,
    @InjectRepository(Scheduler)
    private readonly schedulerRepository: Repository<Scheduler>,
    @InjectRepository(History)
    private readonly historyRepository: Repository<History>,
    @InjectRepository(Node)
    private readonly nodeRepository: Repository<Node>,
  ) {}

  async create(createTicketDto: CreateTicketDto) {
    if (createTicketDto.citizenId) {
      const cit = await this.citizenRepository.findOne({
        where: { id: createTicketDto.citizenId },
      });
      if (!cit) throw new BadRequestException('Citizen not found');
    }
    if (createTicketDto.paymentMethodCitizenId) {
      const pmc = await this.pmcRepository.findOne({
        where: { id: createTicketDto.paymentMethodCitizenId },
      });
      if (!pmc) throw new BadRequestException('Payment method not found');
    }
    if (createTicketDto.schedulerId) {
      const sch = await this.schedulerRepository.findOne({
        where: { id: createTicketDto.schedulerId },
      });
      if (!sch) throw new BadRequestException('Scheduler not found');
    }

    const ticketData: Partial<Ticket> = {
      citizen: createTicketDto.citizenId
        ? ({ id: createTicketDto.citizenId } as Citizen)
        : undefined,
      paymentMethodCitizen: createTicketDto.paymentMethodCitizenId
        ? ({
            id: createTicketDto.paymentMethodCitizenId,
          } as PaymentMethodCitizen)
        : undefined,
      scheduler: createTicketDto.schedulerId
        ? ({ id: createTicketDto.schedulerId } as Scheduler)
        : undefined,
      buyedAt: createTicketDto.buyedAt
        ? new Date(createTicketDto.buyedAt)
        : undefined,
      appliedRate: createTicketDto.appliedRate,
      status: createTicketDto.status,
      boardedAt: createTicketDto.boardedAt
        ? new Date(createTicketDto.boardedAt)
        : undefined,
    };
    const ticket = this.ticketRepository.create(ticketData);

    const saved = await this.ticketRepository.save(ticket);
    return plainToInstance(ResponseTicketDto, saved);
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

  async findAll(paginationQuery: PaginationQueryDto) {
    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;
    const [items, totalItems] = await this.ticketRepository.findAndCount({
      relations: ['citizen', 'scheduler'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: plainToInstance(ResponseTicketDto, items),
      meta: this.buildPaginationMeta(page, limit, totalItems),
    };
  }

  async findOne(id: string) {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
      relations: ['citizen', 'scheduler'],
    });
    if (!ticket) throw new NotFoundException(`Ticket ${id} not found`);
    return plainToInstance(ResponseTicketDto, ticket);
  }

  async update(id: string, updateTicketDto: UpdateTicketDto) {
    if (updateTicketDto.citizenId) {
      const cit = await this.citizenRepository.findOne({
        where: { id: updateTicketDto.citizenId },
      });
      if (!cit) throw new BadRequestException('Citizen not found');
    }
    if (updateTicketDto.paymentMethodCitizenId) {
      const pmc = await this.pmcRepository.findOne({
        where: { id: updateTicketDto.paymentMethodCitizenId },
      });
      if (!pmc) throw new BadRequestException('Payment method not found');
    }
    if (updateTicketDto.schedulerId) {
      const sch = await this.schedulerRepository.findOne({
        where: { id: updateTicketDto.schedulerId },
      });
      if (!sch) throw new BadRequestException('Scheduler not found');
    }

    const preloadData: Partial<Ticket> = {
      id,
      citizen: updateTicketDto.citizenId
        ? ({ id: updateTicketDto.citizenId } as Citizen)
        : undefined,
      paymentMethodCitizen: updateTicketDto.paymentMethodCitizenId
        ? ({
            id: updateTicketDto.paymentMethodCitizenId,
          } as PaymentMethodCitizen)
        : undefined,
      scheduler: updateTicketDto.schedulerId
        ? ({ id: updateTicketDto.schedulerId } as Scheduler)
        : undefined,
      buyedAt: updateTicketDto.buyedAt
        ? new Date(updateTicketDto.buyedAt)
        : undefined,
      appliedRate: updateTicketDto.appliedRate,
      status: updateTicketDto.status,
      boardedAt: updateTicketDto.boardedAt
        ? new Date(updateTicketDto.boardedAt)
        : undefined,
    };
    const ticket = await this.ticketRepository.preload(preloadData);
    if (!ticket) throw new NotFoundException(`Ticket ${id} not found`);
    const saved = await this.ticketRepository.save(ticket);
    return plainToInstance(ResponseTicketDto, saved);
  }

  async remove(id: string) {
    const ticket = await this.ticketRepository.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException(`Ticket ${id} not found`);
    await this.ticketRepository.delete(id);
    return;
  }

  async alightTicket(
    ticketId: string,
    alightTicketDto: AlightTicketDto,
  ): Promise<AlightResponseDto> {
    // 1. Buscar ticket con todas las relaciones
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
      relations: [
        'citizen',
        'scheduler',
        'scheduler.bus',
        'scheduler.route',
        'histories',
        'histories.node',
        'histories.node.stop',
      ],
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket ${ticketId} not found`);
    }

    // 2. Validar que ticket esté ACTIVE
    if (ticket.status !== TicketStatus.ACTIVE) {
      throw new BadRequestException(
        `Ticket is not active. Current status: ${ticket.status}`,
      );
    }

    // 3. Validar que el bus coincida
    if (ticket.scheduler?.bus?.id !== alightTicketDto.busId) {
      throw new BadRequestException(
        'Bus ID does not match the ticket bus',
      );
    }

    // 4. Buscar el nodo (paradero) de descenso
    const alightNode = await this.nodeRepository.findOne({
      where: { id: alightTicketDto.nodeId },
      relations: ['stop', 'route'],
    });

    if (!alightNode) {
      throw new NotFoundException(`Node (stop) ${alightTicketDto.nodeId} not found`);
    }

    // 5. Validar que el nodo pertenece a la ruta del ticket
    if (alightNode.route?.id !== ticket.scheduler?.route?.id) {
      throw new BadRequestException(
        'Node does not belong to the ticket route',
      );
    }

    // 6. Registrar evento de descenso en History
    const lastOrder = (ticket.histories?.length ?? 0) + 1;
    const alightHistory = this.historyRepository.create({
      ticket,
      node: alightNode,
      order: lastOrder,
    });

    await this.historyRepository.save(alightHistory);

    // 7. Actualizar ticket: status a COMPLETED y completedAt a now
    const now = new Date();
    ticket.status = TicketStatus.COMPLETED;
    ticket.completedAt = now;

    await this.ticketRepository.save(ticket);

    // 8. Calcular tiempo total de viaje
    let totalTravelTime = 0;
    if (ticket.histories && ticket.histories.length > 0) {
      const firstTime = ticket.histories[0]?.createdAt?.getTime() ?? 0;
      const lastTime = now.getTime();
      const totalMs = lastTime - firstTime;
      const minutes = Math.round(totalMs / 60000);
      totalTravelTime = minutes;
    }

    // 9. Retornar respuesta de éxito
    const response = new AlightResponseDto();
    response.message = 'Viaje completado - Gracias por usar nuestro servicio';
    response.ticketId = ticket.id;
    response.completedAt = now;
    response.stopName = alightNode.stop?.name ?? 'Unknown Stop';
    response.totalTravelTime = totalTravelTime;
    return response;
  }
}
