import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../modules/auth/entities/user.entity';

/**
 * Metadata key for roles
 */
export const ROLES_KEY = 'roles';

/**
 * Roles Decorator
 *
 * Marks a route as requiring specific user roles
 * Must be used with RolesGuard and JwtAuthGuard
 *
 * @param roles - Array of UserRole values required to access the route
 *
 * @example
 * @Roles(UserRole.AGENT, UserRole.COMPLIANCE)
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Get('admin/users')
 * getAdminUsers() {
 *   // Only agents and compliance officers can access
 * }
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
