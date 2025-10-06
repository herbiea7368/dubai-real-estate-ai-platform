import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Authentication Guard
 *
 * Protects routes by requiring a valid JWT token
 * Usage: @UseGuards(JwtAuthGuard)
 *
 * Automatically validates token and attaches user to request.user
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  /**
   * Override canActivate to add custom logic if needed
   * Currently uses default Passport JWT validation
   */
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
