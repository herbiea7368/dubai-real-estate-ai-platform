import { IsNumber, IsEnum, IsDateString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export enum MetricType {
  VIEWS = 'views',
  CONTACTS = 'contacts',
  CONVERSION = 'conversion',
}

export class TopPropertiesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;

  @IsEnum(MetricType)
  metric!: MetricType;

  @IsDateString()
  dateFrom!: string;

  @IsDateString()
  dateTo!: string;
}
