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

@Module({
  imports: [TypeOrmModule.forFeature([Ticket, Incident, Enterprise])],
  controllers: [DashboardController],
  providers: [
    DashboardPeriodService,
    DashboardExportService,
    PaymentMethodIncomeService,
    IncidentTrendByTypeService,
    PassengerAgeDistributionService,
  ],
})
export class DashboardModule {}
