import {
  IsString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsDateString,
  IsInt,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ExecuteReportDto {
  @IsString()
  @IsNotEmpty()
  reportKey!: string;

  @IsObject()
  @IsOptional()
  parameters?: Record<string, any>;

  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @IsObject()
  @IsOptional()
  filters?: Record<string, any>;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @IsInt()
  @Min(1)
  @Max(1000)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 100;
}
