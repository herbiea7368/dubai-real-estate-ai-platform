import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from '../../properties/entities/property.entity';
import { Valuation, ConfidenceLevel, ValuationMethod } from '../entities/valuation.entity';
import { FeatureEngineeringService } from './feature-engineering.service';
import { ComparablesService } from './comparables.service';
import { MarketDataService } from './market-data.service';

@Injectable()
export class ValuationEngineService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    @InjectRepository(Valuation)
    private readonly valuationRepository: Repository<Valuation>,
    private readonly featureService: FeatureEngineeringService,
    private readonly comparablesService: ComparablesService,
    private readonly marketDataService: MarketDataService,
  ) {}

  /**
   * Estimate property value using comparative method
   */
  async estimateValue(
    propertyIdOrData: string | any,
    requestedBy: string,
  ): Promise<Valuation> {
    // Get property data
    let propertyData: Property | any;

    if (typeof propertyIdOrData === 'string') {
      propertyData = await this.propertyRepository.findOne({
        where: { id: propertyIdOrData },
      });

      if (!propertyData) {
        throw new Error('Property not found');
      }
    } else {
      propertyData = propertyIdOrData;
    }

    // Extract features
    const features = this.featureService.extractFeatures(propertyData);
    const normalizedFeatures = this.featureService.normalizeFeatures(features);

    // Find comparable properties
    const comparables = await this.comparablesService.findComparables(propertyData, 10);

    if (comparables.length === 0) {
      throw new Error('No comparable properties found for valuation');
    }

    // Calculate weighted average based on similarity scores
    let weightedSum = 0;
    let totalWeight = 0;

    comparables.forEach(comp => {
      weightedSum += comp.adjustedPrice * comp.similarityScore;
      totalWeight += comp.similarityScore;
    });

    const estimatedValue = totalWeight > 0 ? weightedSum / totalWeight : 0;

    // Calculate confidence interval
    const confidenceData = this.calculateConfidenceInterval(
      estimatedValue,
      comparables,
    );

    // Determine confidence level
    const avgSimilarity = comparables.reduce((sum, c) => sum + c.similarityScore, 0) / comparables.length;
    const confidenceLevel = this.determineConfidenceLevel(
      comparables.length,
      avgSimilarity,
    );

    // Calculate price per sqft
    const pricePerSqft = estimatedValue / (propertyData.areaSqft || 1);

    // Get market data
    const marketData = await this.marketDataService.getMarketData(
      propertyData.community,
      propertyData.type,
    );

    // Estimate rental value and yield
    const estimatedRent = await this.estimateRentalValue(
      propertyData,
      estimatedValue,
    );
    const grossYield = this.calculateGrossYield(estimatedValue, estimatedRent);

    // Calculate MAE (using historical data if available)
    const mae = await this.calculateMAE(propertyData, comparables);

    // Create valuation record
    const valuation = this.valuationRepository.create();
    valuation.propertyId = typeof propertyIdOrData === 'string' ? propertyIdOrData : '';
    valuation.estimatedValueAed = estimatedValue;
    valuation.confidenceLowAed = confidenceData.low;
    valuation.confidenceHighAed = confidenceData.high;
    valuation.confidenceLevel = confidenceLevel;
    valuation.valuationMethod = ValuationMethod.COMPARATIVE;
    valuation.comparableProperties = comparables.map(c => ({
      propertyId: c.propertyId,
      similarityScore: c.similarityScore,
      price: c.price,
      adjustedPrice: c.adjustedPrice,
    }));
    valuation.features = normalizedFeatures;
    valuation.marketFactors = marketData ? {
      avgPriceSqft: marketData.avgPriceSqft,
      marketTrend: marketData.priceChangeYoY > 0 ? 'up' : marketData.priceChangeYoY < 0 ? 'down' : 'stable',
      transactionVolume: marketData.transactionCount,
    } : {
      avgPriceSqft: 0,
      marketTrend: 'unknown',
      transactionVolume: 0,
    };
    valuation.pricePerSqft = pricePerSqft;
    valuation.estimatedRentAed = estimatedRent;
    valuation.grossYieldPct = grossYield;
    valuation.mae = mae;
    valuation.requestedBy = requestedBy;

    return await this.valuationRepository.save(valuation);
  }

  /**
   * Calculate confidence interval for valuation
   */
  calculateConfidenceInterval(
    estimatedValue: number,
    comparables: any[],
  ): { low: number; high: number; level: ConfidenceLevel } {
    if (comparables.length === 0) {
      return {
        low: estimatedValue * 0.75,
        high: estimatedValue * 1.25,
        level: ConfidenceLevel.LOW,
      };
    }

    // Calculate standard deviation of adjusted prices
    const prices = comparables.map(c => c.adjustedPrice);
    const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);

    // Confidence interval = estimate ± (1.96 × std dev / sqrt(n)) for 95% confidence
    const marginOfError = (1.96 * stdDev) / Math.sqrt(comparables.length);

    let low = estimatedValue - marginOfError;
    let high = estimatedValue + marginOfError;

    // Apply minimum 10% and maximum 25% range
    const minRange = estimatedValue * 0.10;
    const maxRange = estimatedValue * 0.25;

    const currentRange = high - low;

    if (currentRange < minRange * 2) {
      // Expand to minimum range
      low = estimatedValue - minRange;
      high = estimatedValue + minRange;
    } else if (currentRange > maxRange * 2) {
      // Cap to maximum range
      low = estimatedValue - maxRange;
      high = estimatedValue + maxRange;
    }

    // Ensure positive values
    low = Math.max(0, low);
    high = Math.max(estimatedValue, high);

    const avgSimilarity = comparables.reduce((sum, c) => sum + c.similarityScore, 0) / comparables.length;
    const level = this.determineConfidenceLevel(comparables.length, avgSimilarity);

    return { low, high, level };
  }

  /**
   * Estimate rental value for property
   */
  async estimateRentalValue(
    propertyData: Property | any,
    purchasePrice?: number,
  ): Promise<number> {
    // Get market rental data if available
    const marketData = await this.marketDataService.getMarketData(
      propertyData.community,
      propertyData.type,
    );

    if (marketData?.avgRentSqft && propertyData.areaSqft) {
      // Use market data for rental estimate
      return marketData.avgRentSqft * propertyData.areaSqft;
    }

    // Use typical rental yields by community if no market data
    const salePrice = purchasePrice || propertyData.price || 0;
    if (!salePrice) return 0;

    const yieldPct = this.getTypicalYield(propertyData.community);
    return salePrice * (yieldPct / 100);
  }

  /**
   * Calculate gross rental yield
   */
  calculateGrossYield(salePrice: number, annualRent: number): number {
    if (!salePrice || salePrice <= 0) return 0;
    if (!annualRent || annualRent <= 0) return 0;

    return (annualRent / salePrice) * 100;
  }

  /**
   * Calculate Mean Absolute Error for accuracy tracking
   */
  async calculateMAE(
    _propertyData: Property | any,
    comparables: any[],
  ): Promise<number> {
    if (comparables.length === 0) return 15; // Default MAE

    // Calculate MAE from comparables
    const errors: number[] = [];

    comparables.forEach(comp => {
      if (comp.price > 0 && comp.adjustedPrice > 0) {
        const error = Math.abs(comp.price - comp.adjustedPrice) / comp.price * 100;
        errors.push(error);
      }
    });

    if (errors.length === 0) return 12; // Default

    const mae = errors.reduce((sum, e) => sum + e, 0) / errors.length;
    return Math.min(25, mae); // Cap at 25%
  }

  /**
   * Determine confidence level based on data quality
   */
  private determineConfidenceLevel(
    comparablesCount: number,
    avgSimilarity: number,
  ): ConfidenceLevel {
    // High confidence: 8+ comparables with >0.8 similarity
    if (comparablesCount >= 8 && avgSimilarity > 0.8) {
      return ConfidenceLevel.HIGH;
    }

    // Medium confidence: 5-7 comparables with >0.6 similarity
    if (comparablesCount >= 5 && avgSimilarity > 0.6) {
      return ConfidenceLevel.MEDIUM;
    }

    // Low confidence: <5 comparables or <0.6 similarity
    return ConfidenceLevel.LOW;
  }

  /**
   * Get typical rental yield by community
   */
  private getTypicalYield(community: string): number {
    const normalizedCommunity = community?.toLowerCase() || '';

    // Premium communities (lower yields)
    if (normalizedCommunity.includes('palm jumeirah')) return 5.5;
    if (normalizedCommunity.includes('downtown')) return 6.5;
    if (normalizedCommunity.includes('emirates hills')) return 5.0;

    // Mid-tier communities
    if (normalizedCommunity.includes('marina')) return 7.0;
    if (normalizedCommunity.includes('business bay')) return 7.5;
    if (normalizedCommunity.includes('jbr')) return 6.8;

    // Value communities (higher yields)
    if (normalizedCommunity.includes('jvc')) return 7.5;
    if (normalizedCommunity.includes('jvt')) return 7.8;
    if (normalizedCommunity.includes('international city')) return 8.5;

    // Default
    return 7.0;
  }

  /**
   * Get latest valuation for a property
   */
  async getLatestValuation(propertyId: string): Promise<Valuation | null> {
    return await this.valuationRepository.findOne({
      where: { propertyId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get valuation by ID with full details
   */
  async getValuationById(id: string): Promise<Valuation | null> {
    return await this.valuationRepository.findOne({
      where: { id },
      relations: ['property', 'requester'],
    });
  }
}
