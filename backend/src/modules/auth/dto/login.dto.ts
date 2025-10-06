import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Email address or UAE phone number',
    example: 'buyer@example.com',
    oneOf: [
      { type: 'string', format: 'email', example: 'buyer@example.com' },
      { type: 'string', pattern: '^(\\+?971|0)?5[024568]\\d{7}$', example: '+971501234567' },
    ],
  })
  @IsString()
  @IsNotEmpty({ message: 'Email or phone number is required' })
  emailOrPhone!: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePass123!',
    format: 'password',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password!: string;
}
