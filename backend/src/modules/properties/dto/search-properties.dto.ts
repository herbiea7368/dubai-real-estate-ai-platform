import { IsEnum, IsOptional, IsString, IsNumber, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PropertyType, PropertyPurpose, PropertyStatus } from '../entities/property.entity';

export class SearchPropertiesDto {
  @IsOptional()
  @IsEnum(PropertyType)
  type?: PropertyType;

  @IsOptional()
  @IsString()
  community?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxPrice?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  beds?: number;

  @IsOptional()
  @IsEnum(PropertyPurpose)
  purpose?: PropertyPurpose;

  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus | PropertyStatus[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(['priceAed', 'createdAt', 'areaSqft'])
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: string = 'desc';
}
