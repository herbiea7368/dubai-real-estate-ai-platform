import { Injectable } from '@nestjs/common';
import { Property, CompletionStatus } from '../../properties/entities/property.entity';

interface PropertyFeatures {
  locationScore: number;
  sizeScore: number;
  amenityScore: number;
  ageScore: number;
  floorScore?: number;
  viewScore?: number;
  [key: string]: any;
}

@Injectable()
export class FeatureEngineeringService {
  /**
   * Extract and normalize features from a property
   */
  extractFeatures(property: Property | any): PropertyFeatures {
    const locationScore = this.getCommunityScore(property.community);
    const sizeScore = this.calculateSizeScore(property.areaSqft);
    const amenityScore = this.calculateAmenityScore(property.amenities || []);
    const ageScore = this.calculateAgeScore(property.completionStatus, property.completionYear);
    const floorScore = property.floor ? this.calculateFloorScore(property.floor) : undefined;
    const viewScore = property.view ? this.calculateViewScore(property.view) : undefined;

    return {
      locationScore,
      sizeScore,
      amenityScore,
      ageScore,
      floorScore,
      viewScore,
    };
  }

  /**
   * Get community score based on desirability
   * Higher score = more desirable location
   */
  getCommunityScore(community: string): number {
    const normalizedCommunity = community?.toLowerCase() || '';

    // Premium communities
    if (normalizedCommunity.includes('palm jumeirah')) return 1.0;
    if (normalizedCommunity.includes('downtown dubai') || normalizedCommunity.includes('downtown')) return 0.95;
    if (normalizedCommunity.includes('dubai marina') || normalizedCommunity.includes('marina')) return 0.90;
    if (normalizedCommunity.includes('business bay')) return 0.85;
    if (normalizedCommunity.includes('emirates hills')) return 0.95;
    if (normalizedCommunity.includes('arabian ranches')) return 0.80;
    if (normalizedCommunity.includes('jumeirah beach residence') || normalizedCommunity.includes('jbr')) return 0.88;

    // Mid-tier communities
    if (normalizedCommunity.includes('jumeirah village circle') || normalizedCommunity.includes('jvc')) return 0.70;
    if (normalizedCommunity.includes('jumeirah village triangle') || normalizedCommunity.includes('jvt')) return 0.68;
    if (normalizedCommunity.includes('dubai hills')) return 0.82;
    if (normalizedCommunity.includes('motor city')) return 0.65;
    if (normalizedCommunity.includes('sports city')) return 0.63;
    if (normalizedCommunity.includes('international city')) return 0.50;
    if (normalizedCommunity.includes('discovery gardens')) return 0.60;

    // Default for unknown communities
    return 0.50;
  }

  /**
   * Calculate normalized size score
   * Based on typical Dubai property sizes
   */
  private calculateSizeScore(areaSqft: number): number {
    if (!areaSqft || areaSqft <= 0) return 0;

    // Normalize based on typical ranges
    // Studio: 400-600 sqft
    // 1BR: 600-900 sqft
    // 2BR: 900-1400 sqft
    // 3BR: 1400-2000 sqft
    // 4BR+: 2000-4000 sqft
    // Villas: 2000-10000 sqft

    const minSqft = 300;
    const maxSqft = 10000;

    const normalized = (areaSqft - minSqft) / (maxSqft - minSqft);
    return Math.max(0, Math.min(1, normalized));
  }

