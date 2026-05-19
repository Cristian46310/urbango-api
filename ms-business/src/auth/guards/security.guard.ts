import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class SecurityGuard implements CanActivate {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

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
    const url = this.getRequestPath(request);

    request.user = this.decodeJwtPayload(token);

    const msSecurityUrl =
      this.configService.get<string>('MS_SECURITY_URL') ??
      'http://localhost:8080';

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

      if (error instanceof AxiosError && error.response) {
        const status = error.response.status;
        const responseData = error.response.data as
          | { reason?: string }
          | string
          | undefined;
        const reason =
          typeof responseData === 'object' &&
          responseData !== null &&
          typeof responseData.reason === 'string'
            ? responseData.reason
            : 'Authorization service unavailable';

        if (status === HttpStatus.UNAUTHORIZED) {
          throw new HttpException(
            { allowed: false, reason },
            HttpStatus.UNAUTHORIZED,
          );
        }

        if (status === HttpStatus.FORBIDDEN) {
          throw new HttpException(
            { allowed: false, reason: reason || 'Insufficient role' },
            HttpStatus.FORBIDDEN,
          );
        }
      }

      throw new HttpException(
        { allowed: false, reason: 'Authorization service unavailable' },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  private getRequestPath(request: { originalUrl?: string; url?: string }): string {
    const rawUrl = request.originalUrl ?? request.url ?? '/';
    const questionMarkIndex = rawUrl.indexOf('?');
    return questionMarkIndex >= 0 ? rawUrl.slice(0, questionMarkIndex) : rawUrl;
  }

  private decodeJwtPayload(token: string): Record<string, unknown> {
    const payloadSegment = token.split('.')[1];

    if (!payloadSegment) {
      return {};
    }

    const normalizedPayload = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
    const padding = normalizedPayload.length % 4;
    const paddedPayload = normalizedPayload + (padding ? '='.repeat(4 - padding) : '');

    try {
      const payloadJson = Buffer.from(paddedPayload, 'base64').toString('utf8');
      const payload = JSON.parse(payloadJson) as Record<string, unknown>;

      return {
        id:
          typeof payload.id === 'string'
            ? payload.id
            : typeof payload.sub === 'string'
              ? payload.sub
              : undefined,
        name: typeof payload.name === 'string' ? payload.name : undefined,
        email: typeof payload.email === 'string' ? payload.email : undefined,
        enterpriseId:
          typeof payload.enterpriseId === 'string'
            ? payload.enterpriseId
            : undefined,
        roles: Array.isArray(payload.roles)
          ? payload.roles.filter((role): role is string => typeof role === 'string')
          : [],
      };
    } catch {
      return {};
    }
  }
}