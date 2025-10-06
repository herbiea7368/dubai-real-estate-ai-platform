import { IsNumber, IsString, Min, MinLength } from 'class-validator';

export class RefundPaymentDto {
  @IsNumber()
  @Min(1)
  amount!: number;

  @IsString()
  @MinLength(10)
  reason!: string;
}
