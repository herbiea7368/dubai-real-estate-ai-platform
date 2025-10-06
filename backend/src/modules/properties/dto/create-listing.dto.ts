import {
  IsUUID,
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsArray,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ListingLanguage, MediaType } from '../entities/listing.entity';

class MediaUrlDto {
  @IsUrl()
  url!: string;

  @IsEnum(MediaType)
  type!: MediaType;

  @IsOptional()
  @IsNotEmpty()
  order?: number;
}

export class CreateListingDto {
  @IsUUID()
  propertyId!: string;

  @IsString()
  @IsNotEmpty()
  trakheesiNumber!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(200)
  titleEn!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(200)
  titleAr!: string;

  @IsString()
  @MinLength(50)
  descriptionEn!: string;

  @IsString()
  @MinLength(50)
  descriptionAr!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaUrlDto)
  mediaUrls?: MediaUrlDto[];

  @IsOptional()
  @IsBoolean()
  virtualStagingApplied?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  publishedChannels?: string[];

  @IsEnum(ListingLanguage)
  language!: ListingLanguage;
}
