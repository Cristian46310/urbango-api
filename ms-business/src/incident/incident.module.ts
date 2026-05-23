import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncidentController } from './incident.controller';
import { IncidentService } from './incident.service';
import { Incident } from './entities/incident.entity';
import { IncidentBus } from './entities/incident-bus.entity';
import { Bus } from '@/bus/entities/bus.entity';
import { Turn } from '@/turn/entities/turn.entity';
import { IncidentNotificationService } from './incident-notification.service';
import { NotificationService } from './services/notification.service';
import { Driver } from '@/driver/entities/driver.entity';
import { AuthModule } from '@/auth/auth.module';
import { IncidentPhotoModule } from '@/incident-photo/incident-photo.module';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      Incident,
      IncidentBus,
      Bus,
      Turn,
      Driver,
    ]),
    IncidentPhotoModule,
  ],
  controllers: [IncidentController],
  providers: [IncidentService, IncidentNotificationService, NotificationService],
  exports: [IncidentService, TypeOrmModule],
})
export class IncidentModule {}
