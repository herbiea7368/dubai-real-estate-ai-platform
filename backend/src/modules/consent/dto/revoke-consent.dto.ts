import { IsEnum } from 'class-validator';
import { ConsentType } from './grant-consent.dto';

export class RevokeConsentDto {
  @IsEnum(ConsentType, {
    message: 'consentType must be one of: whatsapp, sms, email, phone',
  })
  consentType!: ConsentType;
}
