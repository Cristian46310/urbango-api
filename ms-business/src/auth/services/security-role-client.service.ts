import {
  BadGatewayException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/** Claves de perfil → rol en ms-security (MongoDB ObjectId vía env). */
export const SecurityProfileRole = {
  CITIZEN: 'citizen',
  DRIVER: 'driver',
} as const;

export type SecurityProfileRole =
  (typeof SecurityProfileRole)[keyof typeof SecurityProfileRole];

@Injectable()
export class SecurityRoleClientService {
  private readonly logger = new Logger(SecurityRoleClientService.name);
  private readonly securityServiceUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.securityServiceUrl =
      this.configService.get<string>('MS_SECURITY_URL') ??
      'http://localhost:8080';
  }

  /**
   * Agrega un rol al usuario por ID (ms-security addUserRole), sin quitar los existentes.
   */
  async assignProfileRole(
    userId: string,
    profileRole: SecurityProfileRole,
  ): Promise<void> {
    const roleId = this.resolveRoleId(profileRole);
    await this.assignRoleById(userId, roleId, profileRole);
  }

  private resolveRoleId(profileRole: SecurityProfileRole): string {
    const envKey =
      profileRole === SecurityProfileRole.CITIZEN
        ? 'MS_SECURITY_ROLE_CITIZEN_ID'
        : 'MS_SECURITY_ROLE_DRIVER_ID';

    const roleId = this.configService.get<string>(envKey)?.trim();

    if (!roleId) {
      throw new BadGatewayException(
        `Falta configurar ${envKey} en el entorno de ms-business.`,
      );
    }

    return roleId;
  }

  private async assignRoleById(
    userId: string,
    roleId: string,
    profileRole: SecurityProfileRole,
  ): Promise<void> {
    try {
      await axios.post(
        `${this.securityServiceUrl}/api/public/user-role/user/${userId}/role/${roleId}`,
        null,
        { timeout: 30000 },
      );
    } catch (error) {
      this.logger.error(
        `Failed to assign role ${roleId} (${profileRole}) to user ${userId}: ${String(error)}`,
      );
      throw new BadGatewayException(
        `No se pudo asignar el rol del perfil (${profileRole}). El perfil se creó; vuelve a intentar o contacta al administrador.`,
      );
    }
  }
}
