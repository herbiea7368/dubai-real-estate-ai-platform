import { IsOptional, IsUUID, IsString, IsEnum, IsInt, IsArray, Min, ValidateIf } from 'class-validator';
import { PropertyType, CompletionStatus } from '../../properties/entities/property.entity';

export class EstimateValueDto {
  @IsOptional()
  @IsUUID()
  propertyId?: string;

  // Manual property features (required if no propertyId)
  @ValidateIf(o => !o.propertyId)
  @IsString()
  community?: string;

  @ValidateIf(o => !o.propertyId)
  @IsEnum(PropertyType)
  propertyType?: PropertyType;

  @ValidateIf(o => !o.propertyId)
  @IsInt()
  @Min(0)
  bedrooms?: number;

  @ValidateIf(o => !o.propertyId)
  @IsInt()
  @Min(0)
  bathrooms?: number;

  @ValidateIf(o => !o.propertyId)
  @IsInt()
  @Min(1)
  areaSqft?: number;

  @IsOptional()
  @IsArray()
  amenities?: string[];

  @IsOptional()
  @IsEnum(CompletionStatus)
  completionStatus?: CompletionStatus;

  @IsOptional()
  @IsInt()
  completionYear?: number;

  @IsOptional()
  @IsInt()
  floor?: number;

  @IsOptional()
  @IsString()
  view?: string;
}
