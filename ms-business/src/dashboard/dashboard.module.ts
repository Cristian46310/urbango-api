import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from '@/ticket/entities/ticket.entity';
import { Incident } from '@/incident/entities/incident.entity';
import { Enterprise } from '@/enterprise/entities/enterprise.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardPeriodService } from './services/dashboard-period.service';
import { DashboardExportService } from './services/dashboard-export.service';
import { PaymentMethodIncomeService } from './services/payment-method-income.service';
import { IncidentTrendByTypeService } from './services/incident-trend-by-type.service';
import { PassengerAgeDistributionService } from './services/passenger-age-distribution.service';
import { DashboardRealtimeService } from './services/dashboard-realtime.service';
import { BusModule } from '@/bus/bus.module';
import { TicketModule } from '@/ticket/ticket.module';
import { IncidentModule } from '@/incident/incident.module';
import { StopModule } from '@/stop/stop.module';
import { NotificationsModule } from '@/notifications/notifications.module';
import { NotificationSubscription } from './entities/notification-subscription.entity';
import { DashboardRealtimeGateway } from './services/dashboard-realtime.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Ticket,
      Incident,
      Enterprise,
      NotificationSubscription,
    ]),
    BusModule,
    TicketModule,
    IncidentModule,
    StopModule,
    NotificationsModule,
  ],
  controllers: [DashboardController],
  providers: [
    DashboardPeriodService,
    DashboardExportService,
    PaymentMethodIncomeService,
    IncidentTrendByTypeService,
    PassengerAgeDistributionService,
    DashboardRealtimeService,
    DashboardRealtimeGateway,
  ],
})
export class DashboardModule {}
