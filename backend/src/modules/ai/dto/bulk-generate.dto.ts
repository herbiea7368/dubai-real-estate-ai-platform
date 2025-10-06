import { IsUUID, IsEnum, IsOptional, IsArray, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Language, Tone } from './generate-listing.dto';

export class BulkGenerateDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsUUID('4', { each: true })
  propertyIds!: string[];

  @IsEnum(Language)
  @IsOptional()
  language?: Language;

  @IsEnum(Tone)
  @IsOptional()
  tone?: Tone;
}