  /**
   * Calculate amenity score based on available amenities
   */
  calculateAmenityScore(amenities: string[]): number {
    if (!amenities || amenities.length === 0) return 0;

    let score = 0;
    const normalizedAmenities = amenities.map(a => a.toLowerCase());

    // Premium amenities
    if (normalizedAmenities.some(a => a.includes('pool') || a.includes('swimming'))) score += 0.15;
    if (normalizedAmenities.some(a => a.includes('gym') || a.includes('fitness'))) score += 0.10;
    if (normalizedAmenities.some(a => a.includes('parking') || a.includes('garage'))) score += 0.10;
    if (normalizedAmenities.some(a => a.includes('security') || a.includes('guard'))) score += 0.05;
    if (normalizedAmenities.some(a => a.includes('maid') || a.includes("maid's room"))) score += 0.10;
    if (normalizedAmenities.some(a => a.includes('balcony') || a.includes('terrace'))) score += 0.08;
    if (normalizedAmenities.some(a => a.includes('smart home') || a.includes('smart'))) score += 0.07;
    if (normalizedAmenities.some(a => a.includes('concierge'))) score += 0.06;
    if (normalizedAmenities.some(a => a.includes('spa') || a.includes('sauna'))) score += 0.08;
    if (normalizedAmenities.some(a => a.includes('garden') || a.includes('landscaped'))) score += 0.06;
    if (normalizedAmenities.some(a => a.includes('beach access') || a.includes('private beach'))) score += 0.12;

    // Cap at 1.0
    return Math.min(1.0, score);
  }

  /**
   * Calculate age/completion status score
   * Newer or ready properties score higher
   */
  private calculateAgeScore(completionStatus: CompletionStatus | string, completionYear?: number): number {
    if (completionStatus === CompletionStatus.READY || completionStatus === 'ready') {
      if (!completionYear) return 0.75; // Ready but no year info

      const currentYear = new Date().getFullYear();
      const age = currentYear - completionYear;

      // Brand new (0-2 years)
      if (age <= 2) return 1.0;
      // Recent (3-5 years)
      if (age <= 5) return 0.9;
      // Moderate (6-10 years)
      if (age <= 10) return 0.75;
      // Older (11-20 years)
      if (age <= 20) return 0.6;
      // Very old (20+ years)
      return 0.4;
    }

    // Off-plan properties
    if (completionStatus === CompletionStatus.OFF_PLAN || completionStatus === 'off_plan') {
      if (!completionYear) return 0.7;

      const currentYear = new Date().getFullYear();
      const yearsToCompletion = completionYear - currentYear;

      // Completing soon (0-1 years)
      if (yearsToCompletion <= 1) return 0.85;
      // Medium term (2-3 years)
      if (yearsToCompletion <= 3) return 0.75;
      // Long term (4+ years)
      return 0.65;
    }

    return 0.5; // Unknown status
  }

  /**
   * Calculate floor score for apartments
   * Higher floors typically command premium in Dubai
   */
  private calculateFloorScore(floor: number): number {
    if (floor <= 0) return 0.3; // Ground floor
    if (floor <= 5) return 0.5; // Low floors
    if (floor <= 15) return 0.7; // Mid floors
    if (floor <= 30) return 0.85; // High floors
    return 1.0; // Premium high floors (30+)
  }

  /**
   * Calculate view score
   */
  private calculateViewScore(view: string): number {
    if (!view) return 0;

    const normalizedView = view.toLowerCase();

    if (normalizedView.includes('sea') || normalizedView.includes('ocean') || normalizedView.includes('beach')) {
      return 1.0;
    }
    if (normalizedView.includes('golf')) {
      return 0.9;
    }
    if (normalizedView.includes('marina') || normalizedView.includes('canal')) {
      return 0.85;
    }
    if (normalizedView.includes('skyline') || normalizedView.includes('city')) {
      return 0.75;
    }
    if (normalizedView.includes('park') || normalizedView.includes('garden')) {
      return 0.65;
    }
    if (normalizedView.includes('pool')) {
      return 0.6;
    }

    return 0.5; // Default/street view
  }

  /**
   * Normalize all features to 0-1 range
   */
  normalizeFeatures(features: PropertyFeatures): PropertyFeatures {
    // Already normalized in extraction, but this method can be used
    // for custom normalization or handling missing values
    const normalized = { ...features };

    // Handle any missing values by using defaults
    if (normalized.locationScore === undefined || normalized.locationScore === null) {
      normalized.locationScore = 0.5;
    }
    if (normalized.sizeScore === undefined || normalized.sizeScore === null) {
      normalized.sizeScore = 0.5;
    }
    if (normalized.amenityScore === undefined || normalized.amenityScore === null) {
      normalized.amenityScore = 0.3;
    }
    if (normalized.ageScore === undefined || normalized.ageScore === null) {
      normalized.ageScore = 0.5;
    }

    return normalized;
  }
}
