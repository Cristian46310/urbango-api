import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { JwtPayload } from '../types';

interface ValidateTokenResponse {
  id: string;
  name?: string;
  email?: string;
  roles?: string[];
  createdAt?: number;
}

@Injectable()
export class JwtValidationService {
  private readonly logger = new Logger(JwtValidationService.name);
  private readonly securityServiceUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.securityServiceUrl =
      this.configService.get<string>('MS_SECURITY_URL') ??
      'http://localhost:8080';
  }

  async validateToken(token: string): Promise<JwtPayload> {
    try {
      const validationUrl = `${this.securityServiceUrl}/api/public/security/validate-token`;

      this.logger.debug(`Validating token against: ${validationUrl}`);

      const response = await axios.post<ValidateTokenResponse>(
        validationUrl,
        null,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        },
      );

      const userData = response.data;

      if (!userData?.id) {
        throw new Error('Invalid response structure from ms-security');
      }

      return {
        id: userData.id,
        name: userData.name || '',
        email: userData.email || '',
        roles: Array.isArray(userData.roles) ? userData.roles : [],
        createdAt: userData.createdAt ?? Date.now(),
      };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Token validation error: ${error.message}`);
      }

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
