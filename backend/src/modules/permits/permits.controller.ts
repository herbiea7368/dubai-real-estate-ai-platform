import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PermitsService } from './permits.service';
import { CheckPermitDto } from './dto/check-permit.dto';
import { ValidatePermitDto } from './dto/validate-permit.dto';
import { RegisterPermitDto } from './dto/register-permit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';

@Controller('permits')
export class PermitsController {
  constructor(private readonly permitsService: PermitsService) {}

  /**
   * Check permit validity (public endpoint)
   */
  @Post('check')
  @HttpCode(HttpStatus.OK)
  async checkPermit(@Body() checkPermitDto: CheckPermitDto) {
    const result = await this.permitsService.checkPermit(
      checkPermitDto.trakheesiNumber,
      checkPermitDto.market,
    );

    return {
      valid: result.valid,
      issuer: result.issuer,
      expiryDate: result.expiryDate,
      errors: result.errors,
    };
  }

  /**
   * Get permit status (public endpoint)
   */
  @Get('status')
  @HttpCode(HttpStatus.OK)
  async getPermitStatus(@Query('trakheesi') trakheesiNumber: string) {
    const result = await this.permitsService.getPermitStatus(trakheesiNumber);

    return {
      status: result.status,
      expiryDate: result.expiryDate,
      daysUntilExpiry: result.daysUntilExpiry,
    };
  }

  /**
   * Validate permit for property publication (protected)
   */
  @Post('validate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.MARKETING, UserRole.COMPLIANCE)
  @HttpCode(HttpStatus.OK)
  async validatePermit(@Body() validatePermitDto: ValidatePermitDto) {
    const permit = await this.permitsService.validatePermitForPublish(
      validatePermitDto.trakheesiNumber,
      validatePermitDto.propertyId,
      validatePermitDto.market,
    );

    return {
      id: permit.id,
      trakheesiNumber: permit.trakheesiNumber,
      propertyId: permit.propertyId,
      status: permit.status,
      issuer: permit.issuer,
      expiryDate: permit.expiryDate,
      message: 'Permit validated and linked to property successfully',
    };
  }

  /**
   * Register new permit (compliance only)
   */
  @Post('register')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPLIANCE)
  @HttpCode(HttpStatus.CREATED)
  async registerPermit(@Body() registerPermitDto: RegisterPermitDto) {
    const permit = await this.permitsService.registerPermit(registerPermitDto);

    return {
      id: permit.id,
      trakheesiNumber: permit.trakheesiNumber,
      permitType: permit.permitType,
      market: permit.market,
      issuer: permit.issuer,
      issueDate: permit.issueDate,
      expiryDate: permit.expiryDate,
      status: permit.status,
      message: 'Permit registered successfully',
    };
  }

  /**
   * List expiring permits (compliance and marketing only)
   */
  @Get('expiring')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPLIANCE, UserRole.MARKETING)
  @HttpCode(HttpStatus.OK)
  async listExpiringPermits(@Query('days') days?: string) {
    const daysAhead = days ? parseInt(days, 10) : 30;
    const permits = await this.permitsService.listExpiringPermits(daysAhead);

    return {
      count: permits.length,
      daysAhead,
      permits: permits.map((permit) => ({
        id: permit.id,
        trakheesiNumber: permit.trakheesiNumber,
        permitType: permit.permitType,
        market: permit.market,
        issuer: permit.issuer,
        expiryDate: permit.expiryDate,
        propertyId: permit.propertyId,
        daysUntilExpiry: Math.ceil(
          (new Date(permit.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
        ),
      })),
    };
  }

  /**
   * Get validation audit trail for permit (compliance only)
   */
  @Get('audit/:trakheesiNumber')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPLIANCE)
  @HttpCode(HttpStatus.OK)
  async getAuditTrail(@Param('trakheesiNumber') trakheesiNumber: string) {
    const history = await this.permitsService.getValidationHistory(trakheesiNumber);

    return {
      trakheesiNumber,
      auditCount: history.length,
      validationHistory: history,
    };
  }
}
