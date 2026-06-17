import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { SecurityModule } from '@/auth/security.module';
import { AuthModule } from '@/auth/auth.module';
import { SharedModule } from '@/shared/shared.module';
import { UsersModule } from '@/users/users.module';
import { ConversationsModule } from '@/conversations/conversations.module';
import { MessagesModule } from '@/messages/messages.module';
import { InboxModule } from '@/inbox/inbox.module';
import { RealtimeModule } from '@/realtime/realtime.module';
import { CitizenModule } from '@/citizen/citizen.module';
import { DriverModule } from '@/driver/driver.module';
import { GroupsModule } from '@/groups/groups.module';
import { MassAlertsModule } from '@/mass-alerts/mass-alerts.module';

@Module({
  imports: [
    DiscoveryModule,
    ConfigModule.forRoot({ isGlobal: true }),
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
    SharedModule,
    UsersModule,
    ConversationsModule,
    MessagesModule,
    InboxModule,
    RealtimeModule,
    CitizenModule,
    DriverModule,
    GroupsModule,
    MassAlertsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
