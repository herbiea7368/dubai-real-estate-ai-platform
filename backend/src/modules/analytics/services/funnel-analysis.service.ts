import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { FunnelStage, FunnelStageType } from '../entities/funnel-stage.entity';

@Injectable()
export class FunnelAnalysisService {
  constructor(
    @InjectRepository(FunnelStage)
    private readonly funnelStageRepository: Repository<FunnelStage>,
  ) {}

  /**
   * Track funnel stage progression
   */
  async trackFunnelStage(
    sessionId: string,
    stage: FunnelStageType,
    propertyId?: string,
    listingId?: string,
  ): Promise<FunnelStage> {
    // Get the last funnel stage for this session
    const previousStage = await this.funnelStageRepository.findOne({
      where: { sessionId },
      order: { enteredAt: 'DESC' },
    });

    // Update previous stage if it exists
    if (previousStage && !previousStage.exitedAt) {
      const timeInStageSeconds = Math.floor(
        (new Date().getTime() - previousStage.enteredAt.getTime()) / 1000,
      );

      previousStage.exitedAt = new Date();
      previousStage.timeInStageSeconds = timeInStageSeconds;
      previousStage.convertedToNextStage = true;

      await this.funnelStageRepository.save(previousStage);
    }

    // Create new funnel stage
    const newStage = this.funnelStageRepository.create({
      sessionId,
      stage,
      propertyId,
      listingId,
      previousStageId: previousStage?.id,
    });

    return await this.funnelStageRepository.save(newStage);
  }

  /**
   * Calculate funnel conversion metrics
   */
  async calculateFunnelMetrics(
    dateFrom: Date,
    dateTo: Date,
  ): Promise<{
    search: number;
    listing: number;
    detail: number;
    contact: number;
    conversion: number;
    listingRate: number;
    detailRate: number;
    contactRate: number;
    conversionRate: number;
  }> {
    const stages = await this.funnelStageRepository.find({
      where: {
        enteredAt: Between(dateFrom, dateTo),
      },
    });

    const counts = {
      search: 0,
      listing: 0,
      detail: 0,
      contact: 0,
      conversion: 0,
    };

    stages.forEach((stage) => {
      counts[stage.stage]++;
    });

    const listingRate = counts.search > 0 ? (counts.listing / counts.search) * 100 : 0;
    const detailRate = counts.listing > 0 ? (counts.detail / counts.listing) * 100 : 0;
    const contactRate = counts.detail > 0 ? (counts.contact / counts.detail) * 100 : 0;
    const conversionRate = counts.contact > 0 ? (counts.conversion / counts.contact) * 100 : 0;

    return {
      ...counts,
      listingRate: Math.round(listingRate * 100) / 100,
      detailRate: Math.round(detailRate * 100) / 100,
      contactRate: Math.round(contactRate * 100) / 100,
      conversionRate: Math.round(conversionRate * 100) / 100,
    };
  }

  /**
   * Get funnel dropoff points
   */
  async getFunnelDropoffs(
    dateFrom: Date,
    dateTo: Date,
  ): Promise<Array<{ stage: string; count: number; percentage: number }>> {
    const stages = await this.funnelStageRepository.find({
      where: {
        enteredAt: Between(dateFrom, dateTo),
        convertedToNextStage: false,
      },
    });

    const totalSessions = await this.funnelStageRepository
      .createQueryBuilder('stage')
      .select('COUNT(DISTINCT stage.sessionId)', 'count')
      .where('stage.enteredAt BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo })
      .getRawOne();

    const total = parseInt(totalSessions.count) || 1;

    const dropoffsByStage: Record<string, number> = {};
    stages.forEach((stage) => {
      dropoffsByStage[stage.stage] = (dropoffsByStage[stage.stage] || 0) + 1;
    });

    return Object.entries(dropoffsByStage).map(([stage, count]) => ({
      stage,
      count,
      percentage: Math.round((count / total) * 10000) / 100,
    }));
  }

  /**
   * Get average time spent in a stage
   */
  async getAverageTimeInStage(
    stage: FunnelStageType,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<{ avg: number; median: number; p95: number }> {
    const stages = await this.funnelStageRepository.find({
      where: {
        stage,
        enteredAt: Between(dateFrom, dateTo),
      },
      select: ['timeInStageSeconds'],
    });

    const times = stages
      .filter((s) => s.timeInStageSeconds !== null && s.timeInStageSeconds !== undefined)
      .map((s) => s.timeInStageSeconds)
      .sort((a, b) => a - b);

    if (times.length === 0) {
      return { avg: 0, median: 0, p95: 0 };
    }

    const avg = Math.round(times.reduce((sum, t) => sum + t, 0) / times.length);
    const median = times[Math.floor(times.length / 2)];
    const p95Index = Math.floor(times.length * 0.95);
    const p95 = times[p95Index] || times[times.length - 1];

    return { avg, median, p95 };
  }
}
