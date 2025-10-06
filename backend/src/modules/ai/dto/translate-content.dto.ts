import { IsString, IsEnum, MaxLength } from 'class-validator';
import { Language } from './generate-listing.dto';

export class TranslateContentDto {
  @IsString()
  @MaxLength(5000)
  text!: string;

  @IsEnum(Language)
  targetLanguage!: Language;
}
