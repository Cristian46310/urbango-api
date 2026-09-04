export type NotificationChannel = 'email' | 'sms' | 'push' | 'whatsapp';

export type NotificationType = 'TURN_ASSIGNED' | 'INCIDENT_SUPERVISOR';

export interface NotificationRecipient {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface NotificationRequest {
  type: NotificationType;
  channels: NotificationChannel[];
  recipient: NotificationRecipient;
  data: Record<string, unknown>;
}

export interface RenderedNotification {
  subject: string;
  body: string;
}
