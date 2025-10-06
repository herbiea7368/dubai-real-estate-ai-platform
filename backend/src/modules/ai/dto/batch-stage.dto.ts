import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsUrl,
  IsUUID,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StagingStyle, RoomType } from '../entities/staged-image.entity';

export class BatchImageDto {
  @IsUrl()
  @IsNotEmpty()
  imageUrl!: string;

  @IsEnum(StagingStyle)
  @IsNotEmpty()
  style!: StagingStyle;

  @IsEnum(RoomType)
  @IsNotEmpty()
  roomType!: RoomType;
}

export class BatchStageDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => BatchImageDto)
  images!: BatchImageDto[];

  @IsUUID()
  @IsNotEmpty()
  listingId!: string;
}
