import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { AuthService, AuthResponse } from './auth.service';
import { RegisterDto, LoginDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from './entities/user.entity';
import { ErrorResponseDto } from '../../common/dto';

/**
 * Authentication Controller
 *
 * Handles user registration, login, and profile management
 * Base route: /auth
 */
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Register a new user
   *
   * POST /auth/register
   *
   * @param registerDto - Registration data
   * @returns User object and JWT access token
   *
   * @example
   * Body:
   * {
   *   "email": "buyer@example.com",
   *   "phone": "+971501234567",
   *   "password": "SecurePass123!",
   *   "name": "Ahmed Ali",
   *   "locale": "en"
   * }
   *
   * Response (201):
   * {
   *   "user": {
   *     "id": "uuid",
   *     "email": "buyer@example.com",
   *     "phone": "+971501234567",
   *     "name": "Ahmed Ali",
   *     "locale": "en",
   *     "roles": ["buyer"],
   *     "isActive": true,
   *     "emailVerified": false,
   *     "phoneVerified": false,
   *     "createdAt": "2025-10-04T...",
   *     "updatedAt": "2025-10-04T..."
   *   },
   *   "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * }
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register new user',
    description:
      'Create a new user account with email, phone, and password. ' +
      'Email and phone must be unique. Password must meet security requirements.',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    schema: {
      example: {
        user: {
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          email: 'buyer@example.com',
          phone: '+971501234567',
          name: 'Ahmed Ali',
          locale: 'en',
          roles: ['buyer'],
          isActive: true,
          emailVerified: false,
          phoneVerified: false,
          createdAt: '2025-10-06T10:30:00.000Z',
          updatedAt: '2025-10-06T10:30:00.000Z',
        },
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiConflictResponse({
    description: 'Email or phone already exists',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation error',
    type: ErrorResponseDto,
  })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(registerDto);
  }

  /**
   * Login user
   *
   * POST /auth/login
   *
   * @param loginDto - Login credentials (email/phone and password)
   * @returns User object and JWT access token
   *
   * @example
   * Body:
   * {
   *   "emailOrPhone": "buyer@example.com",  // or "+971501234567"
   *   "password": "SecurePass123!"
   * }
   *
   * Response (200):
   * {
   *   "user": {
   *     "id": "uuid",
   *     "email": "buyer@example.com",
   *     "phone": "+971501234567",
   *     "name": "Ahmed Ali",
   *     "locale": "en",
   *     "roles": ["buyer"],
   *     "isActive": true,
   *     "emailVerified": true,
   *     "phoneVerified": true,
   *     "createdAt": "2025-10-04T...",
   *     "updatedAt": "2025-10-04T...",
   *     "lastLoginAt": "2025-10-04T..."
   *   },
   *   "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * }
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login',
    description:
      'Authenticate user with email or phone and password. Returns JWT token for subsequent requests.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      example: {
        user: {
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          email: 'buyer@example.com',
          phone: '+971501234567',
          name: 'Ahmed Ali',
          locale: 'en',
          roles: ['buyer'],
          isActive: true,
          emailVerified: true,
          phoneVerified: true,
          createdAt: '2025-10-06T10:30:00.000Z',
          updatedAt: '2025-10-06T10:30:00.000Z',
          lastLoginAt: '2025-10-06T12:15:00.000Z',
        },
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials or inactive account',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation error',
    type: ErrorResponseDto,
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(loginDto);
  }

  /**
   * Get current user profile
   *
   * GET /auth/profile
   *
   * @param user - Current authenticated user (from JWT)
   * @returns User profile
   *
   * @example
   * Headers:
   * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   *
   * Response (200):
   * {
   *   "id": "uuid",
   *   "email": "buyer@example.com",
   *   "phone": "+971501234567",
   *   "name": "Ahmed Ali",
   *   "locale": "en",
   *   "roles": ["buyer"],
   *   "isActive": true,
   *   "emailVerified": true,
   *   "phoneVerified": true,
   *   "createdAt": "2025-10-04T...",
   *   "updatedAt": "2025-10-04T...",
   *   "lastLoginAt": "2025-10-04T..."
   * }
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get current user profile',
    description:
      'Retrieve profile information for the currently authenticated user. Requires valid JWT token.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      example: {
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        email: 'buyer@example.com',
        phone: '+971501234567',
        name: 'Ahmed Ali',
        locale: 'en',
        roles: ['buyer'],
        isActive: true,
        emailVerified: true,
        phoneVerified: true,
        createdAt: '2025-10-06T10:30:00.000Z',
        updatedAt: '2025-10-06T10:30:00.000Z',
        lastLoginAt: '2025-10-06T12:15:00.000Z',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing JWT token',
    type: ErrorResponseDto,
  })
  async getProfile(@CurrentUser() user: User): Promise<Partial<User>> {
    // Remove password hash from response (should already be excluded)
    const { passwordHash: _, ...userProfile } = user;
    return userProfile;
  }

  /**
   * Refresh access token
   *
   * POST /auth/refresh
   *
   * Note: This is a placeholder for future implementation
   * Will require refresh token management system
   *
   * @returns New access token
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Refresh JWT access token. Note: This is a placeholder endpoint. ' +
      'Full refresh token functionality is not yet implemented.',
  })
  @ApiResponse({
    status: 200,
    description: 'Information about refresh token status',
    schema: {
      example: {
        message: 'Refresh token functionality not yet implemented. Use re-login for now.',
      },
    },
  })
  async refresh(): Promise<{ message: string }> {
    return {
      message: 'Refresh token functionality not yet implemented. Use re-login for now.',
    };
  }
}
