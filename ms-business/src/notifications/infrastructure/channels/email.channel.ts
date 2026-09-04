import { Injectable, Logger } from '@nestjs/common';
import type { INotificationChannel } from '../../domain/ports/notification-channel.port';
import type {
  NotificationRequest,
  RenderedNotification,
} from '../../domain/notification.types';
import { MsNotificationsClient } from '../clients/ms-notifications.client';

@Injectable()
export class EmailNotificationChannel implements INotificationChannel {
  readonly channel = 'email' as const;
  private readonly logger = new Logger(EmailNotificationChannel.name);

  constructor(private readonly client: MsNotificationsClient) {}

  async send(
    request: NotificationRequest,
    rendered: RenderedNotification,
  ): Promise<void> {
    const to = request.recipient.email?.trim();
    if (!to) {
      this.logger.warn(
        `Skipping email for ${request.type}: recipient has no email`,
      );
      return;
    }

    const success = await this.client.sendEmail({
      to,
      subject: rendered.subject,
      body: rendered.body,
    });

    if (!success) {
      throw new Error(`Failed to send email notification to ${to}`);
    }
  }
}
