import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AnalyticsEvent } from '../entities/analytics-event.entity';
import { FunnelAnalysisService } from './funnel-analysis.service';
import { PropertyPerformanceService } from './property-performance.service';
import { MetricType } from '../dto/top-properties-query.dto';
import { AgentPerformanceService } from './agent-performance.service';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly analyticsEventRepository: Repository<AnalyticsEvent>,
    private readonly funnelAnalysisService: FunnelAnalysisService,
    private readonly propertyPerformanceService: PropertyPerformanceService,
    private readonly agentPerformanceService: AgentPerformanceService,
  ) {}

  /**
   * Get overview dashboard metrics
   */
  async getOverviewDashboard(
    dateFrom: Date,
    dateTo: Date,
  ): Promise<{
    searches: number;
    propertyViews: number;
    contacts: number;
    activeUsers: number;
    conversionRate: number;
    topCommunities: Array<{ community: string; count: number }>;
  }> {
    const events = await this.analyticsEventRepository.find({
      where: {
        timestamp: Between(dateFrom, dateTo),
      },
    });

    // Count event types
    const searches = events.filter((e) => e.eventType === 'search').length;
    const propertyViews = events.filter((e) => e.eventType === 'property_view').length;
    const contactEvents = ['whatsapp_click', 'call_click', 'email_click'];
    const contacts = events.filter((e) => contactEvents.includes(e.eventType)).length;

    // Count unique sessions (active users)
    const uniqueSessions = new Set(events.map((e) => e.sessionId));
    const activeUsers = uniqueSessions.size;

    // Calculate conversion rate
    const conversionRate =
      propertyViews > 0 ? Math.round((contacts / propertyViews) * 10000) / 100 : 0;

    // For top communities, we would need to join with properties
    // Simplified version for now
    const topCommunities: Array<{ community: string; count: number }> = [];

    return {
      searches,
      propertyViews,
      contacts,
      activeUsers,
      conversionRate,
      topCommunities,
    };
  }

  /**
   * Get marketing dashboard metrics
   */
  async getMarketingDashboard(
    dateFrom: Date,
    dateTo: Date,
  ): Promise<{
    funnelMetrics: any;
    topProperties: any[];
    channelPerformance: Array<{ source: string; views: number; conversions: number }>;
  }> {
    // Get funnel metrics
    const funnelMetrics = await this.funnelAnalysisService.calculateFunnelMetrics(
      dateFrom,
      dateTo,
    );

    // Get top performing properties
    const topProperties = await this.propertyPerformanceService.getTopPerformingProperties(
      5,
      MetricType.VIEWS,
      dateFrom,
      dateTo,
    );

    // Get channel performance
    const events = await this.analyticsEventRepository.find({
      where: {
        timestamp: Between(dateFrom, dateTo),
      },
    });

    // Group by source
    const sourceMap: Record<string, { views: number; conversions: number }> = {};

    events.forEach((event) => {
      const source = (event.eventData as any)?.source || 'direct';

      if (!sourceMap[source]) {
        sourceMap[source] = { views: 0, conversions: 0 };
      }

      if (event.eventType === 'property_view') {
        sourceMap[source].views++;
      }

      if (['whatsapp_click', 'call_click', 'email_click'].includes(event.eventType)) {
        sourceMap[source].conversions++;
      }
    });

    const channelPerformance = Object.entries(sourceMap).map(([source, data]) => ({
      source,
      ...data,
    }));

    return {
      funnelMetrics,
      topProperties,
      channelPerformance,
    };
  }

  /**
   * Get agent-specific dashboard
   */
  async getAgentDashboard(
    agentId: string,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<{
    agentMetrics: any;
    pipeline: {
      new: number;
      contacted: number;
      qualified: number;
      converted: number;
    };
    teamAverage: any;
  }> {
    // Get agent metrics
    const agentMetrics = await this.agentPerformanceService.getAgentMetrics(
      agentId,
      dateFrom,
      dateTo,
    );

    // Pipeline status (simplified - would need LeadService)
    const pipeline = {
      new: 0,
      contacted: 0,
      qualified: 0,
      converted: 0,
    };

    // Team average (simplified)
    const teamAverage = {
      conversionRate: 0,
      avgResponseTime: 0,
    };

    return {
      agentMetrics,
      pipeline,
      teamAverage,
    };
  }
}
