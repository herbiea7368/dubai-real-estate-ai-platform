import { IsString, IsNotEmpty, Matches, IsEnum, IsDateString } from 'class-validator';
import { PermitType, Market, Issuer } from '../entities/permit.entity';

export class RegisterPermitDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z0-9-]+$/, {
    message: 'Trakheesi number must contain only uppercase letters, numbers, and hyphens',
  })
  trakheesiNumber!: string;

  @IsEnum(PermitType)
  permitType!: PermitType;

  @IsEnum(Market)
  market!: Market;

  @IsEnum(Issuer)
  issuer!: Issuer;

  @IsDateString()
  issueDate!: string;

  @IsDateString()
  expiryDate!: string;
}
