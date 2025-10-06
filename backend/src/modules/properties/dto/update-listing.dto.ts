import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateListingDto } from './create-listing.dto';
import { IsOptional, IsEnum, IsArray, IsString } from 'class-validator';
import { ListingBadge } from '../entities/listing.entity';

export class UpdateListingDto extends PartialType(
  OmitType(CreateListingDto, ['propertyId'] as const),
) {
  @IsOptional()
  @IsArray()
  @IsEnum(ListingBadge, { each: true })
  badges?: ListingBadge[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  publishedChannels?: string[];
}
