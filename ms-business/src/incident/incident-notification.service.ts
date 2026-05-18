import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Incident } from './entities/incident.entity';
import { IncidentBus } from './entities/incident-bus.entity';
import { NotificationService } from './services/notification.service';
import { IncidentSeverity } from './enums/incident.enum';

@Injectable()
export class IncidentNotificationService {
  private readonly logger = new Logger(IncidentNotificationService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly notificationService: NotificationService,
  ) {}

  async notifySupervisorIfNeeded(
    incident: Incident,
    incidentBus: IncidentBus,
  ): Promise<void> {
    if (
      ![IncidentSeverity.HIGH, IncidentSeverity.CRITICAL].includes(
        incident.severity,
      )
    ) {
      return;
    }

    const supervisorEmail =
      incident.enterprise.supervisorEmail ??
      this.configService.get<string>('INCIDENT_SUPERVISOR_EMAIL');

    if (!supervisorEmail) {
      this.logger.warn(
        `Incident ${incident.id} requires supervisor notification, but no email configured`,
      );
      return;
    }

    const bus = incidentBus.bus;
    const emailBody = [
      `Se reporto un incidente de gravedad ${incident.severity}.`,
      `Tipo: ${incident.type}`,
      `Bus: ${bus.plate}`,
      `Descripcion: ${incident.description}`,
      `Ubicacion: ${incident.latitude ?? 'N/A'}, ${incident.longitude ?? 'N/A'}`,
      `Fecha: ${incident.reportedAt.toISOString()}`,
    ].join('\n');

    const success = await this.notificationService.sendEmail({
      to: supervisorEmail,
      subject: `Incidente ${incident.severity} reportado`,
      body: emailBody,
    });

    if (!success) {
      this.logger.warn(
        `Failed to notify supervisor for incident ${incident.id}`,
      );
    }
  }
}
