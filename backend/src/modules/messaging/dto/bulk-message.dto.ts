import { IsArray, IsEnum, IsString, IsObject, IsOptional, IsDateString, ArrayMinSize, ArrayMaxSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { MessageChannel } from '../entities/message.entity';

export class BulkRecipientDto {
  @IsString()
  phone!: string;

  @IsOptional()
  @IsObject()
  variables?: Record<string, string>;
}

export class BulkMessageDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => BulkRecipientDto)
  recipients!: BulkRecipientDto[];

  @IsEnum(MessageChannel)
  channel!: MessageChannel;

  @IsString()
  templateKey!: string;

  @IsOptional()
  @IsObject()
  variables?: Record<string, string>;

  @IsOptional()
  @IsDateString()
  scheduledFor?: string;
}
