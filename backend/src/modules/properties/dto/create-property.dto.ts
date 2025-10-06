import {
  IsEnum,
  IsString,
  IsNotEmpty,
  IsInt,
  IsNumber,
  Min,
  IsOptional,
  IsDateString,
  IsObject,
  IsArray,
} from 'class-validator';
import { PropertyType, PropertyPurpose, CompletionStatus } from '../entities/property.entity';

export class CreatePropertyDto {
  @IsEnum(PropertyType)
  type!: PropertyType;

  @IsEnum(PropertyPurpose)
  purpose!: PropertyPurpose;

  @IsString()
  @IsNotEmpty()
  community!: string;

  @IsOptional()
  @IsString()
  subCommunity?: string;

  @IsOptional()
  @IsString()
  developer?: string;

  @IsInt()
  @Min(0)
  bedrooms!: number;

  @IsNumber()
  @Min(0)
  bathrooms!: number;

  @IsInt()
  @Min(1)
  areaSqft!: number;

  @IsNumber()
  @Min(1)
  priceAed!: number;

  @IsEnum(CompletionStatus)
  completionStatus!: CompletionStatus;

  @IsOptional()
  @IsDateString()
  handoverDate?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @IsOptional()
  @IsObject()
  location?: {
    lat: number;
    lng: number;
  };

  @IsOptional()
  @IsObject()
  address?: {
    street?: string;
    building?: string;
    area?: string;
  };
}
