import {
  IsDateString,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReportQueryDto {
  @IsDateString()
  dateFrom!: string;

  @IsDateString()
  dateTo!: string;

  @IsUUID()
  @IsOptional()
  agentId?: string;

  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 10;
}
