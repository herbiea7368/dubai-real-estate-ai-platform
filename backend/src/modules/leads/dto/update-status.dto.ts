import { IsEnum, IsOptional, IsString } from 'class-validator';
import { LeadStatus } from '../entities/lead.entity';

export class UpdateStatusDto {
  @IsEnum(LeadStatus)
  status!: LeadStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
