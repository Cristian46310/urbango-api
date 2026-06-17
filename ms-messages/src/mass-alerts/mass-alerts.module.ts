import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MassAlertsController } from './mass-alerts.controller';
import { UserAlertsController } from './user-alerts.controller';
import { MassAlertsService } from './mass-alerts.service';
import { MassAlert } from './entities/mass-alert.entity';
import { MassAlertRecipient } from './entities/mass-alert-recipient.entity';
import { MassAlertRecipientResolverService } from './services/mass-alert-recipient-resolver.service';
import { MassAlertSchedulerService } from './services/mass-alert-scheduler.service';
import { UsersModule } from '@/users/users.module';
import { RealtimeModule } from '@/realtime/realtime.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MassAlert, MassAlertRecipient]),
    UsersModule,
    RealtimeModule,
  ],
  controllers: [MassAlertsController, UserAlertsController],
  providers: [
    MassAlertsService,
    MassAlertRecipientResolverService,
    MassAlertSchedulerService,
  ],
  exports: [MassAlertsService],
})
export class MassAlertsModule {}
