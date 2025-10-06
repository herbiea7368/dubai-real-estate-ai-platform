import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { EventTrackingService } from './services/event-tracking.service';
import { FunnelAnalysisService } from './services/funnel-analysis.service';
import { PropertyPerformanceService } from './services/property-performance.service';
import { AgentPerformanceService } from './services/agent-performance.service';
import { TrackEventDto } from './dto/track-event.dto';
import { FunnelQueryDto } from './dto/funnel-query.dto';
import { PropertyMetricsQueryDto } from './dto/property-metrics-query.dto';
import { TopPropertiesQueryDto } from './dto/top-properties-query.dto';
import { ExportQueryDto } from './dto/export-query.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly eventTrackingService: EventTrackingService,
    private readonly funnelAnalysisService: FunnelAnalysisService,
    private readonly propertyPerformanceService: PropertyPerformanceService,
    private readonly agentPerformanceService: AgentPerformanceService,
  ) {}

  /**
   * Track analytics event
   * POST /analytics/track
   */
  @Post('track')
  async trackEvent(@Body() trackEventDto: TrackEventDto, @Req() request: Request) {
    const event = await this.eventTrackingService.trackEvent(
      trackEventDto.eventType,
      trackEventDto.sessionId,
      trackEventDto.userId,
      trackEventDto.propertyId,
      trackEventDto.listingId,
      trackEventDto.leadId,
      trackEventDto.eventData,
      request,
    );

    return {
      success: true,
      event,
    };
  }

  /**
   * Get funnel conversion metrics
   * GET /analytics/funnel
   */
  @Get('funnel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  async getFunnelMetrics(@Query() query: FunnelQueryDto) {
    const dateFrom = new Date(query.dateFrom);
    const dateTo = new Date(query.dateTo);

    const metrics = await this.funnelAnalysisService.calculateFunnelMetrics(
      dateFrom,
      dateTo,
    );

    return {
      success: true,
      metrics,
    };
  }

  /**
   * Get funnel dropoff points
   * GET /analytics/funnel/dropoffs
   */
  @Get('funnel/dropoffs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  async getFunnelDropoffs(@Query() query: FunnelQueryDto) {
    const dateFrom = new Date(query.dateFrom);
    const dateTo = new Date(query.dateTo);

    const dropoffs = await this.funnelAnalysisService.getFunnelDropoffs(dateFrom, dateTo);

    return {
      success: true,
      dropoffs,
    };
  }

  /**
   * Get property performance metrics
   * GET /analytics/property/:propertyId
   */
  @Get('property/:propertyId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  async getPropertyMetrics(
    @Param('propertyId') propertyId: string,
    @Query() query: PropertyMetricsQueryDto,
  ) {
    const dateFrom = query.dateFrom ? new Date(query.dateFrom) : undefined;
    const dateTo = query.dateTo ? new Date(query.dateTo) : undefined;

    const metrics = await this.propertyPerformanceService.getPropertyMetrics(
      propertyId,
      dateFrom,
      dateTo,
    );

    return {
      success: true,
      propertyId,
      metrics,
    };
  }

  /**
   * Get top performing properties
   * GET /analytics/properties/top
   */
  @Get('properties/top')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  async getTopProperties(@Query() query: TopPropertiesQueryDto) {
    const dateFrom = new Date(query.dateFrom);
    const dateTo = new Date(query.dateTo);

    const properties = await this.propertyPerformanceService.getTopPerformingProperties(
      query.limit || 10,
      query.metric,
      dateFrom,
      dateTo,
    );

    return {
      success: true,
      properties,
    };
  }

  /**
   * Get agent performance metrics
   * GET /analytics/agent/:agentId
   */
  @Get('agent/:agentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  async getAgentMetrics(@Param('agentId') agentId: string, @Query() query: FunnelQueryDto) {
    const dateFrom = new Date(query.dateFrom);
    const dateTo = new Date(query.dateTo);

    const metrics = await this.agentPerformanceService.getAgentMetrics(
      agentId,
      dateFrom,
      dateTo,
    );

    const responseTime = await this.agentPerformanceService.getAgentResponseTimes(
      agentId,
      dateFrom,
      dateTo,
    );

    return {
      success: true,
      agentId,
      metrics,
      responseTime,
    };
  }

  /**
   * Get agent leaderboard
   * GET /analytics/agents/leaderboard
   */
  @Get('agents/leaderboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAgentLeaderboard(@Query() query: TopPropertiesQueryDto) {
    const dateFrom = new Date(query.dateFrom);
    const dateTo = new Date(query.dateTo);

    const leaderboard = await this.agentPerformanceService.getTopAgents(
      query.limit || 10,
      query.metric as any,
      dateFrom,
      dateTo,
    );

    return {
      success: true,
      leaderboard,
    };
  }

  /**
   * Get session event timeline
   * GET /analytics/session/:sessionId
   */
  @Get('session/:sessionId')
  async getSessionEvents(@Param('sessionId') sessionId: string) {
    const events = await this.eventTrackingService.getSessionEvents(sessionId);

    return {
      success: true,
      sessionId,
      events,
      count: events.length,
    };
  }

  /**
   * Export analytics data
   * GET /analytics/export
   */
  @Get('export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async exportAnalytics(@Query() query: ExportQueryDto) {
    // Note: This is a simplified version
    // Full implementation would generate CSV/XLSX files
    const dateFrom = new Date(query.dateFrom);
    const dateTo = new Date(query.dateTo);

    return {
      success: true,
      message: 'Export functionality to be implemented',
      format: query.format,
      dataType: query.dataType,
      dateRange: { dateFrom, dateTo },
    };
  }
}
