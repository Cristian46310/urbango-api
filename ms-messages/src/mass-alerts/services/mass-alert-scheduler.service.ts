import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { MassAlertsService } from '../mass-alerts.service';

const SCHEDULER_INTERVAL_MS = 30_000;

@Injectable()
export class MassAlertSchedulerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(MassAlertSchedulerService.name);
  private timer?: NodeJS.Timeout;

  constructor(private readonly massAlertsService: MassAlertsService) {}

  onModuleInit(): void {
    this.timer = setInterval(() => {
      void this.processDueAlerts();
    }, SCHEDULER_INTERVAL_MS);
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private async processDueAlerts(): Promise<void> {
    try {
      const processed =
        await this.massAlertsService.processDueScheduledAlerts();
      if (processed > 0) {
        this.logger.log(`Delivered ${processed} scheduled mass alert(s)`);
      }
    } catch (error) {
      this.logger.error(
        `Scheduled mass alert delivery failed: ${String(error)}`,
      );
    }
  }
}
