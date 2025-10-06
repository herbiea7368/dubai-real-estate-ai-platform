import { IsNumber, IsEnum, IsUUID, IsOptional, IsUrl, Min } from 'class-validator';
import { PaymentType, PaymentMethod, PaymentGateway } from '../entities/payment.entity';

export class InitiatePaymentDto {
  @IsNumber()
  @Min(1)
  amount!: number;

  @IsEnum(PaymentType)
  paymentType!: PaymentType;

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @IsEnum(PaymentGateway)
  gateway!: PaymentGateway;

  @IsUUID()
  propertyId!: string;

  @IsUUID()
  @IsOptional()
  leadId?: string;

  @IsUrl()
  @IsOptional()
  returnUrl?: string;
}
