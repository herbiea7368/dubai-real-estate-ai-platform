import { Controller, Post, Get, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { Request } from 'express';
import { User, UserRole } from '../auth/entities/user.entity';
import { ConsentService } from './consent.service';

interface DsrRequest {
  id: number;
  userId: string;
  requestType: string;
  status: string;
  requestedAt: Date;
  estimatedCompletion?: Date;
}

@Controller('dsr')
@UseGuards(JwtAuthGuard)
export class DsrController {
  private dsrRequests: DsrRequest[] = []; // In-memory storage for now (will be moved to database)
  private requestIdCounter = 1;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private consentService: ConsentService,
  ) {}

  /**
   * Data Subject Access Request (DSAR)
   * Returns all personal data for the logged-in user
   */
  @Post('access-request')
  @HttpCode(HttpStatus.OK)
  async accessRequest(@Req() req: Request) {
    const userId = (req.user as any).id;

    // Fetch user data
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'phone', 'name', 'locale', 'roles', 'createdAt'],
    });

    // Fetch consent history
    const consentHistory = await this.consentService.getConsentHistory(userId);

    // Log DSR request
    const dsrLog: DsrRequest = {
      id: this.requestIdCounter++,
      userId,
      requestType: 'access',
      status: 'completed',
      requestedAt: new Date(),
    };
    this.dsrRequests.push(dsrLog);

    return {
      requestId: dsrLog.id,
      requestedAt: dsrLog.requestedAt,
      userData: {
        profile: user,
        consentHistory,
        // Future: Add more linked data (properties, searches, etc.)
      },
    };
  }

  /**
   * Data Subject Deletion Request
   * Marks user for deletion (soft delete initially)
   */
  @Post('delete-request')
  @HttpCode(HttpStatus.ACCEPTED)
  async deleteRequest(@Req() req: Request) {
    const userId = (req.user as any).id;

    // Calculate estimated completion (30 days from now per PDPL guidelines)
    const estimatedCompletion = new Date();
    estimatedCompletion.setDate(estimatedCompletion.getDate() + 30);

    // Create deletion request record
    const dsrLog: DsrRequest = {
      id: this.requestIdCounter++,
      userId,
      requestType: 'deletion',
      status: 'pending',
      requestedAt: new Date(),
      estimatedCompletion,
    };
    this.dsrRequests.push(dsrLog);

    // Note: Actual user deletion would be handled by a background job
    // For now, just create the request record

    return {
      requestId: dsrLog.id,
      status: 'pending',
      estimatedCompletion,
      message: 'Your deletion request has been received and will be processed within 30 days',
    };
  }

  /**
   * Data Subject Export Request
   * Generate JSON export of all user data
   */
  @Post('export-request')
  @HttpCode(HttpStatus.OK)
  async exportRequest(@Req() req: Request) {
    const userId = (req.user as any).id;

    // Fetch user data
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'phone', 'name', 'locale', 'roles', 'createdAt'],
    });

    // Fetch consent history
    const consentHistory = await this.consentService.getConsentHistory(userId);

    // Log DSR request
    const dsrLog: DsrRequest = {
      id: this.requestIdCounter++,
      userId,
      requestType: 'export',
      status: 'completed',
      requestedAt: new Date(),
    };
    this.dsrRequests.push(dsrLog);

    // Return complete data export
    const exportData = {
      exportedAt: new Date().toISOString(),
      requestId: dsrLog.id,
      userData: {
        profile: user,
        consentHistory,
        // Future: Add more linked data (properties, searches, etc.)
      },
    };

    return {
      requestId: dsrLog.id,
      exportData,
      format: 'json',
      message: 'Your data export is ready for download',
      // Future: Return S3 presigned URL instead of inline data
    };
  }

  /**
   * List all pending DSR requests (compliance role only)
   */
  @Get('requests')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COMPLIANCE)
  @HttpCode(HttpStatus.OK)
  async listRequests() {
    return {
      requests: this.dsrRequests,
      totalCount: this.dsrRequests.length,
      pendingCount: this.dsrRequests.filter((r) => r.status === 'pending').length,
    };
  }
}
