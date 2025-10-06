import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsInt,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PropertyType } from '../../properties/entities/property.entity';

export class SearchPropertiesDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  q?: string;

  @IsOptional()
  @IsEnum(PropertyType)
  type?: PropertyType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  beds?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  baths?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  community?: string;

  @IsOptional()
  @IsEnum(['sale', 'rent'])
  purpose?: 'sale' | 'rent';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(['price_asc', 'price_desc', 'date_desc', 'relevance'])
  sort?: 'price_asc' | 'price_desc' | 'date_desc' | 'relevance' = 'relevance';
}
