import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  ReportDefinition,
  ReportCategory,
} from '../entities/report-definition.entity';
import {
  ReportExecution,
  ReportExecutionStatus,
} from '../entities/report-execution.entity';

@Injectable()
export class ReportBuilderService {
  constructor(
    @InjectRepository(ReportDefinition)
    private readonly reportDefinitionRepo: Repository<ReportDefinition>,
    @InjectRepository(ReportExecution)
    private readonly reportExecutionRepo: Repository<ReportExecution>,
    private readonly dataSource: DataSource,
  ) {}

  async executeReport(
    reportKey: string,
    parameters: Record<string, any>,
    userId: string,
  ): Promise<{
    data: any[];
    metadata: Record<string, any>;
    executionId: string;
  }> {
    const startTime = Date.now();

    // Fetch report definition
    const reportDef = await this.reportDefinitionRepo.findOne({
      where: { reportKey, isActive: true },
    });

    if (!reportDef) {
      throw new NotFoundException(`Report '${reportKey}' not found`);
    }

    // Validate parameters
    this.validateParameters(reportDef, parameters);

    // Create execution record
    const execution = this.reportExecutionRepo.create({
      reportDefinitionId: reportDef.id,
      executedBy: userId,
      parameters,
      status: ReportExecutionStatus.RUNNING,
    });
    await this.reportExecutionRepo.save(execution);

    try {
      // Build and execute query
      const query = this.buildQuery(reportDef, parameters);
      const rawData = await this.dataSource.query(query);

      // Apply aggregations if needed
      let processedData = rawData;
      if (reportDef.aggregations) {
        processedData = this.calculateAggregations(
          rawData,
          reportDef.aggregations,
        );
      }

      // Format results
      const formattedData = this.formatResults(
        processedData,
        reportDef.columns,
      );

      const executionTime = Date.now() - startTime;

      // Set expiration for cached results (24 hours)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // Update execution with results
      execution.status = ReportExecutionStatus.COMPLETED;
      execution.resultData = formattedData;
      execution.executionTimeMs = executionTime;
      execution.rowCount = formattedData.length;
      execution.expiresAt = expiresAt;
      await this.reportExecutionRepo.save(execution);

      return {
        data: formattedData,
        metadata: {
          reportName: reportDef.name,
          category: reportDef.category,
          executionTimeMs: executionTime,
          rowCount: formattedData.length,
          generatedAt: new Date(),
        },
        executionId: execution.id,
      };
    } catch (error) {
      // Update execution with error
      execution.status = ReportExecutionStatus.FAILED;
      execution.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      execution.executionTimeMs = Date.now() - startTime;
      await this.reportExecutionRepo.save(execution);

      throw new BadRequestException(
        `Report execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  buildQuery(
    reportDef: ReportDefinition,
    parameters: Record<string, any>,
  ): string {
    let query = '';

    // Build SELECT clause
    const selectCols = reportDef.columns.map((col) => {
      if (col.format) {
        return `${col.key} as "${col.label}"`;
      }
      return `${col.key}`;
    });

    if (reportDef.aggregations) {
      // Build aggregation SELECT
      const aggCols = Object.entries(reportDef.aggregations).map(
        ([key, value]: [string, any]) => {
          switch (value.type) {
            case 'sum':
              return `SUM(${value.field}) as ${key}`;
            case 'avg':
              return `AVG(${value.field}) as ${key}`;
            case 'count':
              return `COUNT(${value.field || '*'}) as ${key}`;
            case 'min':
              return `MIN(${value.field}) as ${key}`;
            case 'max':
              return `MAX(${value.field}) as ${key}`;
            default:
              return `${value.field} as ${key}`;
          }
        },
      );

      const groupByFields = reportDef.aggregations.groupBy || [];
      query = `SELECT ${groupByFields.join(', ')}${groupByFields.length > 0 ? ', ' : ''}${aggCols.join(', ')}`;
    } else {
      query = `SELECT ${selectCols.join(', ')}`;
    }

    // Add FROM clause
    query += ` FROM ${reportDef.dataSource}`;

    // Apply filters
    query = this.applyFilters(query, {
      ...reportDef.filters,
      ...parameters.filters,
    });

    // Add GROUP BY if aggregations
    if (
      reportDef.aggregations &&
      reportDef.aggregations.groupBy &&
      reportDef.aggregations.groupBy.length > 0
    ) {
      query += ` GROUP BY ${reportDef.aggregations.groupBy.join(', ')}`;
    }

    // Add ORDER BY
    if (reportDef.sorting && reportDef.sorting.length > 0) {
      const orderClauses = reportDef.sorting.map(
        (sort) => `${sort.field} ${sort.order}`,
      );
      query += ` ORDER BY ${orderClauses.join(', ')}`;
    }

    // Add pagination
    const limit = parameters.limit || 100;
    const offset = ((parameters.page || 1) - 1) * limit;
    query += ` LIMIT ${limit} OFFSET ${offset}`;

    return query;
  }

  applyFilters(query: string, filters: Record<string, any>): string {
    if (!filters || Object.keys(filters).length === 0) {
      return query;
    }

    const conditions: string[] = [];

    // Date range filters
    if (filters.dateFrom) {
      conditions.push(
        `${filters.dateField || 'createdAt'} >= '${filters.dateFrom}'`,
      );
    }
    if (filters.dateTo) {
      conditions.push(
        `${filters.dateField || 'createdAt'} <= '${filters.dateTo}'`,
      );
    }

    // Status filters
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        const statuses = filters.status.map((s) => `'${s}'`).join(', ');
        conditions.push(`status IN (${statuses})`);
      } else {
        conditions.push(`status = '${filters.status}'`);
      }
    }

    // User/Agent filters
    if (filters.userId) {
      conditions.push(`"userId" = '${filters.userId}'`);
    }
    if (filters.agentId) {
      conditions.push(`"agentId" = '${filters.agentId}'`);
    }

    // Property type filters
    if (filters.propertyType) {
      if (Array.isArray(filters.propertyType)) {
        const types = filters.propertyType.map((t) => `'${t}'`).join(', ');
        conditions.push(`"propertyType" IN (${types})`);
      } else {
        conditions.push(`"propertyType" = '${filters.propertyType}'`);
      }
    }

    // Custom filters
    if (filters.customConditions) {
      conditions.push(...filters.customConditions);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    return query;
  }

  calculateAggregations(
    data: any[],
    aggregationConfig: Record<string, any>,
  ): any[] {
    // If data is already aggregated by SQL, return as is
    if (aggregationConfig.groupBy && data.length > 0) {
      return data;
    }

    // Perform in-memory aggregation if needed
    const result: Record<string, any> = {};

    Object.entries(aggregationConfig).forEach(([key, config]: [string, any]) => {
      if (config.type === 'sum') {
        result[key] = data.reduce(
          (sum, row) => sum + (parseFloat(row[config.field]) || 0),
          0,
        );
      } else if (config.type === 'avg') {
        const sum = data.reduce(
          (s, row) => s + (parseFloat(row[config.field]) || 0),
          0,
        );
        result[key] = data.length > 0 ? sum / data.length : 0;
      } else if (config.type === 'count') {
        result[key] = data.length;
      } else if (config.type === 'min') {
        result[key] = Math.min(
          ...data.map((row) => parseFloat(row[config.field]) || 0),
        );
      } else if (config.type === 'max') {
        result[key] = Math.max(
          ...data.map((row) => parseFloat(row[config.field]) || 0),
        );
      }
    });

    return [result];
  }

  formatResults(data: any[], columnDefs: any[]): any[] {
    return data.map((row) => {
      const formatted: Record<string, any> = {};

      columnDefs.forEach((col) => {
        let value = row[col.key] || row[col.label];

        // Apply formatting based on type
        if (col.type === 'date' && value) {
          value = new Date(value).toISOString().split('T')[0];
        } else if (col.type === 'datetime' && value) {
          value = new Date(value).toISOString();
        } else if (col.type === 'currency' && value) {
          value = parseFloat(value).toFixed(2);
        } else if (col.type === 'number' && value) {
          value = parseFloat(value);
        } else if (col.type === 'percentage' && value) {
          value = (parseFloat(value) * 100).toFixed(2) + '%';
        }

        formatted[col.label || col.key] = value;
      });

      return formatted;
    });
  }

  validateParameters(
    reportDef: ReportDefinition,
    parameters: Record<string, any>,
  ): void {
    // Check required parameters
    if (reportDef.parameters?.required) {
      const missing = reportDef.parameters.required.filter(
        (param: string) => !parameters[param],
      );
      if (missing.length > 0) {
        throw new BadRequestException(
          `Missing required parameters: ${missing.join(', ')}`,
        );
      }
    }

    // Validate date ranges
    if (parameters.dateFrom && parameters.dateTo) {
      const from = new Date(parameters.dateFrom);
      const to = new Date(parameters.dateTo);
      if (from > to) {
        throw new BadRequestException('dateFrom must be before dateTo');
      }
    }
  }

  async getCachedExecution(executionId: string): Promise<any> {
    const execution = await this.reportExecutionRepo.findOne({
      where: { id: executionId },
      relations: ['reportDefinition'],
    });

    if (!execution) {
      throw new NotFoundException('Report execution not found');
    }

    // Check if cache expired
    if (execution.expiresAt && new Date() > execution.expiresAt) {
      throw new BadRequestException('Report cache has expired');
    }

    return {
      data: execution.resultData,
      metadata: {
        reportName: execution.reportDefinition.name,
        executionTimeMs: execution.executionTimeMs,
        rowCount: execution.rowCount,
        generatedAt: execution.createdAt,
        expiresAt: execution.expiresAt,
      },
      executionId: execution.id,
    };
  }

  async getReportDefinitions(
    category?: ReportCategory,
    userRoles?: string[],
  ): Promise<ReportDefinition[]> {
    const query = this.reportDefinitionRepo
      .createQueryBuilder('report')
      .where('report.isActive = :isActive', { isActive: true });

    if (category) {
      query.andWhere('report.category = :category', { category });
    }

    const reports = await query.getMany();

    // Filter by user roles
    if (userRoles && userRoles.length > 0) {
      return reports.filter((report) =>
        report.accessRoles.some((role) => userRoles.includes(role)),
      );
    }

    return reports;
  }
}
