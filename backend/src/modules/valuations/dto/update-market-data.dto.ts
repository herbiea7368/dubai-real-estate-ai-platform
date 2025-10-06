import { IsString, IsNotEmpty, IsEnum, IsNumber, Min, IsInt, IsOptional, IsDateString } from 'class-validator';
import { PropertyType } from '../../properties/entities/property.entity';

export class UpdateMarketDataDto {
  @IsString()
  @IsNotEmpty()
  community!: string;

  @IsEnum(PropertyType)
  propertyType!: PropertyType;

  @IsNumber()
  @Min(1)
  avgPriceSqft!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  avgRentSqft?: number;

  @IsInt()
  @Min(0)
  transactionCount!: number;

  @IsOptional()
  @IsNumber()
  priceChangeYoY?: number;

  @IsDateString()
  dataDate!: string;

  @IsString()
  source!: string;
}
