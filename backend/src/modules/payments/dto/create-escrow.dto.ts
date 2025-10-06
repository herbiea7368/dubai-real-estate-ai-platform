import { IsUUID, IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class CreateEscrowDto {
  @IsUUID()
  propertyId!: string;

  @IsUUID()
  buyerId!: string;

  @IsUUID()
  sellerId!: string;

  @IsUUID()
  @IsOptional()
  agentId?: string;

  @IsNumber()
  @Min(1)
  totalAmount!: number;

  @IsString()
  bankName!: string;

  @IsString()
  bankAccountNumber!: string;

  @IsString()
  @IsOptional()
  iban?: string;
}
