import { IsString, IsEnum, IsOptional, IsDateString, MinLength, MaxLength } from 'class-validator';
import { MessageType, MessageLanguage } from '../entities/message.entity';

export class SendSMSDto {
  @IsString()
  recipientPhone!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  message!: string;

  @IsEnum(MessageLanguage)
  language!: MessageLanguage;

  @IsEnum(MessageType)
  messageType!: MessageType;

  @IsOptional()
  @IsDateString()
  scheduledFor?: string;
}
