import { Module } from '@nestjs/common';
import { NotificationDispatcher } from './application/notification.dispatcher';
import { NOTIFICATION_CHANNELS } from './domain/ports/notification-channel.port';
import { MsNotificationsClient } from './infrastructure/clients/ms-notifications.client';
import { EmailNotificationChannel } from './infrastructure/channels/email.channel';
import {
  PushNotificationChannel,
  SmsNotificationChannel,
  WhatsAppNotificationChannel,
} from './infrastructure/channels/stub.channels';

@Module({
  providers: [
    MsNotificationsClient,
    EmailNotificationChannel,
    SmsNotificationChannel,
    PushNotificationChannel,
    WhatsAppNotificationChannel,
    {
      provide: NOTIFICATION_CHANNELS,
      useFactory: (
        email: EmailNotificationChannel,
        sms: SmsNotificationChannel,
        push: PushNotificationChannel,
        whatsapp: WhatsAppNotificationChannel,
      ) => [email, sms, push, whatsapp],
      inject: [
        EmailNotificationChannel,
        SmsNotificationChannel,
        PushNotificationChannel,
        WhatsAppNotificationChannel,
      ],
    },
    NotificationDispatcher,
  ],
  exports: [MsNotificationsClient, NotificationDispatcher],
})
export class NotificationsModule {}
