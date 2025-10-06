import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, LessThan, MoreThan } from 'typeorm';
import { Lead, LeadStatus, LeadTier } from './entities/lead.entity';
import { LeadActivity, ActivityType } from './entities/lead-activity.entity';
import { LeadScoringService } from './lead-scoring.service';
import { User, UserRole } from '../auth/entities/user.entity';

interface SearchFilters {
  tier?: LeadTier;
  status?: LeadStatus;
  assignedTo?: string;
  source?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  results: T[];
  total: number;
  page: number;
  totalPages: number;
}

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
    @InjectRepository(LeadActivity)
    private readonly activityRepository: Repository<LeadActivity>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly scoringService: LeadScoringService,
  ) {}

  /**
   * Create a new lead with scoring
   */
  async createLead(leadData: Partial<Lead>): Promise<Lead> {
    // Check for duplicate by email or phone (within last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const existingLead = await this.leadRepository.findOne({
      where: [
        { email: leadData.email, createdAt: MoreThan(thirtyDaysAgo) },
        { phone: leadData.phone, createdAt: MoreThan(thirtyDaysAgo) },
      ],
    });

    if (existingLead) {
      return existingLead;
    }

    // Calculate initial score
    const scoringResult = await this.scoringService.calculateLeadScore(leadData);

    // Create lead
    const lead = this.leadRepository.create({
      ...leadData,
      score: scoringResult.score,
      tier: scoringResult.tier,
      status: LeadStatus.NEW,
      scoringFeatures: this.scoringService.extractScoringFeatures(leadData),
    });

    const savedLead = await this.leadRepository.save(lead);

    // Create activity for lead creation
    await this.recordActivity(
      savedLead.id,
      ActivityType.LEAD_CREATED,
      {
        source: leadData.source,
        tier: scoringResult.tier,
        score: scoringResult.score,
      },
      null,
    );

    // Auto-assign if tier is hot (document logic for future implementation)
    // TODO: Implement auto-assignment logic based on agent availability and capacity

    return savedLead;
  }

  /**
   * Update lead with score recalculation
   */
  async updateLead(leadId: string, updateData: Partial<Lead>): Promise<Lead> {
    const lead = await this.leadRepository.findOne({ where: { id: leadId } });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    // Merge update data
    Object.assign(lead, updateData);

    // Recalculate score if budget or interests change
    if (updateData.budget || updateData.propertyInterests) {
      const scoringResult = await this.scoringService.calculateLeadScore(lead);
      lead.score = scoringResult.score;
      lead.tier = scoringResult.tier;
      lead.scoringFeatures = this.scoringService.extractScoringFeatures(lead);
    }

    const updatedLead = await this.leadRepository.save(lead);

    // Log activity
    await this.recordActivity(
      leadId,
      ActivityType.NOTE_ADDED,
      { action: 'lead_updated', changes: Object.keys(updateData) },
      null,
    );

    return updatedLead;
  }

  /**
   * Assign lead to agent
   */
  async assignToAgent(leadId: string, agentId: string): Promise<Lead> {
    const lead = await this.leadRepository.findOne({ where: { id: leadId } });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    // Validate agent
    const agent = await this.userRepository.findOne({ where: { id: agentId } });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    if (!agent.roles.includes(UserRole.AGENT)) {
      throw new BadRequestException('User is not an agent');
    }

    // TODO: Check agent capacity in future implementation

    lead.assignedToAgentId = agentId;
    await this.leadRepository.save(lead);

    // Create activity
    await this.recordActivity(
      leadId,
      ActivityType.ASSIGNED,
      { agentId, agentName: agent.name },
      null,
    );

    // TODO: Send notification to agent in future implementation

    const assignedLead = await this.leadRepository.findOne({
      where: { id: leadId },
      relations: ['assignedToAgent'],
    });

    if (!assignedLead) {
      throw new NotFoundException('Lead not found after assignment');
    }

    return assignedLead;
  }

  /**
   * Update lead status with validation
   */
  async updateLeadStatus(
    leadId: string,
    newStatus: LeadStatus,
    notes?: string,
  ): Promise<Lead> {
    const lead = await this.leadRepository.findOne({ where: { id: leadId } });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    // Validate status transition
    const validTransitions: Record<LeadStatus, LeadStatus[]> = {
      [LeadStatus.NEW]: [LeadStatus.CONTACTED, LeadStatus.LOST],
      [LeadStatus.CONTACTED]: [
        LeadStatus.QUALIFIED,
        LeadStatus.NURTURE,
        LeadStatus.LOST,
      ],
      [LeadStatus.QUALIFIED]: [
        LeadStatus.CONVERTED,
        LeadStatus.NURTURE,
        LeadStatus.LOST,
      ],
      [LeadStatus.NURTURE]: [
        LeadStatus.QUALIFIED,
        LeadStatus.CONTACTED,
        LeadStatus.LOST,
      ],
      [LeadStatus.CONVERTED]: [],
      [LeadStatus.LOST]: [],
    };

    if (!validTransitions[lead.status].includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${lead.status} to ${newStatus}`,
      );
    }

    lead.status = newStatus;

    if (newStatus === LeadStatus.CONVERTED) {
      lead.conversionDate = new Date();
    }

    if (newStatus === LeadStatus.CONTACTED) {
      lead.lastContactedAt = new Date();
    }

    if (notes) {
      lead.notes = notes;
    }

    const updatedLead = await this.leadRepository.save(lead);

    // Create activity
    await this.recordActivity(
      leadId,
      ActivityType.STATUS_CHANGED,
      { from: lead.status, to: newStatus, notes },
      null,
    );

    return updatedLead;
  }

  /**
   * Get lead by ID with relations
   */
  async getLeadById(leadId: string): Promise<Lead> {
    const lead = await this.leadRepository.findOne({
      where: { id: leadId },
      relations: ['assignedToAgent', 'activities'],
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    // Get latest 10 activities
    const activities = await this.activityRepository.find({
      where: { leadId },
      order: { timestamp: 'DESC' },
      take: 10,
      relations: ['performer'],
    });

    lead.activities = activities;

    return lead;
  }

  /**
   * Search leads with filters and pagination
   */
  async searchLeads(filters: SearchFilters): Promise<PaginatedResult<Lead>> {
    const {
      tier,
      status,
      assignedTo,
      source,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
    } = filters;

    const where: FindOptionsWhere<Lead> = {};

    if (tier) where.tier = tier;
    if (status) where.status = status;
    if (assignedTo) where.assignedToAgentId = assignedTo;
    if (source) where.source = source as any;
    if (dateFrom) where.createdAt = MoreThan(dateFrom);
    if (dateTo) where.createdAt = LessThan(dateTo);

    const [results, total] = await this.leadRepository.findAndCount({
      where,
      relations: ['assignedToAgent'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      results,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get lead activities with pagination
   */
  async getLeadActivities(
    leadId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResult<LeadActivity>> {
    const [results, total] = await this.activityRepository.findAndCount({
      where: { leadId },
      order: { timestamp: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['performer'],
    });

    return {
      results,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Record activity and update score if applicable
   */
  async recordActivity(
    leadId: string,
    activityType: ActivityType,
    details: Record<string, any>,
    performedBy: string | null,
  ): Promise<LeadActivity> {
    const activity = this.activityRepository.create({
      leadId,
      activityType,
      details,
      performedBy,
    });

    const savedActivity = await this.activityRepository.save(activity);

    // Update score if activity affects scoring
    const scoringActivities = [
      ActivityType.EMAIL_OPENED,
      ActivityType.PROPERTY_VIEWED,
      ActivityType.MEETING_SCHEDULED,
      ActivityType.MEETING_COMPLETED,
      ActivityType.OFFER_MADE,
    ];

    if (scoringActivities.includes(activityType)) {
      await this.scoringService.updateScoreBasedOnActivity(leadId, activityType);
    }

    return savedActivity;
  }

  /**
   * Get leads assigned to a specific agent
   */
  async getAgentLeads(
    agentId: string,
    filters: Partial<SearchFilters> = {},
  ): Promise<PaginatedResult<Lead>> {
    return this.searchLeads({
      ...filters,
      assignedTo: agentId,
    });
  }
}
