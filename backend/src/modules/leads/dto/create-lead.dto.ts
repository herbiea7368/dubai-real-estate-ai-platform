import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsEnum,
  IsOptional,
  IsObject,
  IsArray,
  IsBoolean,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LeadSource, PropertyType } from '../entities/lead.entity';

class BudgetDto {
  @IsOptional()
  @IsNotEmpty()
  min?: number;

  @IsOptional()
  @IsNotEmpty()
  max?: number;

  @IsOptional()
  @IsString()
  currency?: string;
}

export class CreateLeadDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Phone must be a valid international format',
  })
  phone!: string;

  @IsOptional()
  @IsString()
  countryCode?: string = '+971';

  @IsEnum(LeadSource)
  source!: LeadSource;

  @IsOptional()
  @IsString()
  campaign?: string;

  @IsOptional()
  @IsString()
  utmSource?: string;

  @IsOptional()
  @IsString()
  utmMedium?: string;

  @IsOptional()
  @IsString()
  utmCampaign?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => BudgetDto)
  budget?: BudgetDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredCommunities?: string[];

  @IsOptional()
  @IsEnum(PropertyType)
  preferredPropertyType?: PropertyType;

  @IsOptional()
  @IsBoolean()
  interestedInOffPlan?: boolean;

  @IsOptional()
  @IsBoolean()
  investorProfile?: boolean;

  @IsOptional()
  @IsBoolean()
  visaEligibilityInterest?: boolean;

  @IsOptional()
  @IsArray()
  propertyInterests?: Array<{
    propertyId?: string;
    propertyType?: string;
    community?: string;
  }>;
}
