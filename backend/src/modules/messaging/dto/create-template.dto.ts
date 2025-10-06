import { IsString, IsEnum, IsArray, MinLength, Matches } from 'class-validator';
import { MessageChannel, MessageLanguage } from '../entities/message.entity';
import { TemplateCategory } from '../entities/message-template.entity';

export class CreateTemplateDto {
  @IsString()
  @Matches(/^[a-z0-9_]+$/, { message: 'Template key must be alphanumeric with underscores only' })
  templateKey!: string;

  @IsEnum(MessageChannel)
  channel!: MessageChannel;

  @IsEnum(MessageLanguage)
  language!: MessageLanguage;

  @IsString()
  @MinLength(3)
  name!: string;

  @IsString()
  @MinLength(10)
  content!: string;

  @IsEnum(TemplateCategory)
  category!: TemplateCategory;

  @IsArray()
  variables!: string[];
}
