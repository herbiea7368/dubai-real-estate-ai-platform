import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { MarketData } from '../entities/market-data.entity';
import { PropertyType } from '../../properties/entities/property.entity';

@Injectable()
export class MarketDataService {
  constructor(
    @InjectRepository(MarketData)
    private readonly marketDataRepository: Repository<MarketData>,
  ) {}

  /**
   * Get latest market data for a community and property type
   */
  async getMarketData(
    community: string,
    propertyType: PropertyType | string,
  ): Promise<MarketData | null> {
    return await this.marketDataRepository.findOne({
      where: {
        community,
        propertyType: propertyType as PropertyType,
      },
      order: {
        dataDate: 'DESC',
      },
    });
  }

  /**
   * Update market data (compliance role only)
   */
  async updateMarketData(data: {
    community: string;
    propertyType: PropertyType | string;
    avgPriceSqft: number;
    avgRentSqft?: number;
    transactionCount: number;
    priceChangeYoY?: number;
    dataDate: Date | string;
    source: string;
  }): Promise<MarketData> {
    const marketData = this.marketDataRepository.create();
    marketData.community = data.community;
    marketData.propertyType = data.propertyType as PropertyType;
    marketData.avgPriceSqft = data.avgPriceSqft;
    marketData.avgRentSqft = data.avgRentSqft || 0;
    marketData.transactionCount = data.transactionCount;
    marketData.priceChangeYoY = data.priceChangeYoY || 0;
    marketData.dataDate = typeof data.dataDate === 'string' ? new Date(data.dataDate) : data.dataDate;
    marketData.source = data.source;

    return await this.marketDataRepository.save(marketData);
  }

  /**
   * Get market trends for a community over time
   */
  async getMarketTrends(
    community: string,
    propertyType: PropertyType | string,
    monthsBack: number = 12,
  ): Promise<MarketData[]> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsBack);

    return await this.marketDataRepository.find({
      where: {
        community,
        propertyType: propertyType as PropertyType,
        dataDate: MoreThanOrEqual(startDate),
      },
      order: {
        dataDate: 'ASC',
      },
    });
  }

  /**
   * Get market statistics across all communities
   */
  async getMarketStatistics(
    propertyType?: PropertyType | string,
  ): Promise<{
    avgPriceSqft: number;
    minPriceSqft: number;
    maxPriceSqft: number;
    totalTransactions: number;
    communitiesCount: number;
  }> {
    const queryBuilder = this.marketDataRepository
      .createQueryBuilder('market_data')
      .select('AVG(market_data.avgPriceSqft)', 'avgPriceSqft')
      .addSelect('MIN(market_data.avgPriceSqft)', 'minPriceSqft')
      .addSelect('MAX(market_data.avgPriceSqft)', 'maxPriceSqft')
      .addSelect('SUM(market_data.transactionCount)', 'totalTransactions')
      .addSelect('COUNT(DISTINCT market_data.community)', 'communitiesCount');

    if (propertyType) {
      queryBuilder.where('market_data.propertyType = :propertyType', {
        propertyType,
      });
    }

    // Get latest data only
    queryBuilder.andWhere(
      `market_data.dataDate >= :threeMonthsAgo`,
      {
        threeMonthsAgo: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      },
    );

    const result = await queryBuilder.getRawOne();

    return {
      avgPriceSqft: parseFloat(result.avgPriceSqft) || 0,
      minPriceSqft: parseFloat(result.minPriceSqft) || 0,
      maxPriceSqft: parseFloat(result.maxPriceSqft) || 0,
      totalTransactions: parseInt(result.totalTransactions) || 0,
      communitiesCount: parseInt(result.communitiesCount) || 0,
    };
  }

  /**
   * Get top performing communities by price growth
   */
  async getTopPerformingCommunities(
    propertyType: PropertyType | string,
    limit: number = 10,
  ): Promise<MarketData[]> {
    return await this.marketDataRepository.find({
      where: {
        propertyType: propertyType as PropertyType,
      },
      order: {
        priceChangeYoY: 'DESC',
        dataDate: 'DESC',
      },
      take: limit,
    });
  }

  /**
   * Calculate year-over-year change for community
   */
  async calculateYoYChange(
    community: string,
    propertyType: PropertyType | string,
  ): Promise<number | null> {
    const currentData = await this.getMarketData(community, propertyType);
    if (!currentData) return null;

    const oneYearAgo = new Date(currentData.dataDate);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const historicalData = await this.marketDataRepository.findOne({
      where: {
        community,
        propertyType: propertyType as PropertyType,
        dataDate: LessThanOrEqual(oneYearAgo),
      },
      order: {
        dataDate: 'DESC',
      },
    });

    if (!historicalData) return null;

    const change =
      ((currentData.avgPriceSqft - historicalData.avgPriceSqft) /
        historicalData.avgPriceSqft) *
      100;

    return parseFloat(change.toFixed(2));
  }

  /**
   * Bulk update market data from external source
   */
  async bulkUpdateMarketData(
    dataArray: Array<{
      community: string;
      propertyType: PropertyType | string;
      avgPriceSqft: number;
      avgRentSqft?: number;
      transactionCount: number;
      priceChangeYoY?: number;
      dataDate: Date | string;
      source: string;
    }>,
  ): Promise<MarketData[]> {
    const marketDataEntities = dataArray.map(data => {
      const entity = this.marketDataRepository.create();
      entity.community = data.community;
      entity.propertyType = data.propertyType as PropertyType;
      entity.avgPriceSqft = data.avgPriceSqft;
      entity.avgRentSqft = data.avgRentSqft || 0;
      entity.transactionCount = data.transactionCount;
      entity.priceChangeYoY = data.priceChangeYoY || 0;
      entity.dataDate = typeof data.dataDate === 'string' ? new Date(data.dataDate) : data.dataDate;
      entity.source = data.source;
      return entity;
    });

    return await this.marketDataRepository.save(marketDataEntities);
  }

  /**
   * Get communities with highest transaction volumes
   */
  async getMostActiveMarkets(
    propertyType?: PropertyType | string,
    limit: number = 10,
  ): Promise<{
    community: string;
    totalTransactions: number;
    avgPriceSqft: number;
  }[]> {
    const queryBuilder = this.marketDataRepository
      .createQueryBuilder('market_data')
      .select('market_data.community', 'community')
      .addSelect('SUM(market_data.transactionCount)', 'totalTransactions')
      .addSelect('AVG(market_data.avgPriceSqft)', 'avgPriceSqft')
      .groupBy('market_data.community')
      .orderBy('totalTransactions', 'DESC')
      .limit(limit);

    if (propertyType) {
      queryBuilder.where('market_data.propertyType = :propertyType', {
        propertyType,
      });
    }

    // Recent data only (last 3 months)
    queryBuilder.andWhere(
      `market_data.dataDate >= :threeMonthsAgo`,
      {
        threeMonthsAgo: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      },
    );

    const results = await queryBuilder.getRawMany();

    return results.map(r => ({
      community: r.community,
      totalTransactions: parseInt(r.totalTransactions) || 0,
      avgPriceSqft: parseFloat(r.avgPriceSqft) || 0,
    }));
  }
}
