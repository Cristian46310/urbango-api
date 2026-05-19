import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { IncidentNotificationService } from './incident-notification.service';
import { NotificationService } from './services/notification.service';
import { IncidentSeverity } from './enums/incident.enum';
import { Incident } from './entities/incident.entity';
import { IncidentBus } from './entities/incident-bus.entity';

describe('IncidentNotificationService', () => {
  let service: IncidentNotificationService;
  const mockNotification = { sendEmail: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncidentNotificationService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(undefined) },
        },
        { provide: NotificationService, useValue: mockNotification },
      ],
    }).compile();

    service = module.get(IncidentNotificationService);
  });

  it('skips notification for low severity', async () => {
    await service.notifySupervisorIfNeeded(
      { severity: IncidentSeverity.LOW } as Incident,
      {} as IncidentBus,
    );
    expect(mockNotification.sendEmail).not.toHaveBeenCalled();
  });
});
