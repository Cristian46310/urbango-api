import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { firstValueFrom } from 'rxjs';
import { JwtPayload } from '../types';

interface ValidateTokenResponse {
  id: string;
  name?: string;
  email?: string;
  roles?: string[];
  createdAt?: number;
}

type CacheEntry = {
  payload: JwtPayload;
  expiresAt: number;
};

/** Short TTL to cut repeated validate-token calls within the same request burst. */
const CACHE_TTL_MS = 30_000;

@Injectable()
export class JwtValidationService {
  private readonly logger = new Logger(JwtValidationService.name);
  private readonly securityServiceUrl: string;
  private readonly cache = new Map<string, CacheEntry>();

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.securityServiceUrl =
      this.configService.get<string>('MS_SECURITY_URL') ??
      'http://localhost:8080';
  }

  async validateToken(token: string): Promise<JwtPayload> {
    const cacheKey = this.hashToken(token);
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.payload;
    }

    try {
      const validationUrl = `${this.securityServiceUrl}/api/public/security/validate-token`;

      this.logger.debug(`Validating token against: ${validationUrl}`);

      const response = await firstValueFrom(
        this.httpService.post<ValidateTokenResponse>(validationUrl, null, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        }),
      );

      const userData = response.data;

      if (!userData || !userData.id) {
        throw new Error('Invalid response structure from ms-security');
      }

      const jwtPayload: JwtPayload = {
        id: userData.id,
        name: userData.name || '',
        email: userData.email || '',
        roles: Array.isArray(userData.roles) ? userData.roles : [],
        createdAt: userData.createdAt ?? Date.now(),
      };

      this.cache.set(cacheKey, {
        payload: jwtPayload,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });
      this.pruneExpiredCache();

      return jwtPayload;
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

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private pruneExpiredCache(): void {
    if (this.cache.size < 200) {
      return;
    }
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (entry.expiresAt <= now) {
        this.cache.delete(key);
      }
    }
  }
}
