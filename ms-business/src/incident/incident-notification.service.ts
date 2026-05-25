import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    @InjectRepository(IncidentBus)
    private readonly incidentBusRepository: Repository<IncidentBus>,
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

    const loaded = await this.incidentBusRepository.findOne({
      where: { id: incidentBus.id },
      relations: ['bus', 'bus.enterprise', 'bus.enterprise.supervisors'],
    });

    const bus = loaded?.bus ?? incidentBus.bus;
    const supervisors = bus?.enterprise?.supervisors ?? [];
    const supervisorEmails = supervisors
      .map((s) => s.email)
      .filter((email): email is string => Boolean(email?.trim()));

    const fallbackEmail = this.configService.get<string>(
      'INCIDENT_SUPERVISOR_EMAIL',
    );

    const recipients =
      supervisorEmails.length > 0
        ? supervisorEmails
        : fallbackEmail
          ? [fallbackEmail]
          : [];

    if (recipients.length === 0) {
      this.logger.warn(
        `Incident ${incident.id} requires supervisor notification, but no email configured`,
      );
      return;
    }

    const emailBody = [
      `Se reporto un incidente de gravedad ${incident.severity}.`,
      `Tipo: ${incident.type}`,
      `Bus: ${bus?.plate ?? 'N/A'}`,
      `Descripcion: ${incident.description}`,
      `Ubicacion: ${incident.latitude ?? 'N/A'}, ${incident.longitude ?? 'N/A'}`,
      `Fecha: ${incident.createdAt.toISOString()}`,
    ].join('\n');

    for (const to of recipients) {
      const success = await this.notificationService.sendEmail({
        to,
        subject: `Incidente ${incident.severity} reportado`,
        body: emailBody,
      });

      if (!success) {
        this.logger.warn(
          `Failed to notify supervisor ${to} for incident ${incident.id}`,
        );
      }
    }
  }
}
