import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

/**
 * JWT Payload Interface
 * Defines the structure of data embedded in JWT tokens
 */
export interface JwtPayload {
  sub: string; // User ID
  email: string;
  roles: string[];
  locale: string;
}

/**
 * JWT Authentication Strategy
 *
 * Validates JWT tokens and attaches user to request object
 * Used by @UseGuards(JwtAuthGuard) on protected routes
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'default-secret',
    });
  }

  /**
   * Validate JWT payload and return user object
   *
   * This method is called automatically by Passport after token verification
   * The returned value will be attached to request.user
   *
   * @param payload - Decoded JWT payload
   * @returns User object or throws UnauthorizedException
   */
  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found or token invalid');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is deactivated');
    }

    return user;
  }
}
