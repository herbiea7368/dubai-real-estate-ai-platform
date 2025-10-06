import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../modules/auth/entities/user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Roles Guard
 *
 * Enforces role-based access control (RBAC)
 * Works in conjunction with @Roles() decorator
 *
 * Usage:
 * @Roles(UserRole.AGENT, UserRole.COMPLIANCE)
 * @UseGuards(JwtAuthGuard, RolesGuard)
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required roles from @Roles decorator
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Get user from request (attached by JwtAuthGuard)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.warn('RolesGuard: No user found in request');
      throw new ForbiddenException('Access denied: User not authenticated');
    }

    // Check if user has at least one of the required roles
    const hasRole = requiredRoles.some((role) => user.roles?.includes(role));

    if (!hasRole) {
      this.logger.warn(
        `RolesGuard: User ${user.id} with roles [${user.roles?.join(', ')}] attempted to access resource requiring roles [${requiredRoles.join(', ')}]`,
      );
      throw new ForbiddenException(`Access denied: Required roles [${requiredRoles.join(', ')}]`);
    }

    return true;
  }
}
