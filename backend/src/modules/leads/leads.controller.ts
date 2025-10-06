import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { LeadsService } from './leads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { AssignLeadDto } from './dto/assign-lead.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { SearchLeadsDto } from './dto/search-leads.dto';
import { PaginatedResult } from './leads.service';
import { Lead } from './entities/lead.entity';
import { LeadActivity } from './entities/lead-activity.entity';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  /**
   * Public endpoint for lead capture forms
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createLead(@Body() createLeadDto: CreateLeadDto) {
    const lead = await this.leadsService.createLead(createLeadDto);
    return {
      leadId: lead.id,
      score: lead.score,
      tier: lead.tier,
      message: 'Lead created successfully',
    };
  }

  /**
   * Search leads with filters
   */
  @Get('search')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.MARKETING, UserRole.COMPLIANCE)
  async searchLeads(@Query() searchDto: SearchLeadsDto): Promise<PaginatedResult<Lead>> {
    const filters = {
      tier: searchDto.tier,
      status: searchDto.status,
      assignedTo: searchDto.assignedTo,
      source: searchDto.source,
      dateFrom: searchDto.dateFrom ? new Date(searchDto.dateFrom) : undefined,
      dateTo: searchDto.dateTo ? new Date(searchDto.dateTo) : undefined,
      page: searchDto.page,
      limit: searchDto.limit,
    };

    return this.leadsService.searchLeads(filters);
  }

  /**
   * Get leads assigned to current agent
   */
  @Get('my-leads')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT)
  async getMyLeads(@Request() req: any, @Query() searchDto: SearchLeadsDto): Promise<PaginatedResult<Lead>> {
    const agentId = req.user.userId;
    const filters = {
      tier: searchDto.tier,
      status: searchDto.status,
      page: searchDto.page,
      limit: searchDto.limit,
    };

    return this.leadsService.getAgentLeads(agentId, filters);
  }

  /**
   * Get lead by ID
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.MARKETING, UserRole.COMPLIANCE)
  async getLeadById(@Param('id') id: string) {
    return this.leadsService.getLeadById(id);
  }

  /**
   * Update lead
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.MARKETING)
  async updateLead(@Param('id') id: string, @Body() updateLeadDto: UpdateLeadDto) {
    return this.leadsService.updateLead(id, updateLeadDto);
  }

  /**
   * Assign lead to agent
   */
  @Post(':id/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MARKETING, UserRole.COMPLIANCE)
  async assignLead(@Param('id') id: string, @Body() assignDto: AssignLeadDto) {
    return this.leadsService.assignToAgent(id, assignDto.agentId);
  }

  /**
   * Update lead status
   */
  @Post(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.MARKETING)
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    return this.leadsService.updateLeadStatus(
      id,
      updateStatusDto.status,
      updateStatusDto.notes,
    );
  }

  /**
   * Record activity
   */
  @Post(':id/activity')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.MARKETING)
  @HttpCode(HttpStatus.CREATED)
  async recordActivity(
    @Param('id') id: string,
    @Body() activityDto: CreateActivityDto,
    @Request() req: any,
  ) {
    return this.leadsService.recordActivity(
      id,
      activityDto.activityType,
      activityDto.details,
      req.user.userId,
    );
  }

  /**
   * Get lead activities
   */
  @Get(':id/activities')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.MARKETING, UserRole.COMPLIANCE)
  async getActivities(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<PaginatedResult<LeadActivity>> {
    return this.leadsService.getLeadActivities(id, page, limit);
  }
}
