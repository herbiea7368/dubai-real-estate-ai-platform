import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Override handleRequest to make auth optional
  handleRequest(_err: any, user: any, _info: any, _context: ExecutionContext) {
    // If there's no user, return null (allow request to proceed)
    // If there's a user, return it (attach to request)
    return user || null;
  }
}
