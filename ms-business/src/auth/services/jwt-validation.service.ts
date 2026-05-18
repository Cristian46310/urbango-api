import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';
import { JwtPayload } from '../types';
import { UserIdMappingService } from '@/shared/services/user-id-mapping.service';

@Injectable()
export class JwtValidationService {
  private readonly logger = new Logger(JwtValidationService.name);
  private readonly securityServiceUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly userIdMappingService: UserIdMappingService,
  ) {
    this.securityServiceUrl =
      this.configService.get<string>('MS_SECURITY_URL') ??
      'http://localhost:8080';
  }

  /**
   * Valida el JWT contra ms-security
   * Obtiene información del usuario y sus roles
   */
  async validateToken(token: string): Promise<JwtPayload> {
    try {
      const validationUrl = `${this.securityServiceUrl}/api/public/security/validate-token`;

      this.logger.debug(`🔍 Validating token against: ${validationUrl}`);
      this.logger.debug(`Token preview: ${token.substring(0, 20)}...`);

      const response = await axios.post(validationUrl, null, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      });

      const userData = response.data;

      this.logger.debug(`📦 Raw response from ms-security: ${JSON.stringify(userData)}`);

      // Validar que tenemos los campos necesarios
      if (!userData || !userData.id) {
        this.logger.error(`⚠️ Invalid response structure: missing 'id' field`);
        throw new Error('Invalid response structure from ms-security');
      }

      const jwtPayload: JwtPayload = {
        id: userData.id,
        name: userData.name || '',
        email: userData.email || '',
        roles: Array.isArray(userData.roles) ? userData.roles : [],
        createdAt: userData.createdAt ?? Date.now(),
      };

      this.logger.debug(`✅ Token validated successfully for user: ${jwtPayload.id}`);
      this.logger.debug(`👥 User roles: ${jwtPayload.roles.join(', ')}`);

      // Crear/actualizar el mapeo de IDs si el usuario tiene UUID de PostgreSQL
      // Esto es útil para sincronización con ms-business
      if (userData.postgresUuid) {
        await this.userIdMappingService.createOrUpdateMapping(
          userData.id,
          userData.postgresUuid,
        );
        this.logger.debug(`🔗 Created ID mapping: ${userData.id} -> ${userData.postgresUuid}`);
      }

      return jwtPayload;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`❌ Token validation error: ${error.message}`);
      }

      const axiosError = error as AxiosError;

      this.logger.error(`📍 Error details: ${JSON.stringify(axiosError.response?.data)}`);
      this.logger.error(`🔢 HTTP Status: ${axiosError.response?.status}`);
      this.logger.error(`⏱️ Error code: ${axiosError.code}`);
      this.logger.error(`🌐 Error config URL: ${(axiosError.config as any)?.url}`);

      throw new HttpException(
        {
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid or expired token',
          error: 'Unauthorized',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}