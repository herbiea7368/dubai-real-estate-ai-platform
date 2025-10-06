import { IsUUID, IsOptional, IsNumber, Min } from 'class-validator';

export class RentalEstimateDto {
  @IsUUID()
  propertyId!: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  purchasePrice?: number;
}
