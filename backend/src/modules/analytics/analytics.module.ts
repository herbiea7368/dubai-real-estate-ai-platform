import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsEvent } from './entities/analytics-event.entity';
import { FunnelStage } from './entities/funnel-stage.entity';
import { EventTrackingService } from './services/event-tracking.service';
import { FunnelAnalysisService } from './services/funnel-analysis.service';
import { PropertyPerformanceService } from './services/property-performance.service';
import { AgentPerformanceService } from './services/agent-performance.service';
import { DashboardService } from './services/dashboard.service';
import { AnalyticsController } from './analytics.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AnalyticsEvent, FunnelStage])],
  controllers: [AnalyticsController],
  providers: [
    EventTrackingService,
    FunnelAnalysisService,
    PropertyPerformanceService,
    AgentPerformanceService,
    DashboardService,
  ],
  exports: [
    EventTrackingService,
    FunnelAnalysisService,
    PropertyPerformanceService,
    AgentPerformanceService,
    DashboardService,
  ],
})
export class AnalyticsModule {}
