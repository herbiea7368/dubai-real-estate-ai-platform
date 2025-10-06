import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportDefinition } from './entities/report-definition.entity';
import { ReportExecution } from './entities/report-execution.entity';
import { ReportsController } from './reports.controller';
import { ReportBuilderService } from './services/report-builder.service';
import { PrebuiltReportsService } from './services/prebuilt-reports.service';
import { DashboardService } from './services/dashboard.service';
import { ExportService } from './services/export.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReportDefinition, ReportExecution]),
  ],
  controllers: [ReportsController],
  providers: [
    ReportBuilderService,
    PrebuiltReportsService,
    DashboardService,
    ExportService,
  ],
  exports: [
    ReportBuilderService,
    PrebuiltReportsService,
    DashboardService,
    ExportService,
  ],
})
export class ReportsModule {}
