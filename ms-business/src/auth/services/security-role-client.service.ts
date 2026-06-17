import {
  BadGatewayException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/** Roles en ms-security (MongoDB) alineados con onboarding de perfiles. */
export const SecurityRoleName = {
  CITIZEN: 'CITEZEN',
  DRIVER: 'DRIVER',
} as const;

export type SecurityRoleName =
  (typeof SecurityRoleName)[keyof typeof SecurityRoleName];

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
   * Asigna un rol por nombre sin quitar los existentes (ms-security addUserRoleByName).
   */
  async assignRoleByName(
    userId: string,
    roleName: SecurityRoleName,
  ): Promise<void> {
    const encodedRole = encodeURIComponent(roleName);

    try {
      await axios.post(
        `${this.securityServiceUrl}/api/public/user-role/user/${userId}/role-name/${encodedRole}`,
        null,
        { timeout: 30000 },
      );
    } catch (error) {
      this.logger.error(
        `Failed to assign role ${roleName} to user ${userId}: ${String(error)}`,
      );
      throw new BadGatewayException(
        `No se pudo asignar el rol ${roleName}. El perfil se creó; vuelve a intentar o contacta al administrador.`,
      );
    }
  }
}
