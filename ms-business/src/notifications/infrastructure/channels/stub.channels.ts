import { Injectable, Logger } from '@nestjs/common';
import type { INotificationChannel } from '../../domain/ports/notification-channel.port';
import type {
  NotificationChannel,
  NotificationRequest,
  RenderedNotification,
} from '../../domain/notification.types';

@Injectable()
export class SmsNotificationChannel implements INotificationChannel {
  readonly channel: NotificationChannel = 'sms';
  private readonly logger = new Logger(SmsNotificationChannel.name);

  send(
    request: NotificationRequest,
    rendered: RenderedNotification,
  ): Promise<void> {
    void rendered;
    this.logger.debug(
      `Stub sms channel: skipped ${request.type} for ${request.recipient.name}`,
    );
    return Promise.resolve();
  }
}

@Injectable()
export class PushNotificationChannel implements INotificationChannel {
  readonly channel: NotificationChannel = 'push';
  private readonly logger = new Logger(PushNotificationChannel.name);

  send(
    request: NotificationRequest,
    rendered: RenderedNotification,
  ): Promise<void> {
    void rendered;
    this.logger.debug(
      `Stub push channel: skipped ${request.type} for ${request.recipient.name}`,
    );
    return Promise.resolve();
  }
}

@Injectable()
export class WhatsAppNotificationChannel implements INotificationChannel {
  readonly channel: NotificationChannel = 'whatsapp';
  private readonly logger = new Logger(WhatsAppNotificationChannel.name);

  send(
    request: NotificationRequest,
    rendered: RenderedNotification,
  ): Promise<void> {
    void rendered;
    this.logger.debug(
      `Stub whatsapp channel: skipped ${request.type} for ${request.recipient.name}`,
    );
    return Promise.resolve();
  }
}
