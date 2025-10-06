import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { HealthCheckDto, ReadinessCheckDto, LivenessCheckDto } from './dto/health.dto';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Health check endpoint',
    description: 'Returns the overall health status of the application',
  })
  @ApiResponse({
    status: 200,
    description: 'Application is healthy',
    type: HealthCheckDto,
  })
  async check(): Promise<HealthCheckDto> {
    return this.healthService.getHealthStatus();
  }

  @Get('ready')
  @ApiOperation({
    summary: 'Readiness check',
    description: 'Checks if the application is ready to receive traffic (all dependencies are available)',
  })
  @ApiResponse({
    status: 200,
    description: 'Application is ready',
    type: ReadinessCheckDto,
  })
  @ApiResponse({
    status: 503,
    description: 'Application is not ready',
  })
  async ready(): Promise<ReadinessCheckDto> {
    return this.healthService.checkReadiness();
  }

  @Get('live')
  @ApiOperation({
    summary: 'Liveness check',
    description: 'Checks if the application is alive and should not be restarted',
  })
  @ApiResponse({
    status: 200,
    description: 'Application is alive',
    type: LivenessCheckDto,
  })
  live(): LivenessCheckDto {
    return this.healthService.checkLiveness();
  }
}
