import { IsString, IsNotEmpty, Matches, IsEnum } from 'class-validator';
import { Market } from '../entities/permit.entity';

export class CheckPermitDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z0-9-]+$/, {
    message: 'Trakheesi number must contain only uppercase letters, numbers, and hyphens',
  })
  trakheesiNumber!: string;

  @IsEnum(Market)
  market!: Market;
}
