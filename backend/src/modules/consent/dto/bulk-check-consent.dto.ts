import { IsArray, ArrayNotEmpty, IsEnum } from 'class-validator';
import { ConsentType } from './grant-consent.dto';

export class BulkCheckConsentDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(ConsentType, {
    each: true,
    message: 'Each consentType must be one of: whatsapp, sms, email, phone',
  })
  consentTypes!: ConsentType[];
}
