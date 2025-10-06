import { IsString, IsUUID, IsOptional, IsObject, IsEnum, IsDateString, Matches } from 'class-validator';
import { MessageLanguage } from '../entities/message.entity';

export class SendWhatsAppDto {
  @IsOptional()
  @IsUUID()
  recipientId?: string;

  @IsOptional()
  @Matches(/^\+[1-9][0-9]{7,14}$/, { message: 'Invalid phone number format. Expected international format (+XXXXXXXXXXX)' })
  recipientPhone?: string;

  @IsString()
  templateKey!: string;

  @IsObject()
  variables!: Record<string, string>;

  @IsEnum(MessageLanguage)
  language!: MessageLanguage;

  @IsOptional()
  @IsDateString()
  scheduledFor?: string;

  @IsOptional()
  @IsUUID()
  propertyId?: string;
}
