import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserLocale } from '../entities/user.entity';

/**
 * UAE Phone Number Regex
 * Matches: +971501234567, +971 50 123 4567, 971501234567
 * Covers all UAE mobile operators: 50, 52, 54, 55, 56, 58
 */
const UAE_PHONE_REGEX = /^(\+?971|0)?5[024568]\d{7}$/;

/**
 * Password Complexity Regex
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
const PASSWORD_COMPLEXITY_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export class RegisterDto {
  @ApiProperty({
    description: 'User email address (must be unique)',
    example: 'buyer@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @ApiProperty({
    description: 'UAE phone number (must be unique)',
    example: '+971501234567',
    pattern: '^(\\+?971|0)?5[024568]\\d{7}$',
  })
  @Matches(UAE_PHONE_REGEX, {
    message: 'Please provide a valid UAE phone number (e.g., +971501234567 or 0501234567)',
  })
  @IsNotEmpty({ message: 'Phone number is required' })
  phone!: string;

  @ApiProperty({
    description:
      'Password (min 8 chars, must include uppercase, lowercase, number, and special character)',
    example: 'SecurePass123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(PASSWORD_COMPLEXITY_REGEX, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)',
  })
  @IsNotEmpty({ message: 'Password is required' })
  password!: string;

  @ApiProperty({
    description: 'User full name',
    example: 'Ahmed Ali',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  @IsNotEmpty({ message: 'Name is required' })
  name!: string;

  @ApiProperty({
    description: 'User preferred locale/language',
    example: 'en',
    enum: UserLocale,
  })
  @IsEnum(UserLocale, { message: 'Locale must be either "en" or "ar"' })
  @IsNotEmpty({ message: 'Locale is required' })
  locale!: UserLocale;
}
