import { ApiProperty } from '@nestjs/swagger';

/**
 * Standard success response DTO
 * Used for operations that return a success confirmation
 */
export class SuccessResponseDto {
  @ApiProperty({
    description: 'Indicates successful operation',
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    description: 'Human-readable success message',
    example: 'Operation completed successfully',
  })
  message!: string;

  @ApiProperty({
    description: 'Optional additional data',
    required: false,
    example: { id: 123 },
  })
  data?: any;
}
