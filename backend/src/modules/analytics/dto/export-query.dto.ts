import { IsDateString, IsEnum, IsOptional } from 'class-validator';

export enum ExportFormat {
  CSV = 'csv',
  JSON = 'json',
  XLSX = 'xlsx',
}

export enum ExportDataType {
  EVENTS = 'events',
  FUNNEL = 'funnel',
  PROPERTIES = 'properties',
  AGENTS = 'agents',
}

export class ExportQueryDto {
  @IsDateString()
  dateFrom!: string;

  @IsDateString()
  dateTo!: string;

  @IsEnum(ExportFormat)
  format!: ExportFormat;

  @IsOptional()
  @IsEnum(ExportDataType)
  dataType?: ExportDataType;
}
