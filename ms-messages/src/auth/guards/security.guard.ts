import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosError, AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { IS_AUTHENTICATED_KEY } from '../decorators/authenticated.decorator';
import { JwtValidationService } from '../services/jwt-validation.service';
import { JwtPayload } from '../types';

interface AuthRequest {
  headers: { authorization?: string };
  method: string;
  originalUrl?: string;
  url?: string;
  user?: JwtPayload;
}

interface AuthorizationResponse {
  allowed: boolean;
  reason?: string;
}

@Injectable()
export class SecurityGuard implements CanActivate {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
    private readonly jwtValidationService: JwtValidationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const isAuthenticatedOnly = this.reflector.getAllAndOverride<boolean>(
      IS_AUTHENTICATED_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthRequest>();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new HttpException(
        { allowed: false, reason: 'Missing or malformed Authorization header' },
        HttpStatus.UNAUTHORIZED,
      );
    }

    const token = authHeader.substring(7);

    try {
      request.user = await this.jwtValidationService.validateToken(token);
    } catch (error) {
      if (error instanceof HttpException) {
        const response = error.getResponse();
        const reason =
          typeof response === 'object' &&
          response !== null &&
          'message' in response &&
          typeof (response as { message?: string }).message === 'string'
            ? (response as { message: string }).message
            : 'Invalid or expired token';

        throw new HttpException(
          { allowed: false, reason },
          HttpStatus.UNAUTHORIZED,
        );
      }

      throw new HttpException(
        { allowed: false, reason: 'Invalid or expired token' },
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (isAuthenticatedOnly) {
      return true;
    }

    const method = request.method;
    const url = this.getRequestPath(request);
    const msSecurityUrl = this.configService
      .get<string>('MS_SECURITY_URL')
      ?.trim()
      ?.replace(/\/$/, '');
    if (!msSecurityUrl) {
      throw new HttpException(
        { allowed: false, reason: 'MS_SECURITY_URL is not configured' },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    try {
      const response: AxiosResponse<AuthorizationResponse> =
        await firstValueFrom(
          this.httpService.post<AuthorizationResponse>(
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
      }

      throw new HttpException(
        {
          allowed: false,
          reason: response.data.reason || 'Insufficient role',
        },
        HttpStatus.FORBIDDEN,
      );
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

        if (status === 401) {
          throw new HttpException(
            { allowed: false, reason },
            HttpStatus.UNAUTHORIZED,
          );
        }

        if (status === 403) {
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

  private getRequestPath(request: {
    originalUrl?: string;
    url?: string;
  }): string {
    const rawUrl = request.originalUrl ?? request.url ?? '/';
    const questionMarkIndex = rawUrl.indexOf('?');
    return questionMarkIndex >= 0 ? rawUrl.slice(0, questionMarkIndex) : rawUrl;
  }
}
