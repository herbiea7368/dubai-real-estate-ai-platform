import { IsEnum, IsOptional, IsString, MinLength, MaxLength } from 'class-validator';
import { UserLocale } from '../entities/user.entity';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name?: string;

  @IsOptional()
  @IsEnum(UserLocale, { message: 'Locale must be either "en" or "ar"' })
  locale?: UserLocale;
}
