import { IsEnum, IsNotEmpty, IsUrl, IsUUID } from 'class-validator';
import { StagingStyle, RoomType } from '../entities/staged-image.entity';

export class StageImageDto {
  @IsUrl()
  @IsNotEmpty()
  imageUrl!: string;

  @IsEnum(StagingStyle)
  @IsNotEmpty()
  style!: StagingStyle;

  @IsEnum(RoomType)
  @IsNotEmpty()
  roomType!: RoomType;

  @IsUUID()
  @IsNotEmpty()
  listingId!: string;
}
