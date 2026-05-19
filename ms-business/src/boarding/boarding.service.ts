import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { BoardingRequestDto } from './dto/boarding-request.dto';
import { BoardingResponseDto } from './dto/boarding-response.dto';
import {
  PaymentMethodCitizen,
  PaymentMethodStatus,
  PaymentMethodType,
} from '@/payment-method-citizen/entities/payment-method-citizen.entity';
import { Scheduler, SchedulerStatus } from '@/scheduler/entities/scheduler.entity';
import { Ticket, TicketStatus } from '@/ticket/entities/ticket.entity';
import { History, HistoryEventType } from '@/history/entities/history.entity';
import { Citizen } from '@/citizen/entities/citizen.entity';
import { Node } from '@/node/entities/node.entity';

@Injectable()
export class BoardingService {
  constructor(private readonly dataSource: DataSource) {}

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

      const scheduler = await queryRunner.manager.findOne(Scheduler, {
        where: {
          bus: { id: dto.busId },
          date: today,
          startTime: LessThanOrEqual(now),
          endTime: MoreThanOrEqual(now),
          status: SchedulerStatus.SCHEDULED,
        },
        relations: ['bus', 'route'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!scheduler) {
        throw new NotFoundException('No active scheduler found for this bus');
      }

      const capacity = scheduler.bus?.capacity;
      if (capacity !== undefined && capacity !== null) {
        const activeTickets = await queryRunner.manager.count(Ticket, {
          where: {
            scheduler: { id: scheduler.id },
            status: TicketStatus.ACTIVE,
          },
        });

        if (activeTickets >= capacity) {
          throw new ConflictException('Bus is full');
        }
      }

      const paymentMethodCitizen = await queryRunner.manager.findOne(
        PaymentMethodCitizen,
        {
          where: { id: dto.paymentMethodCitizenId },
          relations: ['citizen', 'paymentMethod'],
          lock: { mode: 'pessimistic_write' },
        },
      );

      if (!paymentMethodCitizen) {
        throw new BadRequestException('Payment method not found');
      }

      if (paymentMethodCitizen.citizen.id !== citizenId) {
        throw new BadRequestException(
          'Payment method does not belong to the authenticated citizen',
        );
      }

      if (paymentMethodCitizen.status !== PaymentMethodStatus.ACTIVE) {
        throw new BadRequestException('Payment method is not active');
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

      if (paymentMethodCitizen.type === PaymentMethodType.PREPAID) {
        const currentBalance = Number(paymentMethodCitizen.balance);

        if (currentBalance < appliedRate) {
          throw new BadRequestException('Insufficient balance');
        }

        remainingBalance = currentBalance - appliedRate;
        paymentMethodCitizen.balance = remainingBalance;
      }

      paymentMethodCitizen.lastUsedAt = now;
      await queryRunner.manager.save(PaymentMethodCitizen, paymentMethodCitizen);

      const ticket = queryRunner.manager.create(Ticket, {
        citizen: { id: citizenId } as Citizen,
        paymentMethodCitizen: { id: paymentMethodCitizen.id } as PaymentMethodCitizen,
        scheduler: { id: scheduler.id } as Scheduler,
        buyedAt: now,
        appliedRate,
        amount: appliedRate,
        status: TicketStatus.ACTIVE,
        boardedAt: now,
      });
      const savedTicket = await queryRunner.manager.save(Ticket, ticket);

      const history = queryRunner.manager.create(History, {
        ticket: { id: savedTicket.id } as Ticket,
        node: { id: node.id } as Node,
        order: node.order,
        eventType: HistoryEventType.BOARDING,
        eventTimestamp: now,
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
