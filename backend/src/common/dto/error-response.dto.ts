import { ApiProperty } from '@nestjs/swagger';

/**
 * Standard error response DTO
 * Used for error responses across the API
 */
export class ErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 400,
  })
  statusCode!: number;

  @ApiProperty({
    description: 'Error type/name',
    example: 'Bad Request',
  })
  error!: string;

  @ApiProperty({
    description: 'Detailed error message or array of validation errors',
    oneOf: [
      { type: 'string', example: 'Validation failed' },
      {
        type: 'array',
        items: { type: 'string' },
        example: ['email must be a valid email', 'password is too weak'],
      },
    ],
  })
  message!: string | string[];

  @ApiProperty({
    description: 'ISO 8601 timestamp',
    example: '2025-01-15T10:30:00.000Z',
  })
  timestamp!: string;

  @ApiProperty({
    description: 'API path that generated the error',
    example: '/api/auth/register',
  })
  path!: string;
}
