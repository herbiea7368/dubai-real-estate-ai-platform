import { IsString, MinLength, MaxLength } from 'class-validator';

export class AutocompleteDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  q!: string;
}
