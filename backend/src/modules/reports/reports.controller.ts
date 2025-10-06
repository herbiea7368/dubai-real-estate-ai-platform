import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  Res,
  ValidationPipe,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { ReportBuilderService } from './services/report-builder.service';
import { PrebuiltReportsService } from './services/prebuilt-reports.service';
import { DashboardService } from './services/dashboard.service';
import { ExportService } from './services/export.service';
import {
  ExecuteReportDto,
  ReportQueryDto,
  ExportReportDto,
} from './dto';
import { ReportCategory } from './entities/report-definition.entity';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(
    private readonly reportBuilderService: ReportBuilderService,
    private readonly prebuiltReportsService: PrebuiltReportsService,
    private readonly dashboardService: DashboardService,
    private readonly exportService: ExportService,
  ) {}

  @Get('definitions')
  async getReportDefinitions(
    @Query('category') category?: ReportCategory,
    @Req() req?: any,
  ) {
    const userRoles = [req.user.role];
    return this.reportBuilderService.getReportDefinitions(
      category,
      userRoles,
    );
  }

  @Post('execute')
  async executeReport(
    @Body(ValidationPipe) executeReportDto: ExecuteReportDto,
    @Req() req: any,
  ) {
    return this.reportBuilderService.executeReport(
      executeReportDto.reportKey,
      executeReportDto,
      req.user.id,
    );
  }

  @Get('executions/:id')
  async getExecution(@Param('id') id: string) {
    return this.reportBuilderService.getCachedExecution(id);
  }

  @Get('sales-summary')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MARKETING, UserRole.COMPLIANCE)
  async getSalesSummary(
    @Query(ValidationPipe) query: ReportQueryDto,
  ) {
    return this.prebuiltReportsService.getSalesSummary(
      query.dateFrom,
      query.dateTo,
    );
  }

  @Get('lead-funnel')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MARKETING, UserRole.COMPLIANCE)
  async getLeadFunnel(
    @Query(ValidationPipe) query: ReportQueryDto,
  ) {
    return this.prebuiltReportsService.getLeadFunnelReport(
      query.dateFrom,
      query.dateTo,
      query.agentId,
    );
  }

  @Get('property-performance')
  @UseGuards(RolesGuard)
  @Roles(UserRole.AGENT, UserRole.MARKETING, UserRole.COMPLIANCE)
  async getPropertyPerformance(
    @Query(ValidationPipe) query: ReportQueryDto,
  ) {
    return this.prebuiltReportsService.getPropertyPerformance(
      query.dateFrom,
      query.dateTo,
      query.limit,
    );
  }

  @Get('agent-performance')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MARKETING, UserRole.COMPLIANCE)
  async getAgentPerformance(
    @Query(ValidationPipe) query: ReportQueryDto,
  ) {
    return this.prebuiltReportsService.getAgentPerformance(
      query.dateFrom,
      query.dateTo,
    );
  }

  @Get('financial')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COMPLIANCE)
  async getFinancialReport(
    @Query(ValidationPipe) query: ReportQueryDto,
  ) {
    return this.prebuiltReportsService.getFinancialReport(
      query.dateFrom,
      query.dateTo,
    );
  }

  @Get('compliance')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COMPLIANCE)
  async getComplianceReport(
    @Query(ValidationPipe) query: ReportQueryDto,
  ) {
    return this.prebuiltReportsService.getComplianceReport(
      query.dateFrom,
      query.dateTo,
    );
  }

  @Get('marketing')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MARKETING, UserRole.COMPLIANCE)
  async getMarketingReport(
    @Query(ValidationPipe) query: ReportQueryDto,
  ) {
    return this.prebuiltReportsService.getMarketingReport(
      query.dateFrom,
      query.dateTo,
    );
  }

  @Get('dashboards/executive')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COMPLIANCE)
  async getExecutiveDashboard(
    @Query(ValidationPipe) query: ReportQueryDto,
  ) {
    return this.dashboardService.getExecutiveDashboard(
      query.dateFrom,
      query.dateTo,
    );
  }

  @Get('dashboards/agent/:agentId')
  async getAgentDashboard(
    @Param('agentId') agentId: string,
    @Query(ValidationPipe) query: ReportQueryDto,
    @Req() req: any,
  ) {
    return this.dashboardService.getAgentDashboard(
      agentId,
      query.dateFrom,
      query.dateTo,
      req.user.id,
    );
  }

  @Get('dashboards/marketing')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MARKETING, UserRole.COMPLIANCE)
  async getMarketingDashboard(
    @Query(ValidationPipe) query: ReportQueryDto,
  ) {
    return this.dashboardService.getMarketingDashboard(
      query.dateFrom,
      query.dateTo,
    );
  }

  @Get('dashboards/compliance')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COMPLIANCE)
  async getComplianceDashboard(
    @Query(ValidationPipe) query: ReportQueryDto,
  ) {
    return this.dashboardService.getComplianceDashboard(
      query.dateFrom,
      query.dateTo,
    );
  }

  @Post('executions/:id/export')
  async exportReport(
    @Param('id') id: string,
    @Body(ValidationPipe) exportDto: ExportReportDto,
    @Res() res: Response,
  ) {
    const execution = await this.reportBuilderService.getCachedExecution(id);

    const filename =
      exportDto.filename || `report_${id}_${Date.now()}`;

    let result: {
      buffer: Buffer;
      contentType: string;
      filename: string;
    };

    switch (exportDto.format) {
      case 'csv':
        result = this.exportService.exportToCSV(
          execution.data,
          filename,
        );
        break;
      case 'excel':
        result = this.exportService.exportToExcel(
          execution.data,
          filename,
        );
        break;
      case 'pdf':
        result = this.exportService.exportToPDF(
          execution.data,
          'standard',
          filename,
        );
        break;
      default:
        result = this.exportService.exportToCSV(
          execution.data,
          filename,
        );
    }

    res.setHeader('Content-Type', result.contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.filename}"`,
    );
    res.send(result.buffer);
  }
}
