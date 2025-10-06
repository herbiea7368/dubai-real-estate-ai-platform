import { IsString, IsNotEmpty } from 'class-validator';

export class ValidateContentDto {
  @IsString()
  @IsNotEmpty()
  text!: string;
}
