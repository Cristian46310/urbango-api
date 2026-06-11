import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRES_DRIVER_KEY } from '../decorators/requires-driver.decorator';
import { DriverProfileService } from '../services/driver-profile.service';
import type { JwtPayload } from '@/auth/types';

interface AuthRequest {
  user?: JwtPayload;
}

@Injectable()
export class DriverGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly driverProfileService: DriverProfileService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiresDriver = this.reflector.getAllAndOverride<boolean>(
      REQUIRES_DRIVER_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiresDriver) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthRequest>();
    const userId = request.user?.id;

    if (!userId) {
      throw new ForbiddenException('Usuario no identificado');
    }

    await this.driverProfileService.requireDriverProfile(userId);
    return true;
  }
}
