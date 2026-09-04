import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationDispatcher } from '@/notifications/application/notification.dispatcher';
import { Turn } from '../entities/turn.entity';
import {
  TURN_ASSIGNED_EVENT,
  TurnAssignedEvent,
} from '../events/turn-assigned.event';

@Injectable()
export class TurnAssignedListener {
  private readonly logger = new Logger(TurnAssignedListener.name);

  constructor(
    @InjectRepository(Turn)
    private readonly turnRepository: Repository<Turn>,
    private readonly notificationDispatcher: NotificationDispatcher,
  ) {}

  @OnEvent(TURN_ASSIGNED_EVENT, { async: true })
  async handle(event: TurnAssignedEvent): Promise<void> {
    try {
      const turn = await this.turnRepository.findOne({
        where: { id: event.turnId },
        relations: ['driver', 'bus'],
      });

      if (!turn) {
        this.logger.warn(
          `TURN_ASSIGNED: turn ${event.turnId} not found; skipping notification`,
        );
        return;
      }

      const email = turn.driver?.email?.trim();
      if (!email) {
        this.logger.warn(
          `TURN_ASSIGNED: turn ${event.turnId} has no driver email; skipping notification`,
        );
        return;
      }

      const driverName = turn.driver.name?.trim() || 'conductor';
      const startTime = turn.startTime;
      const endTime = turn.endTime;

      await this.notificationDispatcher.send({
        type: 'TURN_ASSIGNED',
        channels: ['email'],
        recipient: {
          id: turn.driver.id,
          name: driverName,
          email,
        },
        data: {
          driverName,
          plate: turn.bus?.plate ?? 'N/A',
          date: startTime.toISOString().slice(0, 10),
          startTime: startTime.toISOString(),
          endTime: endTime ? endTime.toISOString() : 'N/A',
          status: turn.status,
        },
      });
    } catch (error) {
      this.logger.error(
        `TURN_ASSIGNED notify failed turn=${event.turnId}: ${String(error)}`,
      );
    }
  }
}
