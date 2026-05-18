import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SecurityGuard implements CanActivate {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HttpException(
        { allowed: false, reason: 'Missing or malformed Authorization header' },
        HttpStatus.UNAUTHORIZED,
      );
    }

    const token = authHeader.substring(7);
    const method = request.method;
    const url = request.url;

    const msSecurityUrl = this.configService.get<string>('MS_SECURITY_URL');
    if (!msSecurityUrl) {
      throw new HttpException(
        { allowed: false, reason: 'Authorization service unavailable' },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post<{ allowed: boolean; reason?: string }>(
          `${msSecurityUrl}/api/public/security/authorize`,
          { method, url },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        ),
      );

      if (response.data.allowed) {
        return true;
      } else {
        throw new HttpException(
          { allowed: false, reason: response.data.reason || 'Insufficient role' },
          HttpStatus.FORBIDDEN,
        );
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        { allowed: false, reason: 'Authorization service unavailable' },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}