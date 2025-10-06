import { IsEnum, IsString, IsNotEmpty } from 'class-validator';

export enum ConsentType {
  WHATSAPP = 'whatsapp',
  SMS = 'sms',
  EMAIL = 'email',
  PHONE = 'phone',
}

export class GrantConsentDto {
  @IsEnum(ConsentType, {
    message: 'consentType must be one of: whatsapp, sms, email, phone',
  })
  consentType!: ConsentType;

  @IsString()
  @IsNotEmpty()
  version!: string;
}
