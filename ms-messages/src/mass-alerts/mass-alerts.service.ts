import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { IsNull, Not, Repository } from 'typeorm';
import { MassAlert } from './entities/mass-alert.entity';
import { MassAlertRecipient } from './entities/mass-alert-recipient.entity';
import { MassAlertRoute } from './entities/mass-alert-route.entity';
import { MassAlertZone } from './entities/mass-alert-zone.entity';
import { MassAlertScope } from './enums/mass-alert-scope.enum';
import { MassAlertStatus } from './enums/mass-alert-status.enum';
import { PreviewMassAlertRecipientsDto } from './dto/create-mass-alert.dto';
import { CreateMassAlertDto } from './dto/create-mass-alert.dto';
import {
  ResponseMassAlertDto,
  ResponseMassAlertListDto,
  ResponseMassAlertRecipientCountDto,
  ResponseMassAlertStatsDto,
} from './dto/response-mass-alert.dto';
import {
  ResponseUserAlertDto,
  ResponseUserAlertListDto,
} from './dto/response-user-alert.dto';
import { MassAlertRecipientResolverService } from './services/mass-alert-recipient-resolver.service';
import { RealtimeEmitterService } from '@/realtime/services/realtime-emitter.service';
import { SecurityUserClientService } from '@/users/services/security-user-client.service';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import { AlertsQueryDto } from './dto/alerts-query.dto';
import { PaginationMetaDto } from '@/shared/dto/pagination-meta.dto';

const RECIPIENT_INSERT_CHUNK = 500;

@Injectable()
export class MassAlertsService {
  constructor(
    @InjectRepository(MassAlert)
    private readonly massAlertRepository: Repository<MassAlert>,
    @InjectRepository(MassAlertRecipient)
    private readonly recipientRepository: Repository<MassAlertRecipient>,
    @InjectRepository(MassAlertRoute)
    private readonly massAlertRouteRepository: Repository<MassAlertRoute>,
    @InjectRepository(MassAlertZone)
    private readonly massAlertZoneRepository: Repository<MassAlertZone>,
    private readonly recipientResolver: MassAlertRecipientResolverService,
    private readonly realtimeEmitter: RealtimeEmitterService,
    private readonly securityUserClient: SecurityUserClientService,
  ) {}

  async previewRecipients(
    dto: PreviewMassAlertRecipientsDto,
    token: string,
  ): Promise<ResponseMassAlertRecipientCountDto> {
    const recipientUserIds =
      await this.recipientResolver.resolveRecipientUserIds({
        scope: dto.scope,
        routeIds: dto.routeIds,
        zoneNames: dto.zoneNames,
        token,
      });

    return plainToInstance(
      ResponseMassAlertRecipientCountDto,
      {
        count: recipientUserIds.length,
        scope: dto.scope,
        routeIds: dto.routeIds,
        zoneNames: dto.zoneNames,
      },
      { excludeExtraneousValues: true },
    );
  }

  async createAlert(
    senderId: string,
    dto: CreateMassAlertDto,
    token: string,
  ): Promise<ResponseMassAlertDto> {
    const scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : null;
    const sendImmediately = !scheduledAt || scheduledAt.getTime() <= Date.now();

    // Scheduled alerts only store the scope/criteria; recipients are
    // resolved again at send time so the audience reflects reality then.
    let recipientUserIds: string[] = [];
    if (sendImmediately) {
      recipientUserIds = await this.recipientResolver.resolveRecipientUserIds({
        scope: dto.scope,
        routeIds: dto.routeIds,
        zoneNames: dto.zoneNames,
        token,
      });

      if (recipientUserIds.length === 0) {
        throw new BadRequestException(
          'No se encontraron destinatarios para el alcance seleccionado.',
        );
      }
    }

    const alert = this.massAlertRepository.create({
      senderId,
      title: dto.title,
      body: dto.body,
      scope: dto.scope,
      isUrgent: dto.isUrgent ?? false,
      scheduledAt: sendImmediately ? null : scheduledAt,
      status: MassAlertStatus.SCHEDULED,
      recipientCount: recipientUserIds.length,
    });

    const savedAlert = await this.massAlertRepository.save(alert);
    await this.saveScopeTargets(savedAlert.id, dto);

    if (sendImmediately) {
      const sentAt = new Date();
      await this.insertRecipients(savedAlert.id, recipientUserIds, sentAt);
      await this.emitAlertToRecipients(savedAlert, recipientUserIds);
      savedAlert.status = MassAlertStatus.SENT;
      savedAlert.sentAt = sentAt;
      await this.massAlertRepository.save(savedAlert);
    }

    return this.toAlertDto(await this.findAlertWithScopeTargets(savedAlert.id));
  }

