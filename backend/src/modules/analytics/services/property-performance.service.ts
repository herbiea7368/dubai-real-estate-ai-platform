import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, IsNull } from 'typeorm';
import { AnalyticsEvent, EventType } from '../entities/analytics-event.entity';
import { MetricType } from '../dto/top-properties-query.dto';

@Injectable()
export class PropertyPerformanceService {
  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly analyticsEventRepository: Repository<AnalyticsEvent>,
  ) {}

  /**
   * Get comprehensive metrics for a property
   */
  async getPropertyMetrics(
    propertyId: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<{
    views: number;
    uniqueVisitors: number;
    contacts: number;
    favorites: number;
    shares: number;
    conversionRate: number;
  }> {
    const whereClause: any = { propertyId };

    if (dateFrom && dateTo) {
      whereClause.timestamp = Between(dateFrom, dateTo);
    }

    // Get all events for this property
    const events = await this.analyticsEventRepository.find({
      where: whereClause,
    });

    // Count views
    const views = events.filter((e) => e.eventType === EventType.PROPERTY_VIEW).length;

    // Count unique visitors (unique sessionIds)
    const uniqueSessions = new Set(events.map((e) => e.sessionId));
    const uniqueVisitors = uniqueSessions.size;

    // Count contact events
    const contactEvents = [EventType.WHATSAPP_CLICK, EventType.CALL_CLICK, EventType.EMAIL_CLICK];
    const contacts = events.filter((e) => contactEvents.includes(e.eventType)).length;

    // Count favorites
    const favorites = events.filter((e) => e.eventType === EventType.FAVORITE_ADD).length;

    // Count shares
    const shares = events.filter((e) => e.eventType === EventType.SHARE_CLICK).length;

    // Calculate conversion rate
    const conversionRate = views > 0 ? Math.round((contacts / views) * 10000) / 100 : 0;

    return {
      views,
      uniqueVisitors,
      contacts,
      favorites,
      shares,
      conversionRate,
    };
  }

  /**
   * Get top performing properties
   */
  async getTopPerformingProperties(
    limit: number,
    metric: MetricType,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<
    Array<{
      propertyId: string;
      value: number;
      views: number;
      contacts: number;
      conversionRate: number;
    }>
  > {
    const events = await this.analyticsEventRepository.find({
      where: {
        timestamp: Between(dateFrom, dateTo),
        propertyId: Not(IsNull()),
      },
    });

    // Group events by property
    const propertiesMap: Record<
      string,
      { views: number; contacts: number; propertyId: string }
    > = {};

    events.forEach((event) => {
      if (!event.propertyId) return;

      if (!propertiesMap[event.propertyId]) {
        propertiesMap[event.propertyId] = {
          propertyId: event.propertyId,
          views: 0,
          contacts: 0,
        };
      }

      if (event.eventType === EventType.PROPERTY_VIEW) {
        propertiesMap[event.propertyId].views++;
      }

      if ([EventType.WHATSAPP_CLICK, EventType.CALL_CLICK, EventType.EMAIL_CLICK].includes(event.eventType)) {
        propertiesMap[event.propertyId].contacts++;
      }
    });

    // Calculate metrics and sort
    const properties = Object.values(propertiesMap).map((prop) => {
      const conversionRate = prop.views > 0 ? (prop.contacts / prop.views) * 100 : 0;

      let value = 0;
      if (metric === MetricType.VIEWS) value = prop.views;
      if (metric === MetricType.CONTACTS) value = prop.contacts;
      if (metric === MetricType.CONVERSION) value = conversionRate;

      return {
        ...prop,
        conversionRate: Math.round(conversionRate * 100) / 100,
        value,
      };
    });

    // Sort and limit
    properties.sort((a, b) => b.value - a.value);
    return properties.slice(0, limit);
  }

  /**
   * Get property engagement score
   */
  async getPropertyEngagement(
    propertyId: string,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<{
    score: number;
    breakdown: {
      views: number;
      favorites: number;
      shares: number;
      contacts: number;
    };
  }> {
    const events = await this.analyticsEventRepository.find({
      where: {
        propertyId,
        timestamp: Between(dateFrom, dateTo),
      },
    });

    const breakdown = {
      views: 0,
      favorites: 0,
      shares: 0,
      contacts: 0,
    };

    let score = 0;

    events.forEach((event) => {
      switch (event.eventType) {
        case EventType.PROPERTY_VIEW:
          breakdown.views++;
          score += 1;
          break;
        case EventType.FAVORITE_ADD:
          breakdown.favorites++;
          score += 3;
          break;
        case EventType.SHARE_CLICK:
          breakdown.shares++;
          score += 2;
          break;
        case EventType.WHATSAPP_CLICK:
        case EventType.CALL_CLICK:
        case EventType.EMAIL_CLICK:
          breakdown.contacts++;
          score += 5;
          break;
      }
    });

    return { score, breakdown };
  }
}
