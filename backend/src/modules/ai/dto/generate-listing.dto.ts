import { IsUUID, IsString, IsEnum, IsOptional } from 'class-validator';

export enum Language {
  EN = 'en',
  AR = 'ar',
}

export enum Tone {
  PROFESSIONAL = 'professional',
  LUXURY = 'luxury',
  FAMILY_FRIENDLY = 'family_friendly',
  INVESTMENT = 'investment',
}

export class GenerateListingDto {
  @IsUUID()
  propertyId!: string;

  @IsString()
  trakheesiNumber!: string;

  @IsEnum(Language)
  @IsOptional()
  language?: Language;

  @IsEnum(Tone)
  @IsOptional()
  tone?: Tone;
}