  private async findAlertWithScopeTargets(alertId: string): Promise<MassAlert> {
    return this.massAlertRepository.findOneOrFail({
      where: { id: alertId },
      relations: ['routes', 'zones'],
    });
  }

  private async saveScopeTargets(
    alertId: string,
    dto: Pick<CreateMassAlertDto, 'scope' | 'routeIds' | 'zoneNames'>,
  ): Promise<void> {
    if (dto.scope === MassAlertScope.ROUTE && dto.routeIds?.length) {
      const uniqueRouteIds = [...new Set(dto.routeIds)];
      await this.massAlertRouteRepository.save(
        uniqueRouteIds.map((routeId) =>
          this.massAlertRouteRepository.create({
            massAlertId: alertId,
            routeId,
          }),
        ),
      );
    }

    if (dto.scope === MassAlertScope.ZONE && dto.zoneNames?.length) {
      const uniqueZoneNames = [
        ...new Set(dto.zoneNames.map((zone) => zone.trim()).filter(Boolean)),
      ];
      await this.massAlertZoneRepository.save(
        uniqueZoneNames.map((zoneName) =>
          this.massAlertZoneRepository.create({
            massAlertId: alertId,
            zoneName,
          }),
        ),
      );
    }
  }

  async processDueScheduledAlerts(): Promise<number> {
    const dueAlerts = await this.massAlertRepository
      .createQueryBuilder('alert')
      .leftJoinAndSelect('alert.routes', 'routes')
      .leftJoinAndSelect('alert.zones', 'zones')
      .where('alert.status = :status', { status: MassAlertStatus.SCHEDULED })
      .andWhere('alert.scheduledAt IS NOT NULL')
      .andWhere('alert.scheduledAt <= :now', { now: new Date() })
      .getMany();

    let processed = 0;

    for (const alert of dueAlerts) {
      const recipientUserIds =
        await this.recipientResolver.resolveRecipientUserIds({
          scope: alert.scope,
          routeIds: alert.routes?.map((route) => route.routeId),
          zoneNames: alert.zones?.map((zone) => zone.zoneName),
          token: '',
        });

      if (recipientUserIds.length === 0) {
        alert.status = MassAlertStatus.CANCELLED;
        await this.massAlertRepository.save(alert);
        continue;
      }

      const sentAt = new Date();
      await this.insertRecipients(alert.id, recipientUserIds, sentAt);
      await this.emitAlertToRecipients(alert, recipientUserIds);

      alert.recipientCount = recipientUserIds.length;
      alert.status = MassAlertStatus.SENT;
      alert.sentAt = sentAt;
      await this.massAlertRepository.save(alert);
      processed += 1;
    }

    return processed;
  }

  async emitAlertToRecipients(
    alert: MassAlert,
    recipientUserIds: string[],
  ): Promise<void> {
    const uniqueUserIds = [...new Set(recipientUserIds.filter(Boolean))];

    const senderName = await this.securityUserClient
      .getUserById(alert.senderId)
      .then((user) => user.name)
      .catch(() => undefined);

    for (const userId of uniqueUserIds) {
      const payload = this.toUserAlertDto(alert, userId, {
        senderName,
        isRead: false,
      });

      if (alert.isUrgent) {
        this.realtimeEmitter.emitUrgentAlertPush(userId, payload);
      } else {
        this.realtimeEmitter.emitNewAlert(userId, payload);
      }
    }
  }

