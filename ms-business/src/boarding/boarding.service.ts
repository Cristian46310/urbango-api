import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BoardingRequestDto } from './dto/boarding-request.dto';
import { BoardingResponseDto } from './dto/boarding-response.dto';
import { PaymentMethodCitizen } from '@/payment-method-citizen/entities/payment-method-citizen.entity';
import {
  Scheduler,
  SchedulerStatus,
} from '@/scheduler/entities/scheduler.entity';
import { Ticket, TicketStatus } from '@/ticket/entities/ticket.entity';
import { History } from '@/history/entities/history.entity';
import { HistoryEventType } from '@/history/enums/history-event-type.enum';
import { Citizen } from '@/citizen/entities/citizen.entity';
import { Node } from '@/node/entities/node.entity';
import { Bus } from '@/bus/entities/bus.entity';

@Injectable()
export class BoardingService {
  private readonly logger = new Logger(BoardingService.name);

  constructor(private readonly dataSource: DataSource) {}

  private getBusCapacity(bus?: Bus | null): number | undefined {
    if (!bus) return undefined;
    return (bus.seatedCapacity ?? 0) + (bus.standingCapacity ?? 0);
  }

  async board(
    dto: BoardingRequestDto,
    citizenId?: string,
  ): Promise<BoardingResponseDto> {
    if (!citizenId) {
      throw new BadRequestException('Citizen id not found in token');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const now = new Date();
      const today = this.formatDateInTimeZone(now, 'America/Bogota');

      // Sin lock aquí: cargar route eager (nodes) + FOR UPDATE rompe en PostgreSQL
      const candidates = await queryRunner.manager.find(Scheduler, {
        where: {
          bus: { id: dto.busId },
          date: today,
          status: SchedulerStatus.SCHEDULED,
        },
        relations: ['bus', 'route'],
      });

      const scheduler = candidates.find((item) => {
        const windowStart = new Date(
          item.startTime.getTime() - item.toleranceMinutes * 60 * 1000,
        );
        return now >= windowStart && now <= item.endTime;
      });

      if (!scheduler) {
        throw new NotFoundException(
          'No hay programación activa para este bus en la fecha y hora actual. Verifique fecha del scheduler, ventana startTime–endTime y toleranceMinutes.',
        );
      }

      // Lock scheduler row after selection to serialize capacity checks
      const lockedScheduler = await queryRunner.manager
        .createQueryBuilder(Scheduler, 'scheduler')
        .setLock('pessimistic_write')
        .where('scheduler.id = :id', { id: scheduler.id })
        .getOne();

      if (!lockedScheduler) {
        throw new NotFoundException(
          'No hay programación activa para este bus en la fecha y hora actual. Verifique fecha del scheduler, ventana startTime–endTime y toleranceMinutes.',
        );
      }

      const capacity = this.getBusCapacity(scheduler.bus);
      if (capacity !== undefined && capacity > 0) {
        const activeTickets = await queryRunner.manager.count(Ticket, {
          where: {
            scheduler: { id: lockedScheduler.id },
            status: TicketStatus.ACTIVE,
          },
        });

        if (activeTickets >= capacity) {
          throw new ConflictException('Bus is full');
        }
      }

      // Bloquear solo la fila PMC; FOR UPDATE + joins (citizen/address) falla en PostgreSQL
      const paymentMethodCitizen = await queryRunner.manager
        .createQueryBuilder(PaymentMethodCitizen, 'pmc')
        .setLock('pessimistic_write')
        .where('pmc.id = :id', { id: dto.paymentMethodCitizenId })
        .getOne();

      if (!paymentMethodCitizen) {
        throw new BadRequestException('Payment method not found');
      }

      const pmcWithRelations = await queryRunner.manager.findOne(
        PaymentMethodCitizen,
        {
          where: { id: paymentMethodCitizen.id },
          relations: ['citizen', 'paymentMethod'],
        },
      );

      if (!pmcWithRelations?.citizen || !pmcWithRelations.paymentMethod) {
        throw new BadRequestException('Payment method not found');
      }

      paymentMethodCitizen.citizen = pmcWithRelations.citizen;
      paymentMethodCitizen.paymentMethod = pmcWithRelations.paymentMethod;

      if (paymentMethodCitizen.citizen.id !== citizenId) {
        throw new BadRequestException(
          'Payment method does not belong to the authenticated citizen',
        );
      }

      const node = await queryRunner.manager.findOne(Node, {
        where: { id: dto.nodeId },
        relations: ['route'],
      });

      if (!node) {
        throw new BadRequestException('Node not found');
      }

      if (node.route?.id !== scheduler.route.id) {
        throw new BadRequestException(
          'Boarding node does not belong to the scheduled route',
        );
      }

      const appliedRate = Number(scheduler.route.price);
      let remainingBalance: number | undefined;

      if (paymentMethodCitizen.paymentMethod?.isRechargeable) {
        const currentBalance = Number(paymentMethodCitizen.balance);

        if (currentBalance < appliedRate) {
          throw new BadRequestException('Insufficient balance');
        }

        remainingBalance = currentBalance - appliedRate;
        paymentMethodCitizen.balance = remainingBalance;
        await queryRunner.manager.save(
          PaymentMethodCitizen,
          paymentMethodCitizen,
        );
      }

      const ticket = queryRunner.manager.create(Ticket, {
        citizen: { id: citizenId } as Citizen,
        paymentMethodCitizen: {
          id: paymentMethodCitizen.id,
        } as PaymentMethodCitizen,
        scheduler: { id: scheduler.id } as Scheduler,
        status: TicketStatus.ACTIVE,
        boardedAt: now,
      });
      const savedTicket = await queryRunner.manager.save(Ticket, ticket);

      const history = queryRunner.manager.create(History, {
        ticket: { id: savedTicket.id } as Ticket,
        node: { id: node.id } as Node,
        eventType: HistoryEventType.BOARDING,
      });
      await queryRunner.manager.save(History, history);

      await queryRunner.commitTransaction();

      return {
        success: true,
        message: 'Abordaje exitoso',
        ticketId: savedTicket.id,
        remainingBalance,
        boardedAt: now,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error('Boarding transaction failed', error);
      throw new InternalServerErrorException('Boarding could not be completed');
    } finally {
      await queryRunner.release();
    }
  }

  private formatDateInTimeZone(date: Date, timeZone: string): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);

    const year = parts.find((part) => part.type === 'year')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    const day = parts.find((part) => part.type === 'day')?.value;

    return `${year}-${month}-${day}`;
  }
}
