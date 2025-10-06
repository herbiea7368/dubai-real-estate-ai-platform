import { IsUUID, IsNumber, IsEnum, IsDateString, IsInt, Min, Max } from 'class-validator';
import { InstallmentFrequency } from '../entities/installment-plan.entity';

export class CreateInstallmentDto {
  @IsUUID()
  propertyId!: string;

  @IsUUID()
  leadId!: string;

  @IsNumber()
  @Min(1)
  totalAmount!: number;

  @IsNumber()
  @Min(0)
  downPaymentAmount!: number;

  @IsInt()
  @Min(1)
  @Max(120)
  installmentCount!: number;

  @IsEnum(InstallmentFrequency)
  frequency!: InstallmentFrequency;

  @IsDateString()
  startDate!: string;
}
