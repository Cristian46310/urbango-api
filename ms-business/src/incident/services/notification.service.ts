import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface NotificationPayload {
  to: string;
  subject: string;
  body: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly notificationUrl: string | undefined;

  constructor(private readonly configService: ConfigService) {
    const notificationBaseUrl = this.configService
      .get<string>('NOTIFICATIONS_URL')
      ?.replace(/\/$/, '');

    this.notificationUrl =
      this.configService.get<string>('MS_NOTIFICATION_URL') ??
      (notificationBaseUrl
        ? `${notificationBaseUrl}/api/email/send`
        : undefined);
  }

  async sendEmail(payload: NotificationPayload): Promise<boolean> {
    if (!this.notificationUrl) {
      this.logger.warn('Notification service URL not configured');
      return false;
    }

    try {
      const response = await fetch(this.notificationUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        const detail = await response.text();
        this.logger.error(
          `Notification service error: ${response.status} - ${detail}`,
        );
        return false;
      }

      this.logger.debug(`Email sent successfully to ${payload.to}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to reach notification service: ${String(error)}`,
      );
      return false;
    }
  }
}
