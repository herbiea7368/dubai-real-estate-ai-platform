import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead, LeadSource, LeadTier } from './entities/lead.entity';
import { LeadActivity, ActivityType } from './entities/lead-activity.entity';

interface ScoringResult {
  score: number;
  tier: LeadTier;
  reasons: string[];
}

interface ScoringFeatures {
  budgetScore: number;
  engagementScore: number;
  sourceScore: number;
  responseScore: number;
  completenessScore: number;
}

@Injectable()
export class LeadScoringService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
    @InjectRepository(LeadActivity)
    private readonly activityRepository: Repository<LeadActivity>,
  ) {}

  /**
   * Calculate lead score based on multiple factors
   */
  async calculateLeadScore(leadData: Partial<Lead>): Promise<ScoringResult> {
    const features = this.extractScoringFeatures(leadData);
    const reasons: string[] = [];

    // Budget score (30%)
    const budgetScore = features.budgetScore * 0.3;
    if (features.budgetScore > 0.7) {
      reasons.push(`High budget range (${features.budgetScore.toFixed(2)} score)`);
    }

    // Engagement score (25%)
    const engagementScore = features.engagementScore * 0.25;
    if (features.engagementScore > 0.5) {
      reasons.push(`Good engagement level (${features.engagementScore.toFixed(2)} score)`);
    }

    // Source score (20%)
    const sourceScore = features.sourceScore * 0.2;
    if (features.sourceScore >= 0.9) {
      reasons.push(`High-quality source (${features.sourceScore.toFixed(2)} score)`);
    }

    // Response time score (15%)
    const responseScore = features.responseScore * 0.15;
    if (features.responseScore > 0.7) {
      reasons.push(`Quick response time (${features.responseScore.toFixed(2)} score)`);
    }

    // Profile completeness (10%)
    const completenessScore = features.completenessScore * 0.1;
    if (features.completenessScore === 1.0) {
      reasons.push('Complete profile');
    }

    // Calculate total score
    const totalScore = Math.min(
      1.0,
      budgetScore + engagementScore + sourceScore + responseScore + completenessScore,
    );

    // Determine tier
    let tier: LeadTier;
    if (totalScore >= 0.7) {
      tier = LeadTier.HOT;
    } else if (totalScore >= 0.4) {
      tier = LeadTier.WARM;
    } else {
      tier = LeadTier.COLD;
    }

    return {
      score: parseFloat(totalScore.toFixed(2)),
      tier,
      reasons,
    };
  }

  /**
   * Extract and normalize features for scoring
   */
  extractScoringFeatures(leadData: Partial<Lead>): ScoringFeatures {
    const budgetScore = this.getBudgetScore(leadData.budget);
    const sourceScore = this.getSourceScore(leadData.source);

    // Engagement score - based on property interests and investor profile
    let engagementScore = 0.3; // Base score
    if (leadData.propertyInterests && leadData.propertyInterests.length > 0) {
      engagementScore += 0.3;
    }
    if (leadData.investorProfile) {
      engagementScore += 0.2;
    }
    if (leadData.interestedInOffPlan) {
      engagementScore += 0.2;
    }

    // Response score - assume new leads have medium response (can be updated with activity)
    const responseScore = 0.5;

    // Completeness score
    let completenessScore = 0;
    const fields = [
      leadData.firstName,
      leadData.lastName,
      leadData.email,
      leadData.phone,
      leadData.budget,
      leadData.preferredPropertyType,
    ];
    const filledFields = fields.filter((f) => f !== null && f !== undefined).length;
    completenessScore = filledFields / fields.length;

    return {
      budgetScore,
      engagementScore: Math.min(1.0, engagementScore),
      sourceScore,
      responseScore,
      completenessScore,
    };
  }

  /**
   * Update score based on new activity
   */
  async updateScoreBasedOnActivity(
    leadId: string,
    activityType: ActivityType,
  ): Promise<Lead> {
    const lead = await this.leadRepository.findOne({
      where: { id: leadId },
      relations: ['activities'],
    });

    if (!lead) {
      throw new Error('Lead not found');
    }

    // Get activity count
    const activityCount = await this.activityRepository.count({
      where: { leadId },
    });

    // Update engagement score based on activity type
    let engagementBoost = 0;
    switch (activityType) {
      case ActivityType.EMAIL_OPENED:
        engagementBoost = 0.1;
        break;
      case ActivityType.PROPERTY_VIEWED:
        engagementBoost = 0.15;
        break;
      case ActivityType.MEETING_SCHEDULED:
        engagementBoost = 0.2;
        break;
      case ActivityType.MEETING_COMPLETED:
        engagementBoost = 0.25;
        break;
      case ActivityType.OFFER_MADE:
        engagementBoost = 0.3;
        break;
      default:
        engagementBoost = 0.05;
    }

    // Recalculate base score
    const scoringResult = await this.calculateLeadScore(lead);

    // Add engagement boost based on activities
    const activityBoost = Math.min(0.3, (activityCount * 0.02) + engagementBoost);
    const newScore = Math.min(1.0, scoringResult.score + activityBoost);

    // Update tier based on new score
    let newTier: LeadTier;
    if (newScore >= 0.7) {
      newTier = LeadTier.HOT;
    } else if (newScore >= 0.4) {
      newTier = LeadTier.WARM;
    } else {
      newTier = LeadTier.COLD;
    }

    // Update lead
    lead.score = parseFloat(newScore.toFixed(2));
    lead.tier = newTier;
    lead.scoringFeatures = {
      ...lead.scoringFeatures,
      engagementScore: lead.scoringFeatures.engagementScore || 0 + engagementBoost,
    };

    return this.leadRepository.save(lead);
  }

  /**
   * Get budget score (0.0-1.0)
   */
  private getBudgetScore(budget: { min?: number; max?: number } | null | undefined): number {
    if (!budget || (!budget.min && !budget.max)) {
      return 0.3; // Default low score if no budget
    }

    const avgBudget = budget.max
      ? (budget.min || 0 + budget.max) / 2
      : budget.min || 0;

    // AED budget scoring
    if (avgBudget >= 5000000) return 1.0;
    if (avgBudget >= 2000000) return 0.9;
    if (avgBudget >= 1000000) return 0.7;
    if (avgBudget >= 500000) return 0.5;
    return 0.3;
  }

  /**
   * Get source score based on quality
   */
  private getSourceScore(source: LeadSource | undefined): number {
    if (!source) return 0.5;

    const sourceScores: Record<LeadSource, number> = {
      [LeadSource.WEBSITE]: 1.0,
      [LeadSource.REFERRAL]: 0.9,
      [LeadSource.BAYUT]: 0.7,
      [LeadSource.DUBIZZLE]: 0.7,
      [LeadSource.PF]: 0.7,
      [LeadSource.WALK_IN]: 0.6,
      [LeadSource.FACEBOOK]: 0.5,
      [LeadSource.INSTAGRAM]: 0.5,
      [LeadSource.CALL]: 0.6,
    };

    return sourceScores[source] || 0.5;
  }
}
