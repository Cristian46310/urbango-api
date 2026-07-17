import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

/** Claves de perfil → nombre de rol en ms-security. */
export const SecurityProfileRole = {
  CITIZEN: 'citizen',
  DRIVER: 'driver',
  SUPERVISOR: 'supervisor',
} as const;

export type SecurityProfileRole =
  (typeof SecurityProfileRole)[keyof typeof SecurityProfileRole];

const ROLE_NAME_BY_PROFILE: Record<SecurityProfileRole, string> = {
  [SecurityProfileRole.CITIZEN]: 'CITIZEN',
  [SecurityProfileRole.DRIVER]: 'DRIVER',
  [SecurityProfileRole.SUPERVISOR]: 'SUPERVISOR',
};

@Injectable()
export class SecurityRoleClientService {
  private readonly logger = new Logger(SecurityRoleClientService.name);
  private readonly securityServiceUrl: string;
  private readonly internalKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.securityServiceUrl =
      this.configService.get<string>('MS_SECURITY_URL') ??
      'http://localhost:8080';
    this.internalKey =
      this.configService.get<string>('MS_SECURITY_INTERNAL_KEY')?.trim() ?? '';
  }

  /**
   * Agrega un rol al usuario por nombre (endpoint interno ms-security).
   * Idempotente: si el user ya nació con CITIZEN, no falla.
   */
  async assignProfileRole(
    userId: string,
    profileRole: SecurityProfileRole,
  ): Promise<void> {
    const roleName = ROLE_NAME_BY_PROFILE[profileRole];
    try {
      await this.assignRoleByNameQuiet(userId, roleName);
    } catch (error) {
      this.logger.error(
        `Failed to assign role ${roleName} (${profileRole}) to user ${userId}: ${String(error)}`,
      );
      throw new BadGatewayException(
        `No se pudo asignar el rol del perfil (${profileRole}). El perfil se creó; vuelve a intentar o contacta al administrador.`,
      );
    }
  }

  /** Used by outbox worker — throws raw errors for retry handling. */
  async assignRoleByNameQuiet(userId: string, roleName: string): Promise<void> {
    if (!this.internalKey) {
      throw new BadGatewayException(
        'Falta configurar MS_SECURITY_INTERNAL_KEY en el entorno de ms-business.',
      );
    }

    await firstValueFrom(
      this.httpService.post(
        `${this.securityServiceUrl}/api/internal/user-role/user/${userId}/role-name/${roleName}`,
        null,
        {
          timeout: 30000,
          headers: { 'X-Internal-Key': this.internalKey },
        },
      ),
    );
  }
}
