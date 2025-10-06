import { IsDateString, IsOptional } from 'class-validator';

export class PropertyMetricsQueryDto {
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
