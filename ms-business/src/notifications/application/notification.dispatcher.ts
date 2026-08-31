import { Inject, Injectable, Logger } from '@nestjs/common';
import type { INotificationChannel } from '../domain/ports/notification-channel.port';
import { NOTIFICATION_CHANNELS } from '../domain/ports/notification-channel.port';
import type {
  NotificationRequest,
  RenderedNotification,
} from '../domain/notification.types';
import { renderTurnAssigned } from './templates/turn-assigned.template';

@Injectable()
export class NotificationDispatcher {
  private readonly logger = new Logger(NotificationDispatcher.name);
  private readonly channelsByName: Map<string, INotificationChannel>;

  constructor(
    @Inject(NOTIFICATION_CHANNELS)
    channels: INotificationChannel[],
  ) {
    this.channelsByName = new Map(channels.map((c) => [c.channel, c]));
  }

  async send(request: NotificationRequest): Promise<void> {
    const rendered = this.render(request);

    for (const channelName of request.channels) {
      const channel = this.channelsByName.get(channelName);
      if (!channel) {
        this.logger.warn(`No provider registered for channel ${channelName}`);
        continue;
      }

      try {
        await channel.send(request, rendered);
      } catch (error) {
        this.logger.error(
          `Failed to send ${request.type} via ${channelName}: ${String(error)}`,
        );
      }
    }
  }

  private render(request: NotificationRequest): RenderedNotification {
    switch (request.type) {
      case 'TURN_ASSIGNED':
        return renderTurnAssigned(request.data);
      default: {
        const subject =
          typeof request.data.subject === 'string'
            ? request.data.subject
            : request.type;
        const body =
          typeof request.data.body === 'string'
            ? request.data.body
            : JSON.stringify(request.data);
        return { subject, body };
      }
    }
  }
}
