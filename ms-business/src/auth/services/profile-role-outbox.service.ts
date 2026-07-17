import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, LessThanOrEqual, Repository } from 'typeorm';
import {
  SecurityProfileRole,
  SecurityRoleClientService,
} from './security-role-client.service';
import {
  ProfileRoleOutbox,
  ProfileRoleOutboxStatus,
} from '../entities/profile-role-outbox.entity';

const ROLE_NAME_BY_PROFILE: Record<SecurityProfileRole, string> = {
  [SecurityProfileRole.CITIZEN]: 'CITIZEN',
  [SecurityProfileRole.DRIVER]: 'DRIVER',
  [SecurityProfileRole.SUPERVISOR]: 'SUPERVISOR',
};

const MAX_ATTEMPTS = 8;
const POLL_INTERVAL_MS = 30_000;
const BATCH_SIZE = 50;

@Injectable()
export class ProfileRoleOutboxService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ProfileRoleOutboxService.name);
  private timer?: NodeJS.Timeout;
  private processing = false;

  constructor(
    @InjectRepository(ProfileRoleOutbox)
    private readonly outboxRepository: Repository<ProfileRoleOutbox>,
    private readonly securityRoleClient: SecurityRoleClientService,
  ) {}

  onModuleInit(): void {
    this.timer = setInterval(() => {
      void this.processPending();
    }, POLL_INTERVAL_MS);
    // Best-effort catch-up shortly after boot
    setTimeout(() => void this.processPending(), 5_000);
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  async enqueue(
    manager: EntityManager,
    params: {
      userId: string;
      profileId: string;
      profileType: 'citizen' | 'supervisor';
      role: SecurityProfileRole;
    },
  ): Promise<ProfileRoleOutbox> {
    const repo = manager.getRepository(ProfileRoleOutbox);
    const row = repo.create({
      userId: params.userId,
      profileId: params.profileId,
      profileType: params.profileType,
      roleName: ROLE_NAME_BY_PROFILE[params.role],
      status: ProfileRoleOutboxStatus.PENDING,
      attempts: 0,
      nextRetryAt: new Date(),
    });
    return repo.save(row);
  }

  /** Immediate attempt after create; failures stay pending for the poller. */
  async tryProcessSoon(outboxId: string): Promise<void> {
    const row = await this.outboxRepository.findOne({ where: { id: outboxId } });
    if (!row || row.status !== ProfileRoleOutboxStatus.PENDING) {
      return;
    }
    await this.processOne(row);
  }

  async processPending(): Promise<void> {
    if (this.processing) {
      return;
    }
    this.processing = true;
    try {
      const now = new Date();
      const pending = await this.outboxRepository.find({
        where: {
          status: ProfileRoleOutboxStatus.PENDING,
          nextRetryAt: LessThanOrEqual(now),
        },
        order: { createdAt: 'ASC' },
        take: BATCH_SIZE,
      });
      for (const row of pending) {
        await this.processOne(row);
      }
    } catch (error) {
      this.logger.error(`Outbox poll failed: ${String(error)}`);
    } finally {
      this.processing = false;
    }
  }

  private async processOne(row: ProfileRoleOutbox): Promise<void> {
    try {
      await this.securityRoleClient.assignRoleByNameQuiet(
        row.userId,
        row.roleName,
      );
      row.status = ProfileRoleOutboxStatus.DONE;
      row.processedAt = new Date();
      row.lastError = null;
      row.nextRetryAt = null;
      await this.outboxRepository.save(row);
      this.logger.log(
        `Assigned role ${row.roleName} to user ${row.userId} (outbox ${row.id})`,
      );
    } catch (error) {
      row.attempts += 1;
      row.lastError = error instanceof Error ? error.message : String(error);
      if (row.attempts >= MAX_ATTEMPTS) {
        row.status = ProfileRoleOutboxStatus.FAILED;
        row.nextRetryAt = null;
        this.logger.error(
          `Outbox ${row.id} exhausted retries for user ${row.userId}: ${row.lastError}`,
        );
      } else {
        const delayMs = Math.min(60_000 * 2 ** (row.attempts - 1), 30 * 60_000);
        row.nextRetryAt = new Date(Date.now() + delayMs);
        this.logger.warn(
          `Outbox ${row.id} retry ${row.attempts}/${MAX_ATTEMPTS} in ${delayMs}ms: ${row.lastError}`,
        );
      }
      await this.outboxRepository.save(row);
    }
  }
}