  async getAlertById(alertId: string): Promise<ResponseMassAlertDto> {
    const alert = await this.findAlertWithScopeTargets(alertId);
    return this.toAlertDto(alert);
  }

  async listAdminAlerts(
    pagination: PaginationQueryDto,
  ): Promise<ResponseMassAlertListDto> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const skip = (page - 1) * limit;

    const [alerts, totalItems] = await this.massAlertRepository.findAndCount({
      order: { createdAt: 'DESC' },
      relations: ['routes', 'zones'],
      skip,
      take: limit,
    });

    return {
      items: alerts.map((alert) => this.toAlertDto(alert)),
      meta: this.buildMeta(page, limit, totalItems),
    };
  }

  async getAlertStats(alertId: string): Promise<ResponseMassAlertStatsDto> {
    const alert = await this.massAlertRepository.findOne({
      where: { id: alertId },
    });

    if (!alert) {
      throw new NotFoundException(`Alert ${alertId} not found`);
    }

    const totalRecipients = alert.recipientCount;
    const readCount = await this.recipientRepository.count({
      where: { massAlertId: alertId, readAt: Not(IsNull()) },
    });
    const deliveredCount = await this.recipientRepository.count({
      where: { massAlertId: alertId },
    });
    const unreadCount = totalRecipients - readCount;

    return plainToInstance(
      ResponseMassAlertStatsDto,
      {
        alertId,
        totalRecipients,
        deliveredCount,
        readCount,
        unreadCount,
        readPercentage:
          totalRecipients === 0
            ? 0
            : Math.round((readCount / totalRecipients) * 100),
      },
      { excludeExtraneousValues: true },
    );
  }

  async listUserAlerts(
    userId: string,
    query: AlertsQueryDto,
  ): Promise<ResponseUserAlertListDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const qb = this.recipientRepository
      .createQueryBuilder('recipient')
      .innerJoinAndSelect('recipient.massAlert', 'alert')
      .where('recipient.userId = :userId', { userId })
      .andWhere('alert.status = :status', { status: MassAlertStatus.SENT })
      .orderBy('alert.sentAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (query.unreadOnly) {
      qb.andWhere('recipient.readAt IS NULL');
    }

    const [recipients, totalItems] = await qb.getManyAndCount();

    const senderIds = [
      ...new Set(
        recipients
          .map((recipient) => recipient.massAlert?.senderId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const senderNames = await this.resolveSenderNames(senderIds);

    const items = recipients.map((recipient) => {
      const alert = recipient.massAlert!;
      return this.toUserAlertDto(alert, userId, {
        senderName: senderNames.get(alert.senderId),
        isRead: Boolean(recipient.readAt),
        readAt: recipient.readAt ?? undefined,
      });
    });

    return {
      items,
      meta: this.buildMeta(page, limit, totalItems),
    };
  }

  async countUnreadUserAlerts(userId: string): Promise<number> {
    return this.recipientRepository
      .createQueryBuilder('recipient')
      .innerJoin('recipient.massAlert', 'alert')
      .where('recipient.userId = :userId', { userId })
      .andWhere('recipient.readAt IS NULL')
      .andWhere('alert.status = :status', { status: MassAlertStatus.SENT })
      .getCount();
  }

  async markUserAlertAsRead(
    alertId: string,
    userId: string,
  ): Promise<ResponseUserAlertDto> {
    const recipient = await this.recipientRepository.findOne({
      where: { massAlertId: alertId, userId },
      relations: ['massAlert'],
    });

    if (!recipient?.massAlert) {
      throw new NotFoundException('Alerta no encontrada para este usuario');
    }

    if (!recipient.readAt) {
      recipient.readAt = new Date();
      await this.recipientRepository.save(recipient);
    }

    const senderName = await this.securityUserClient
      .getUserById(recipient.massAlert.senderId)
      .then((user) => user.name)
      .catch(() => undefined);

    return this.toUserAlertDto(recipient.massAlert, userId, {
      senderName,
      isRead: true,
      readAt: recipient.readAt,
    });
  }

  async getUserAlertById(
    alertId: string,
    userId: string,
  ): Promise<ResponseUserAlertDto> {
    const recipient = await this.recipientRepository.findOne({
      where: { massAlertId: alertId, userId },
      relations: ['massAlert'],
    });

    if (!recipient?.massAlert) {
      throw new NotFoundException('Alerta no encontrada para este usuario');
    }

    const senderName = await this.securityUserClient
      .getUserById(recipient.massAlert.senderId)
      .then((user) => user.name)
      .catch(() => undefined);

    return this.toUserAlertDto(recipient.massAlert, userId, {
      senderName,
      isRead: Boolean(recipient.readAt),
      readAt: recipient.readAt ?? undefined,
    });
  }

  private async insertRecipients(
    alertId: string,
    userIds: string[],
    deliveredAt: Date,
  ): Promise<void> {
    for (
      let index = 0;
      index < userIds.length;
      index += RECIPIENT_INSERT_CHUNK
    ) {
      const chunk = userIds.slice(index, index + RECIPIENT_INSERT_CHUNK);
      const rows = chunk.map((userId) =>
        this.recipientRepository.create({
          massAlertId: alertId,
          userId,
          deliveredAt,
        }),
      );
      await this.recipientRepository.save(rows);
    }
  }

  private async resolveSenderNames(
    senderIds: string[],
  ): Promise<Map<string, string>> {
    const entries = await Promise.all(
      senderIds.map(async (senderId) => {
        try {
          const user = await this.securityUserClient.getUserById(senderId);
          return [senderId, user.name] as const;
        } catch {
          return [senderId, undefined] as const;
        }
      }),
    );

    return new Map(
      entries.filter((entry): entry is [string, string] => Boolean(entry[1])),
    );
  }

  private toAlertDto(alert: MassAlert): ResponseMassAlertDto {
    return plainToInstance(
      ResponseMassAlertDto,
      {
        id: alert.id,
        senderId: alert.senderId,
        title: alert.title,
        body: alert.body,
        scope: alert.scope,
        routeIds: this.extractRouteIds(alert),
        zoneNames: this.extractZoneNames(alert),
        isUrgent: alert.isUrgent,
        scheduledAt: alert.scheduledAt ?? undefined,
        status: alert.status,
        recipientCount: alert.recipientCount,
        createdAt: alert.createdAt,
        sentAt: alert.sentAt ?? undefined,
      },
      { excludeExtraneousValues: true },
    );
  }

  private extractRouteIds(alert: MassAlert): string[] | undefined {
    const routeIds = alert.routes?.map((route) => route.routeId) ?? [];
    return routeIds.length > 0 ? routeIds : undefined;
  }

  private extractZoneNames(alert: MassAlert): string[] | undefined {
    const zoneNames = alert.zones?.map((zone) => zone.zoneName) ?? [];
    return zoneNames.length > 0 ? zoneNames : undefined;
  }

  private toUserAlertDto(
    alert: MassAlert,
    _userId: string,
    options: {
      senderName?: string;
      isRead: boolean;
      readAt?: Date;
    },
  ): ResponseUserAlertDto {
    return plainToInstance(
      ResponseUserAlertDto,
      {
        id: alert.id,
        title: alert.title,
        body: alert.body,
        isUrgent: alert.isUrgent,
        scope: alert.scope,
        senderId: alert.senderId,
        senderName: options.senderName,
        sentAt: alert.sentAt ?? alert.createdAt,
        isRead: options.isRead,
        readAt: options.readAt,
        canReply: false,
      },
      { excludeExtraneousValues: true },
    );
  }

  private buildMeta(
    page: number,
    limit: number,
    totalItems: number,
  ): PaginationMetaDto {
    const totalPages = Math.ceil(totalItems / limit) || 0;
    return plainToInstance(PaginationMetaDto, {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    });
  }
}
