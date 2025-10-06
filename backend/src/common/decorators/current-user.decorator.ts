import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../modules/auth/entities/user.entity';

/**
 * Current User Decorator
 *
 * Extracts the authenticated user from the request object
 * User is attached by JwtAuthGuard
 *
 * @example
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)
 * getProfile(@CurrentUser() user: User) {
 *   return user;
 * }
 */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): User => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
