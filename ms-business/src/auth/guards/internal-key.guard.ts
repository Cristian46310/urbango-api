import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

/**
 * Validates X-Internal-Key for M2M callers (e.g. ms-ai).
 * Supports dual-key rotation: MS_INTERNAL_API_KEY + MS_INTERNAL_API_KEY_PREVIOUS.
 */
@Injectable()
export class InternalKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const provided =
      (request.headers['x-internal-key'] as string | undefined)?.trim() ?? '';

    const current =
      this.configService.get<string>('MS_INTERNAL_API_KEY')?.trim() ?? '';
    const previous =
      this.configService.get<string>('MS_INTERNAL_API_KEY_PREVIOUS')?.trim() ??
      '';

    if (!current && !previous) {
      throw new UnauthorizedException(
        'MS_INTERNAL_API_KEY is not configured on ms-business',
      );
    }

    if (!provided || (provided !== current && provided !== previous)) {
      throw new UnauthorizedException('Invalid or missing X-Internal-Key');
    }

    return true;
  }
}
