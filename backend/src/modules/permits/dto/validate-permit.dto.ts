import { IsString, IsNotEmpty, IsUUID, IsEnum } from 'class-validator';
import { Market } from '../entities/permit.entity';

export class ValidatePermitDto {
  @IsString()
  @IsNotEmpty()
  trakheesiNumber!: string;

  @IsUUID()
  propertyId!: string;

  @IsEnum(Market)
  market!: Market;
}
