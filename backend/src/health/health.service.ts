import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { HealthCheckDto, ReadinessCheckDto, LivenessCheckDto } from './dto/health.dto';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async getHealthStatus(): Promise<HealthCheckDto> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        external: process.memoryUsage().external,
        rss: process.memoryUsage().rss,
      },
    };
  }

  async checkReadiness(): Promise<ReadinessCheckDto> {
    const checks = {
      database: await this.checkDatabase(),
      opensearch: await this.checkOpenSearch(),
      externalServices: await this.checkExternalServices(),
    };

    const ready = Object.values(checks).every((check) => check);

    return {
      ready,
      timestamp: new Date().toISOString(),
      checks: {
        database: checks.database ? 'healthy' : 'unhealthy',
        opensearch: checks.opensearch ? 'healthy' : 'unhealthy',
        externalServices: checks.externalServices ? 'healthy' : 'unhealthy',
      },
    };
  }

  checkLiveness(): LivenessCheckDto {
    return {
      alive: true,
      timestamp: new Date().toISOString(),
      pid: process.pid,
      uptime: process.uptime(),
    };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1');
      return true;
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return false;
    }
  }

  private async checkOpenSearch(): Promise<boolean> {
    try {
      // Skip OpenSearch check if not configured
      if (!process.env.OPENSEARCH_NODE) {
        return true;
      }

      // TODO: Implement OpenSearch health check when client is available
      // const response = await this.openSearchClient.ping();
      // return response.statusCode === 200;

      return true;
    } catch (error) {
      this.logger.error('OpenSearch health check failed', error);
      return false;
    }
  }

  private async checkExternalServices(): Promise<boolean> {
    try {
      // Check if critical external services are configured
      const criticalServices = [
        process.env.JWT_SECRET,
        process.env.DATABASE_HOST,
      ];

      return criticalServices.every((service) => !!service);
    } catch (error) {
      this.logger.error('External services health check failed', error);
      return false;
    }
  }
}
