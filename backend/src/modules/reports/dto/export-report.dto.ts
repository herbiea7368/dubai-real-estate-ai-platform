import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum ExportFormat {
  CSV = 'csv',
  EXCEL = 'excel',
  PDF = 'pdf',
}

export class ExportReportDto {
  @IsEnum(ExportFormat)
  format!: ExportFormat;

  @IsString()
  @IsOptional()
  filename?: string;
}
