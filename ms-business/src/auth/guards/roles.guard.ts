import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // Si no hay roles requeridos, permitir
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not found in request');
    }

    this.logger.debug(
      `Checking roles for user ${user.id}. Required: [${requiredRoles.join(', ')}], User has: [${(user.roles || []).join(', ')}]`,
    );

    // Verificar si el usuario tiene al menos uno de los roles requeridos
    const hasRole = requiredRoles.some((role) =>
      user.roles?.includes(role),
    );

    if (!hasRole) {
      this.logger.warn(
        `❌ Access denied for user ${user.id}. Required roles: ${requiredRoles.join(', ')}`,
      );
      throw new ForbiddenException(
        `You do not have permission to access this resource. Required roles: ${requiredRoles.join(', ')}`,
      );
    }

    this.logger.debug(`✅ User ${user.id} has required role`);
    return true;
  }
}
