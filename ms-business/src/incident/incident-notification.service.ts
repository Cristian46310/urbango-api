import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Incident } from './entities/incident.entity';
import { IncidentBus } from './entities/incident-bus.entity';

@Injectable()
export class IncidentNotificationService {
  private readonly logger = new Logger(IncidentNotificationService.name);
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

  async notifySupervisorIfNeeded(
    incident: Incident,
    incidentBus: IncidentBus,
  ): Promise<void> {
    if (!['high', 'critical'].includes(incident.severity)) return;

    const supervisorEmail =
      incident.enterprise.supervisorEmail ??
      this.configService.get<string>('INCIDENT_SUPERVISOR_EMAIL');

    if (!supervisorEmail || !this.notificationUrl) {
      this.logger.warn(
        `Incident ${incident.id} requires supervisor notification, but notification config is incomplete`,
      );
      return;
    }

    const bus = incidentBus.bus;
    let response: Response;
    try {
      response = await fetch(this.notificationUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: supervisorEmail,
          subject: `Incidente ${incident.severity} reportado`,
          body: [
            `Se reporto un incidente de gravedad ${incident.severity}.`,
            `Tipo: ${incident.type}`,
            `Bus: ${bus.plate}`,
            `Descripcion: ${incident.description}`,
            `Ubicacion: ${incident.latitude ?? 'N/A'}, ${incident.longitude ?? 'N/A'}`,
            `Fecha: ${incident.reportedAt.toISOString()}`,
          ].join('\n'),
        }),
      });
    } catch (error) {
      this.logger.error(
        `Could not reach notification service for incident ${incident.id}: ${String(error)}`,
      );
      return;
    }

    if (!response.ok) {
      const detail = await response.text();
      this.logger.error(
        `Could not notify supervisor for incident ${incident.id}: ${detail}`,
      );
    }
  }
}
