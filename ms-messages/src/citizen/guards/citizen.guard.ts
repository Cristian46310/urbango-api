import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRES_CITIZEN_KEY } from '../decorators/requires-citizen.decorator';
import { CitizenProfileService } from '../services/citizen-profile.service';
import type { JwtPayload } from '@/auth/types';

interface AuthRequest {
  user?: JwtPayload;
}

@Injectable()
export class CitizenGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly citizenProfileService: CitizenProfileService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiresCitizen = this.reflector.getAllAndOverride<boolean>(
      REQUIRES_CITIZEN_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiresCitizen) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthRequest>();
    const userId = request.user?.id;

    if (!userId) {
      throw new ForbiddenException('Usuario no identificado');
    }

    await this.citizenProfileService.requireCitizenProfile(userId);
    return true;
  }
}
