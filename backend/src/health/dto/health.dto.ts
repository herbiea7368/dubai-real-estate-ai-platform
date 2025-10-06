import { ApiProperty } from '@nestjs/swagger';

export class HealthCheckDto {
  @ApiProperty({ example: 'ok', description: 'Overall health status' })
  status!: string;

  @ApiProperty({ example: '2025-01-15T10:30:00.000Z', description: 'Timestamp of health check' })
  timestamp!: string;

  @ApiProperty({ example: 3600.5, description: 'Application uptime in seconds' })
  uptime!: number;

  @ApiProperty({ example: 'production', description: 'Current environment' })
  environment!: string;

  @ApiProperty({ example: '1.0.0', description: 'Application version' })
  version!: string;

  @ApiProperty({
    example: {
      used: 50000000,
      total: 100000000,
      external: 1000000,
      rss: 120000000,
    },
    description: 'Memory usage statistics',
  })
  memory!: {
    used: number;
    total: number;
    external: number;
    rss: number;
  };
}

export class ReadinessCheckDto {
  @ApiProperty({ example: true, description: 'Whether the application is ready' })
  ready!: boolean;

  @ApiProperty({ example: '2025-01-15T10:30:00.000Z', description: 'Timestamp of readiness check' })
  timestamp!: string;

  @ApiProperty({
    example: {
      database: 'healthy',
      opensearch: 'healthy',
      externalServices: 'healthy',
    },
    description: 'Status of individual dependencies',
  })
  checks!: {
    database: string;
    opensearch: string;
    externalServices: string;
  };
}

export class LivenessCheckDto {
  @ApiProperty({ example: true, description: 'Whether the application is alive' })
  alive!: boolean;

  @ApiProperty({ example: '2025-01-15T10:30:00.000Z', description: 'Timestamp of liveness check' })
  timestamp!: string;

  @ApiProperty({ example: 12345, description: 'Process ID' })
  pid!: number;

  @ApiProperty({ example: 3600.5, description: 'Application uptime in seconds' })
  uptime!: number;
}
