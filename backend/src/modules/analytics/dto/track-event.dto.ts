import { IsString, IsOptional, IsObject, IsEnum } from 'class-validator';
import { EventType } from '../entities/analytics-event.entity';

export class TrackEventDto {
  @IsEnum(EventType)
  eventType!: EventType;

  @IsString()
  sessionId!: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @IsString()
  listingId?: string;

  @IsOptional()
  @IsString()
  leadId?: string;

  @IsOptional()
  @IsObject()
  eventData?: Record<string, any>;
}
