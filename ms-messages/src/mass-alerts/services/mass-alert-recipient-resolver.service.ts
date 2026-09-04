import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { MassAlertScope } from '../enums/mass-alert-scope.enum';
import { SecurityUserClientService } from '@/users/services/security-user-client.service';

export interface ResolveRecipientsInput {
  scope: MassAlertScope;
  routeIds?: string[];
  zoneNames?: string[];
  /** @deprecated Unused; internal users API uses MS_SECURITY_INTERNAL_KEY */
  token?: string;
}

@Injectable()
export class MassAlertRecipientResolverService {
  private readonly logger = new Logger(MassAlertRecipientResolverService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly securityUserClient: SecurityUserClientService,
  ) {}

  async resolveRecipientUserIds(
    input: ResolveRecipientsInput,
  ): Promise<string[]> {
    switch (input.scope) {
      case MassAlertScope.ALL:
        return this.resolveAllUsers();
      case MassAlertScope.ROUTE:
        return this.resolveByRoutes(input.routeIds ?? []);
      case MassAlertScope.ZONE:
        return this.resolveByZones(input.zoneNames ?? []);
      default:
        return [];
    }
  }

  private async resolveAllUsers(): Promise<string[]> {
    return this.securityUserClient.getAllUserIds();
  }

  private async resolveByRoutes(routeIds: string[]): Promise<string[]> {
    if (routeIds.length === 0) {
      return [];
    }

    const userIds = new Set<string>();

    try {
      const ticketRows = await this.dataSource.query<
        Array<{ user_id: string }>
      >(
        `
        SELECT DISTINCT p.user_id
        FROM persons p
        INNER JOIN tickets t ON t.citizen_id = p.id
        INNER JOIN schedulers s ON s.id = t.scheduler_id
        WHERE p.type = 'citizen'
          AND t.status = 'active'
          AND s.route_id = ANY($1::uuid[])
        `,
        [routeIds],
      );

      ticketRows.forEach((row) => userIds.add(row.user_id));
    } catch (error) {
      this.logger.warn(
        `Ticket-based route resolution unavailable: ${String(error)}`,
      );
    }

    try {
      const subscriptionRows = await this.dataSource.query<
        Array<{ user_id: string }>
      >(
        `
        SELECT DISTINCT p.user_id
        FROM notification_subscriptions ns
        INNER JOIN persons p ON LOWER(p.email) = LOWER(ns.email)
        WHERE ns."routeId" = ANY($1::text[])
           OR ns.route_id::text = ANY($1::text[])
        `,
        [routeIds],
      );

      subscriptionRows.forEach((row) => userIds.add(row.user_id));
    } catch {
      this.logger.debug(
        'notification_subscriptions table not available for route scope',
      );
    }

    return [...userIds].filter((id) => id?.trim());
  }

  private async resolveByZones(zoneNames: string[]): Promise<string[]> {
    if (zoneNames.length === 0) {
      return [];
    }

    const normalizedZones = zoneNames.map((zone) => zone.trim().toLowerCase());

    try {
      const rows = await this.dataSource.query<Array<{ user_id: string }>>(
        `
        SELECT DISTINCT p.user_id
        FROM persons p
        INNER JOIN addresses a ON a.id = p.address_id
        WHERE p.type = 'citizen'
          AND LOWER(a.city) = ANY($1::text[])
        `,
        [normalizedZones],
      );

      return this.uniqueUserIds(rows.map((row) => row.user_id));
    } catch (error) {
      this.logger.warn(
        `Zone recipient resolution fallback (tables may be unavailable): ${String(error)}`,
      );
      return [];
    }
  }

  private uniqueUserIds(userIds: string[]): string[] {
    return [...new Set(userIds.filter((id) => id?.trim()))];
  }
}
