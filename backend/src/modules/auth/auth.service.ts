import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { RegisterDto, LoginDto } from './dto';
import { hashPassword, comparePasswords } from '../../common/utils/password.util';
import { JwtPayload } from './strategies/jwt.strategy';

/**
 * Authentication Response Interface
 */
export interface AuthResponse {
  user: Partial<User>;
  accessToken: string;
}

/**
 * Authentication Service
 *
 * Handles user registration, login, and validation
 * Implements JWT token generation for secure authentication
 */
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  /**
   * Register a new user
   *
   * @param registerDto - Registration data (email, phone, password, name, locale)
   * @returns User object and JWT access token
   * @throws ConflictException if email or phone already exists
   */
  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, phone, password, name, locale } = registerDto;

    // Normalize phone number (remove spaces, ensure +971 prefix)
    const normalizedPhone = this.normalizeUAEPhone(phone);

    // Check if email already exists
    const existingEmail = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingEmail) {
      throw new ConflictException('Email address is already registered');
    }

    // Check if phone already exists
    const existingPhone = await this.userRepository.findOne({
      where: { phone: normalizedPhone },
    });

    if (existingPhone) {
      throw new ConflictException('Phone number is already registered');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create new user with default 'buyer' role
    const user = this.userRepository.create({
      email: email.toLowerCase(),
      phone: normalizedPhone,
      passwordHash,
      name,
      locale,
      roles: [UserRole.BUYER],
      isActive: true,
      emailVerified: false,
      phoneVerified: false,
    });

    const savedUser = await this.userRepository.save(user);

    // Generate JWT token
    const accessToken = this.generateAccessToken(savedUser);

    // Return user without password
    const { passwordHash: _, ...userWithoutPassword } = savedUser;

    return {
      user: userWithoutPassword,
      accessToken,
    };
  }

  /**
   * Login user with email/phone and password
   *
   * @param loginDto - Login credentials (emailOrPhone, password)
   * @returns User object and JWT access token
   * @throws UnauthorizedException if credentials are invalid
   */
  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { emailOrPhone, password } = loginDto;

    // Find user by email or phone
    const user = await this.findUserByEmailOrPhone(emailOrPhone);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Validate password
    const isPasswordValid = await comparePasswords(password, user.passwordHash!);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Update last login timestamp
    await this.userRepository.update(user.id, {
      lastLoginAt: new Date(),
    });

    // Generate JWT token
    const accessToken = this.generateAccessToken(user);

    // Return user without password
    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
    };
  }

  /**
   * Validate user credentials (used by Passport strategies)
   *
   * @param emailOrPhone - Email or phone number
   * @param password - Password
   * @returns User object or null if invalid
   */
  async validateUser(emailOrPhone: string, password: string): Promise<User | null> {
    const user = await this.findUserByEmailOrPhone(emailOrPhone);

    if (!user) {
      return null;
    }

    const isPasswordValid = await comparePasswords(password, user.passwordHash!);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  /**
   * Find user by email or phone number
   *
   * @param emailOrPhone - Email or phone number
   * @returns User with password or null
   */
  private async findUserByEmailOrPhone(emailOrPhone: string): Promise<User | null> {
    // Check if input looks like an email
    const isEmail = emailOrPhone.includes('@');

    if (isEmail) {
      return this.userRepository.findOne({
        where: { email: emailOrPhone.toLowerCase() },
        select: [
          'id',
          'email',
          'phone',
          'name',
          'locale',
          'roles',
          'passwordHash',
          'isActive',
          'emailVerified',
          'phoneVerified',
          'createdAt',
          'updatedAt',
          'lastLoginAt',
        ],
      });
    } else {
      // Normalize phone number
      const normalizedPhone = this.normalizeUAEPhone(emailOrPhone);

      return this.userRepository.findOne({
        where: { phone: normalizedPhone },
        select: [
          'id',
          'email',
          'phone',
          'name',
          'locale',
          'roles',
          'passwordHash',
          'isActive',
          'emailVerified',
          'phoneVerified',
          'createdAt',
          'updatedAt',
          'lastLoginAt',
        ],
      });
    }
  }

  /**
   * Generate JWT access token
   *
   * @param user - User object
   * @returns JWT token string
   */
  private generateAccessToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      locale: user.locale,
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Normalize UAE phone number to +971XXXXXXXXX format
   *
   * @param phone - Phone number in various formats
   * @returns Normalized phone number with +971 prefix
   */
  private normalizeUAEPhone(phone: string): string {
    // Remove all spaces and dashes
    let normalized = phone.replace(/[\s-]/g, '');

    // If starts with 0, replace with +971
    if (normalized.startsWith('0')) {
      normalized = '+971' + normalized.substring(1);
    }

    // If starts with 971 (without +), add +
    if (normalized.startsWith('971') && !normalized.startsWith('+971')) {
      normalized = '+' + normalized;
    }

    // If doesn't start with +971, add it
    if (!normalized.startsWith('+971')) {
      normalized = '+971' + normalized;
    }

    return normalized;
  }
}
