import { IsDateString } from 'class-validator';

export class FunnelQueryDto {
  @IsDateString()
  dateFrom!: string;

  @IsDateString()
  dateTo!: string;
}
