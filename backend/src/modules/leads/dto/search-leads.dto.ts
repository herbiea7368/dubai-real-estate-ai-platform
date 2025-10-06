import {
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LeadTier, LeadStatus, LeadSource } from '../entities/lead.entity';

export class SearchLeadsDto {
  @IsOptional()
  @IsEnum(LeadTier)
  tier?: LeadTier;

  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @IsOptional()
  @IsUUID()
  assignedTo?: string;

  @IsOptional()
  @IsEnum(LeadSource)
  source?: LeadSource;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
