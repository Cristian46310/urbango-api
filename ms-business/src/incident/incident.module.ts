import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncidentController } from './incident.controller';
import { IncidentService } from './incident.service';
import { Incident } from './entities/incident.entity';
import { IncidentBus } from './entities/incident-bus.entity';
import { IncidentPhoto } from './entities/incident-photo.entity';
import { Gps } from './entities/gps.entity';
import { Bus } from '@/bus/entities/bus.entity';
import { Turn } from '@/turn/entities/turn.entity';
import { Enterprise } from '@/enterprise/entities/enterprise.entity';
import { IncidentStorageService } from './incident-storage.service';
import { IncidentNotificationService } from './incident-notification.service';
import { NotificationService } from './services/notification.service';
import { Driver } from '@/driver/entities/driver.entity';
import { AuthModule } from '@/auth/auth.module';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      Incident,
      IncidentBus,
      IncidentPhoto,
      Gps,
      Bus,
      Turn,
      Enterprise,
      Driver,
    ]),
  ],
  controllers: [IncidentController],
  providers: [
    IncidentService,
    IncidentStorageService,
    IncidentNotificationService,
    NotificationService,
  ],
})
export class IncidentModule {}
