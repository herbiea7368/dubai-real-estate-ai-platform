import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { AnalyticsEvent, EventType } from '../../analytics/entities/analytics-event.entity';

export interface SearchEvent {
  query: string;
  filters?: any;
  resultsCount: number;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
}

export interface PopularSearch {
  query: string;
  count: number;
}

export interface ZeroResultSearch {
  query: string;
  count: number;
  lastSearched: Date;
}

@Injectable()
export class SearchAnalyticsService {
  private readonly logger = new Logger(SearchAnalyticsService.name);

  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly analyticsRepository: Repository<AnalyticsEvent>,
  ) {}

  async trackSearch(
    query: string,
    filters: any,
    resultsCount: number,
    userId?: string,
    sessionId?: string,
  ): Promise<AnalyticsEvent> {
    try {
      const event = this.analyticsRepository.create({
        eventType: EventType.SEARCH,
        userId,
        sessionId: sessionId || '',
        eventData: {
          query,
          filters,
          resultsCount,
          isZeroResults: resultsCount === 0,
          eventName: resultsCount === 0 ? 'search_zero_results' : 'search_performed',
        },
      });

      await this.analyticsRepository.save(event);

      this.logger.log(
        `Tracked search: "${query}" - ${resultsCount} results (user: ${userId || 'anonymous'})`,
      );

      return event;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to track search: ${errorMessage}`);
      throw error;
    }
  }

  async getPopularSearches(
    timeframe: '7d' | '30d' = '7d',
    limit: number = 20,
  ): Promise<PopularSearch[]> {
    try {
      const daysAgo = timeframe === '7d' ? 7 : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const results = await this.analyticsRepository
        .createQueryBuilder('event')
        .select("event.eventData->>'query'", 'query')
        .addSelect('COUNT(*)', 'count')
        .where('event.eventType = :eventType', { eventType: EventType.SEARCH })
        .andWhere('event.timestamp >= :startDate', { startDate })
        .andWhere("event.eventData->>'query' IS NOT NULL")
        .andWhere("event.eventData->>'query' != ''")
        .groupBy("event.eventData->>'query'")
        .orderBy('count', 'DESC')
        .limit(limit)
        .getRawMany();

      return results.map((result) => ({
        query: result.query,
        count: parseInt(result.count),
      }));
    } catch (error) {
      this.logger.error(`Failed to get popular searches: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  async getZeroResultSearches(
    timeframe: '7d' | '30d' = '7d',
    limit: number = 20,
  ): Promise<ZeroResultSearch[]> {
    try {
      const daysAgo = timeframe === '7d' ? 7 : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const results = await this.analyticsRepository
        .createQueryBuilder('event')
        .select("event.eventData->>'query'", 'query')
        .addSelect('COUNT(*)', 'count')
        .addSelect('MAX(event.timestamp)', 'lastSearched')
        .where('event.eventType = :eventType', { eventType: EventType.SEARCH })
        .andWhere("event.eventData->>'eventName' = :eventName", { eventName: 'search_zero_results' })
        .andWhere('event.timestamp >= :startDate', { startDate })
        .andWhere("event.eventData->>'query' IS NOT NULL")
        .andWhere("event.eventData->>'query' != ''")
        .groupBy("event.eventData->>'query'")
        .orderBy('count', 'DESC')
        .limit(limit)
        .getRawMany();

      return results.map((result) => ({
        query: result.query,
        count: parseInt(result.count),
        lastSearched: new Date(result.lastSearched),
      }));
    } catch (error) {
      this.logger.error(`Failed to get zero result searches: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  async getSearchToContactRate(
    timeframe: '7d' | '30d' = '7d',
  ): Promise<{ rate: number; totalSearches: number; totalContacts: number }> {
    try {
      const daysAgo = timeframe === '7d' ? 7 : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Get total searches
      const totalSearches = await this.analyticsRepository.count({
        where: {
          eventType: EventType.SEARCH,
          timestamp: MoreThan(startDate),
        },
      });

      // Get sessions that had both search and contact events
      const searchSessions = await this.analyticsRepository
        .createQueryBuilder('event')
        .select('DISTINCT event.sessionId', 'sessionId')
        .where('event.eventType = :eventType', { eventType: EventType.SEARCH })
        .andWhere('event.timestamp >= :startDate', { startDate })
        .andWhere('event.sessionId IS NOT NULL')
        .getRawMany();

      const sessionIds = searchSessions.map((s) => s.sessionId);

      if (sessionIds.length === 0) {
        return { rate: 0, totalSearches, totalContacts: 0 };
      }

      // Get contact events from those sessions
      const totalContacts = await this.analyticsRepository.count({
        where: {
          eventType: EventType.CONTACT_CLICK,
          sessionId: sessionIds.length > 0 ? sessionIds[0] : '',
          timestamp: MoreThan(startDate),
        },
      });

      const rate = totalSearches > 0 ? (totalContacts / totalSearches) * 100 : 0;

      return {
        rate: parseFloat(rate.toFixed(2)),
        totalSearches,
        totalContacts,
      };
    } catch (error) {
      this.logger.error(`Failed to get search to contact rate: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  async getSearchMetrics(
    timeframe: '7d' | '30d' = '7d',
  ): Promise<{
    totalSearches: number;
    uniqueQueries: number;
    avgResultsPerSearch: number;
    zeroResultRate: number;
  }> {
    try {
      const daysAgo = timeframe === '7d' ? 7 : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const totalSearches = await this.analyticsRepository.count({
        where: {
          eventType: EventType.SEARCH,
          timestamp: MoreThan(startDate),
        },
      });

      const uniqueQueries = await this.analyticsRepository
        .createQueryBuilder('event')
        .select("COUNT(DISTINCT event.eventData->>'query')", 'count')
        .where('event.eventType = :eventType', { eventType: EventType.SEARCH })
        .andWhere('event.timestamp >= :startDate', { startDate })
        .getRawOne();

      const avgResults = await this.analyticsRepository
        .createQueryBuilder('event')
        .select("AVG((event.eventData->>'resultsCount')::int)", 'avg')
        .where('event.eventType = :eventType', { eventType: EventType.SEARCH })
        .andWhere('event.timestamp >= :startDate', { startDate })
        .andWhere("event.eventData->>'resultsCount' IS NOT NULL")
        .getRawOne();

      const zeroResults = await this.analyticsRepository
        .createQueryBuilder('event')
        .where('event.eventType = :eventType', { eventType: EventType.SEARCH })
        .andWhere("event.eventData->>'eventName' = :eventName", { eventName: 'search_zero_results' })
        .andWhere('event.timestamp >= :startDate', { startDate })
        .getCount();

      const zeroResultRate = totalSearches > 0 ? (zeroResults / totalSearches) * 100 : 0;

      return {
        totalSearches,
        uniqueQueries: parseInt(uniqueQueries?.count || '0'),
        avgResultsPerSearch: parseFloat(avgResults?.avg || '0'),
        zeroResultRate: parseFloat(zeroResultRate.toFixed(2)),
      };
    } catch (error) {
      this.logger.error(`Failed to get search metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  async getTopFilters(timeframe: '7d' | '30d' = '7d'): Promise<any> {
    try {
      const daysAgo = timeframe === '7d' ? 7 : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const events = await this.analyticsRepository.find({
        where: {
          eventType: EventType.SEARCH,
          timestamp: MoreThan(startDate),
        },
        select: ['eventData'],
      });

      const filterCounts: any = {
        type: {},
        purpose: {},
        community: {},
        bedrooms: {},
        priceRange: {},
      };

      events.forEach((event) => {
        const filters = event.eventData?.filters || {};

        if (filters.type) {
          filterCounts.type[filters.type] =
            (filterCounts.type[filters.type] || 0) + 1;
        }
        if (filters.purpose) {
          filterCounts.purpose[filters.purpose] =
            (filterCounts.purpose[filters.purpose] || 0) + 1;
        }
        if (filters.community) {
          filterCounts.community[filters.community] =
            (filterCounts.community[filters.community] || 0) + 1;
        }
        if (filters.beds !== undefined) {
          filterCounts.bedrooms[filters.beds] =
            (filterCounts.bedrooms[filters.beds] || 0) + 1;
        }
      });

      return filterCounts;
    } catch (error) {
      this.logger.error(`Failed to get top filters: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
}
