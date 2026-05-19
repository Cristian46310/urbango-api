import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
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
import { TurnModule } from './turn/turn.module';
import { IncidentModule } from './incident/incident.module';
import { CardRechargeModule } from './card-recharge/card-recharge.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    DiscoveryModule,
    ConfigModule.forRoot({ isGlobal: true }),
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
    TurnModule,
    IncidentModule,
    CardRechargeModule,
    SharedModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
