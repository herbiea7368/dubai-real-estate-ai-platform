import { ApiProperty } from '@nestjs/swagger';

/**
 * Generic paginated response DTO
 * Used for list endpoints with pagination
 */
export class PaginatedResponseDto<T> {
  @ApiProperty({
    description: 'Array of results for the current page',
    isArray: true,
  })
  results!: T[];

  @ApiProperty({
    description: 'Total count of items matching the query',
    example: 150,
  })
  total!: number;

  @ApiProperty({
    description: 'Current page number (1-indexed)',
    example: 1,
    minimum: 1,
  })
  page!: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  limit!: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 8,
  })
  totalPages!: number;

  @ApiProperty({
    description: 'Whether there is a next page',
    example: true,
  })
  hasNext!: boolean;

  @ApiProperty({
    description: 'Whether there is a previous page',
    example: false,
  })
  hasPrevious!: boolean;
}
