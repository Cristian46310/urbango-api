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
import { Driver } from '@/driver/entities/driver.entity';
import { Enterprise } from '@/enterprise/entities/enterprise.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Incident,
      IncidentBus,
      IncidentPhoto,
      Gps,
      Bus,
      Turn,
      Driver,
      Enterprise,
    ]),
  ],
  controllers: [IncidentController],
  providers: [IncidentService],
})
export class IncidentModule {}