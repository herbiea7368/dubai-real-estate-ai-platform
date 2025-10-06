import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property, PropertyStatus } from '../../properties/entities/property.entity';
import { FeatureEngineeringService } from './feature-engineering.service';

interface ComparableProperty {
  propertyId: string;
  similarityScore: number;
  price: number;
  adjustedPrice: number;
  property?: Property;
}

@Injectable()
export class ComparablesService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    private readonly featureService: FeatureEngineeringService,
  ) {}

  /**
   * Find comparable properties for valuation
   */
  async findComparables(
    targetProperty: Property | any,
    limit: number = 10,
  ): Promise<ComparableProperty[]> {
    const {
      community,
      type,
      bedrooms,
      areaSqft,
      id: targetId,
    } = targetProperty;

    // Calculate size range (±20%)
    const minSize = areaSqft * 0.8;
    const maxSize = areaSqft * 1.2;

    // Get recent transactions (last 6 months preferred)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Build query for similar properties
    const queryBuilder = this.propertyRepository.createQueryBuilder('property');

    queryBuilder
      .where('property.type = :type', { type })
      .andWhere('property.areaSqft BETWEEN :minSize AND :maxSize', { minSize, maxSize })
      .andWhere('property.status IN (:...statuses)', {
        statuses: [PropertyStatus.SOLD, PropertyStatus.AVAILABLE]
      });

    // Exclude target property if it has an ID
    if (targetId) {
      queryBuilder.andWhere('property.id != :targetId', { targetId });
    }

    // Prefer same community
    queryBuilder.andWhere(
      '(property.community = :community OR property.community ILIKE :adjacentCommunity)',
      {
        community,
        adjacentCommunity: `%${this.getAdjacentCommunityPattern(community)}%`
      },
    );

    // Similar bedrooms
    if (bedrooms) {
      queryBuilder.andWhere('property.bedrooms BETWEEN :minBeds AND :maxBeds', {
        minBeds: Math.max(0, bedrooms - 1),
        maxBeds: bedrooms + 1,
      });
    }

    // Get more than needed to allow for similarity filtering
    const candidates = await queryBuilder
      .limit(limit * 3)
      .getMany();

    // Calculate similarity scores
    const comparablesWithScores = candidates.map(comp => {
      const similarityScore = this.calculateSimilarity(targetProperty, comp);
      const compPrice = (comp as any).price || comp.areaSqft * 1500; // Fallback price estimation
      const adjustedPrice = this.adjustForDifferences(
        compPrice,
        targetProperty,
        comp,
      );

      return {
        propertyId: comp.id,
        similarityScore,
        price: compPrice,
        adjustedPrice,
        property: comp,
      };
    });

    // Sort by similarity score and return top N
    comparablesWithScores.sort((a, b) => b.similarityScore - a.similarityScore);
    return comparablesWithScores.slice(0, limit);
  }

  /**
   * Calculate similarity score between two properties
   * Weighted scoring: Location 30%, Size 25%, Beds/Baths 20%, Age 15%, Amenities 10%
   */
  calculateSimilarity(
    target: Property | any,
    comparable: Property | any,
  ): number {
    let totalScore = 0;

    // Location similarity (30%)
    const locationScore = this.calculateLocationSimilarity(
      target.community,
      comparable.community,
    );
    totalScore += locationScore * 0.30;

    // Size similarity (25%)
    const sizeScore = this.calculateSizeSimilarity(
      target.areaSqft,
      comparable.areaSqft,
    );
    totalScore += sizeScore * 0.25;

    // Beds/Baths similarity (20%)
    const bedroomScore = this.calculateBedroomSimilarity(
      target.bedrooms,
      comparable.bedrooms,
    );
    const bathroomScore = this.calculateBathroomSimilarity(
      target.bathrooms,
      comparable.bathrooms,
    );
    totalScore += (bedroomScore * 0.15) + (bathroomScore * 0.05);

    // Age similarity (15%)
    const ageScore = this.calculateAgeSimilarity(
      target.completionStatus,
      comparable.completionStatus,
      target.completionYear,
      comparable.completionYear,
    );
    totalScore += ageScore * 0.15;

    // Amenities similarity (10%)
    const amenityScore = this.calculateAmenitySimilarity(
      target.amenities || [],
      comparable.amenities || [],
    );
    totalScore += amenityScore * 0.10;

    return Math.min(1.0, Math.max(0.0, totalScore));
  }

  /**
   * Adjust comparable price for differences
   */
  adjustForDifferences(
    comparablePrice: number,
    target: Property | any,
    comparable: Property | any,
  ): number {
    if (!comparablePrice || comparablePrice <= 0) return 0;

    let adjustedPrice = comparablePrice;

    // Size difference adjustment (±AED per sqft)
    const sizeDiff = target.areaSqft - comparable.areaSqft;
    const avgPriceSqft = comparablePrice / comparable.areaSqft;
    adjustedPrice += sizeDiff * avgPriceSqft;

    // Extra bedroom adjustment (+200k AED per bedroom)
    const bedroomDiff = (target.bedrooms || 0) - (comparable.bedrooms || 0);
    adjustedPrice += bedroomDiff * 200000;

    // Bathroom adjustment (+50k AED per bathroom)
    const bathroomDiff = (target.bathrooms || 0) - (comparable.bathrooms || 0);
    adjustedPrice += bathroomDiff * 50000;

    // Location adjustment (better location = +10-20%)
    const targetLocationScore = this.featureService.getCommunityScore(target.community);
    const compLocationScore = this.featureService.getCommunityScore(comparable.community);
    const locationDiff = targetLocationScore - compLocationScore;

    if (locationDiff > 0.1) {
      adjustedPrice *= (1 + (locationDiff * 0.15)); // Up to 15% premium
    } else if (locationDiff < -0.1) {
      adjustedPrice *= (1 + (locationDiff * 0.15)); // Discount
    }

    // Age difference adjustment (±2% per year)
    const targetAge = this.getPropertyAge(target);
    const compAge = this.getPropertyAge(comparable);
    const ageDiff = compAge - targetAge;
    adjustedPrice *= (1 + (ageDiff * 0.02));

    return Math.max(0, adjustedPrice);
  }

  /**
   * Get statistics from comparables
   */
  getComparableStats(comparables: ComparableProperty[]): {
    medianPrice: number;
    avgPrice: number;
    minPrice: number;
    maxPrice: number;
    medianAdjustedPrice: number;
    avgAdjustedPrice: number;
  } {
    if (!comparables || comparables.length === 0) {
      return {
        medianPrice: 0,
        avgPrice: 0,
        minPrice: 0,
        maxPrice: 0,
        medianAdjustedPrice: 0,
        avgAdjustedPrice: 0,
      };
    }

    const prices = comparables.map(c => c.price).sort((a, b) => a - b);
    const adjustedPrices = comparables.map(c => c.adjustedPrice).sort((a, b) => a - b);

    const medianPrice = this.calculateMedian(prices);
    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    const medianAdjustedPrice = this.calculateMedian(adjustedPrices);
    const avgAdjustedPrice = adjustedPrices.reduce((sum, p) => sum + p, 0) / adjustedPrices.length;

    return {
      medianPrice,
      avgPrice,
      minPrice,
      maxPrice,
      medianAdjustedPrice,
      avgAdjustedPrice,
    };
  }

  // Helper methods

  private calculateLocationSimilarity(community1: string, community2: string): number {
    const c1 = community1?.toLowerCase() || '';
    const c2 = community2?.toLowerCase() || '';

    // Exact match
    if (c1 === c2) return 1.0;

    // Same area (e.g., both in Marina)
    if (c1.includes('marina') && c2.includes('marina')) return 0.9;
    if (c1.includes('downtown') && c2.includes('downtown')) return 0.9;
    if (c1.includes('palm') && c2.includes('palm')) return 0.9;

    // Adjacent areas (simplified - in real app would use geographic data)
    const adjacentPairs = [
      ['dubai marina', 'jbr'],
      ['dubai marina', 'business bay'],
      ['downtown dubai', 'business bay'],
      ['jvc', 'jvt'],
    ];

    for (const [area1, area2] of adjacentPairs) {
      if ((c1.includes(area1) && c2.includes(area2)) ||
          (c1.includes(area2) && c2.includes(area1))) {
        return 0.7;
      }
    }

    // Different areas
    return 0.3;
  }

  private calculateSizeSimilarity(size1: number, size2: number): number {
    if (!size1 || !size2) return 0;

    const diff = Math.abs(size1 - size2);
    const avgSize = (size1 + size2) / 2;
    const percentDiff = diff / avgSize;

    // Less than 10% difference = perfect score
    if (percentDiff < 0.1) return 1.0;
    // Up to 20% difference = good score
    if (percentDiff < 0.2) return 0.9;
    // Up to 30% difference = acceptable
    if (percentDiff < 0.3) return 0.7;
    // More than 30% = poor match
    return Math.max(0, 1 - percentDiff);
  }

  private calculateBedroomSimilarity(beds1: number, beds2: number): number {
    if (!beds1 && !beds2) return 1.0;
    if (!beds1 || !beds2) return 0.5;

    const diff = Math.abs(beds1 - beds2);
    if (diff === 0) return 1.0;
    if (diff === 1) return 0.7;
    if (diff === 2) return 0.4;
    return 0.2;
  }

  private calculateBathroomSimilarity(baths1: number, baths2: number): number {
    if (!baths1 && !baths2) return 1.0;
    if (!baths1 || !baths2) return 0.5;

    const diff = Math.abs(baths1 - baths2);
    if (diff === 0) return 1.0;
    if (diff === 1) return 0.8;
    return 0.5;
  }

  private calculateAgeSimilarity(
    status1: string,
    status2: string,
    year1?: number,
    year2?: number,
  ): number {
    // Same completion status
    if (status1 === status2) {
      if (!year1 || !year2) return 0.8;

      const yearDiff = Math.abs(year1 - year2);
      if (yearDiff <= 1) return 1.0;
      if (yearDiff <= 3) return 0.8;
      if (yearDiff <= 5) return 0.6;
      return 0.4;
    }

    // Different completion status (ready vs off-plan)
    return 0.5;
  }

  private calculateAmenitySimilarity(amenities1: string[], amenities2: string[]): number {
    if (!amenities1?.length && !amenities2?.length) return 1.0;
    if (!amenities1?.length || !amenities2?.length) return 0.3;

    const set1 = new Set(amenities1.map(a => a.toLowerCase()));
    const set2 = new Set(amenities2.map(a => a.toLowerCase()));

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    // Jaccard similarity
    return intersection.size / union.size;
  }

  private getAdjacentCommunityPattern(community: string): string {
    const c = community?.toLowerCase() || '';

    // Return patterns for adjacent communities
    if (c.includes('marina')) return 'jbr|business bay';
    if (c.includes('downtown')) return 'business bay|bur dubai';
    if (c.includes('jvc')) return 'jvt|arjan';

    return community; // Default to same community
  }

  private getPropertyAge(property: Property | any): number {
    if (!property.completionYear) return 0;

    const currentYear = new Date().getFullYear();

    if (property.completionStatus === 'ready') {
      return currentYear - property.completionYear;
    }

    // For off-plan, return negative age (years until completion)
    return currentYear - property.completionYear;
  }

  private calculateMedian(arr: number[]): number {
    if (arr.length === 0) return 0;

    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    }

    return sorted[mid];
  }
}
