import type {
  NotificationChannel,
  NotificationRequest,
  RenderedNotification,
} from '../notification.types';

export interface INotificationChannel {
  readonly channel: NotificationChannel;
  send(
    request: NotificationRequest,
    rendered: RenderedNotification,
  ): Promise<void>;
}

export const NOTIFICATION_CHANNELS = Symbol('NOTIFICATION_CHANNELS');
