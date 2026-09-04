import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { SecurityModule } from './auth/security.module';
import { AuthModule } from './auth/auth.module';
import { RouteModule } from './route/route.module';
import { StopModule } from './stop/stop.module';
import { NodeModule } from './node/node.module';
import { AddressModule } from './address/address.module';
import { CitizenModule } from './citizen/citizen.module';
import { TicketModule } from './ticket/ticket.module';
import { HistoryModule } from './history/history.module';
import { BusModule } from './bus/bus.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { PaymentMethodModule } from './payment-method/payment-method.module';
import { PaymentMethodCitizenModule } from './payment-method-citizen/payment-method-citizen.module';
import { EnterpriseModule } from './enterprise/enterprise.module';
import { DriverModule } from './driver/driver.module';
import { SupervisorModule } from './supervisor/supervisor.module';
import { TurnModule } from './turn/turn.module';
import { BoardingModule } from './boarding/boarding.module';
import { IncidentModule } from './incident/incident.module';
import { CardRechargeModule } from './card-recharge/card-recharge.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { IncidentCommentModule } from './incident-comment/incident-comment.module';
import { GpsModule } from './gps/gps.module';
import { BusPhotoModule } from './bus-photo/bus-photo.module';
import { IncidentPhotoModule } from './incident-photo/incident-photo.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    DiscoveryModule,
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    HttpModule,
    SecurityModule,
    AuthModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DB_URL'),
        autoLoadEntities: true,
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,
      }),
    }),
    NotificationsModule,
    RouteModule,
    StopModule,
    NodeModule,
    AddressModule,
    CitizenModule,
    TicketModule,
    HistoryModule,
    BusModule,
    SchedulerModule,
    PaymentMethodModule,
    PaymentMethodCitizenModule,
    EnterpriseModule,
    DriverModule,
    SupervisorModule,
    TurnModule,
    BoardingModule,
    GpsModule,
    BusPhotoModule,
    IncidentModule,
    IncidentPhotoModule,
    IncidentCommentModule,
    CardRechargeModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
