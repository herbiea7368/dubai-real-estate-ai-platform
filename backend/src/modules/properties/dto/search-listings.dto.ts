import { IsEnum, IsOptional, IsString, IsNumber, IsInt, Min, Max, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { PropertyType, PropertyPurpose } from '../entities/property.entity';
import { ListingLanguage, ListingBadge } from '../entities/listing.entity';

export class SearchListingsDto {
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
  @IsEnum(ListingLanguage)
  language?: ListingLanguage;

  @IsOptional()
  @IsArray()
  @IsEnum(ListingBadge, { each: true })
  badges?: ListingBadge[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  publishedChannels?: string[];

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
  @IsEnum(['createdAt', 'publishedAt', 'viewCount'])
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: string = 'desc';
}
