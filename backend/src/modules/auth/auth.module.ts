import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { JwtStrategy } from './strategies/jwt.strategy';

/**
 * Authentication Module
 *
 * Provides complete authentication system with:
 * - User registration and login
 * - JWT token generation and validation
 * - Password hashing with bcrypt
 * - Role-based access control (RBAC)
 * - UAE phone number validation
 */
@Module({
  imports: [
    // Register User entity
    TypeOrmModule.forFeature([User]),

    // Passport configuration
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // JWT configuration with async setup to use ConfigService
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '7d'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}
