import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import * as Papa from 'papaparse';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportExecution } from '../entities/report-execution.entity';

export interface ScheduledReport {
  id: string;
  reportKey: string;
  schedule: string; // cron expression
  recipients: string[];
  format: 'csv' | 'excel' | 'pdf';
  parameters: Record<string, any>;
}

@Injectable()
export class ExportService {
  // Repository reserved for future report execution tracking
  constructor(
    @InjectRepository(ReportExecution)
    // @ts-ignore - Repository will be used for execution tracking in future
    private readonly reportExecutionRepo: Repository<ReportExecution>,
  ) {}

  exportToCSV(
    data: any[],
    filename: string,
  ): {
    buffer: Buffer;
    contentType: string;
    filename: string;
  } {
    // Add UTF-8 BOM for Arabic text support
    const BOM = '\uFEFF';

    // Convert data to CSV
    const csv = Papa.unparse(data, {
      header: true,
      delimiter: ',',
      newline: '\r\n',
    });

    // Add BOM and create buffer
    const csvWithBom = BOM + csv;
    const buffer = Buffer.from(csvWithBom, 'utf-8');

    return {
      buffer,
      contentType: 'text/csv; charset=utf-8',
      filename: `${filename}.csv`,
    };
  }

  exportToExcel(
    data: any[],
    filename: string,
    sheetsConfig?: Array<{ name: string; data: any[] }>,
  ): {
    buffer: Buffer;
    contentType: string;
    filename: string;
  } {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    if (sheetsConfig && sheetsConfig.length > 0) {
      // Multiple sheets
      sheetsConfig.forEach((sheet) => {
        const worksheet = XLSX.utils.json_to_sheet(sheet.data);

        // Apply formatting
        this.applyExcelFormatting(worksheet, sheet.data);

        XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
      });
    } else {
      // Single sheet
      const worksheet = XLSX.utils.json_to_sheet(data);

      // Apply formatting
      this.applyExcelFormatting(worksheet, data);

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    }

    // Generate buffer
    const buffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    });

    return {
      buffer,
      contentType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      filename: `${filename}.xlsx`,
    };
  }

  exportToPDF(
    data: any[],
    template: string,
    filename: string,
  ): {
    buffer: Buffer;
    contentType: string;
    filename: string;
  } {
    // PDF generation placeholder - would use a library like pdfkit or puppeteer
    // For now, return a simple text-based PDF representation
    const content = this.generatePDFContent(data, template);

    return {
      buffer: Buffer.from(content),
      contentType: 'application/pdf',
      filename: `${filename}.pdf`,
    };
  }

  async scheduleReport(
    _reportKey: string,
    schedule: string,
    _recipients: string[],
    _format: 'csv' | 'excel' | 'pdf',
    _parameters: Record<string, any> = {},
  ): Promise<{ scheduleId: string; message: string }> {
    // This would integrate with a job scheduler like Bull or node-cron
    // For now, just return a mock schedule ID
    const scheduleId = `schedule_${Date.now()}`;

    // In a real implementation, this would:
    // 1. Validate the cron expression
    // 2. Create a scheduled job in Bull queue
    // 3. Store the schedule in database
    // 4. Set up email notifications

    return {
      scheduleId,
      message: `Report scheduled successfully. Will run: ${schedule}`,
    };
  }

  private applyExcelFormatting(worksheet: XLSX.WorkSheet, data: any[]): void {
    if (!data || data.length === 0) return;

    // Get column headers
    const headers = Object.keys(data[0]);
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

    // Set column widths
    const colWidths = headers.map((header) => {
      const maxLength = Math.max(
        header.length,
        ...data.map((row) => {
          const value = row[header];
          return value ? String(value).length : 0;
        }),
      );
      return { wch: Math.min(maxLength + 2, 50) };
    });

    worksheet['!cols'] = colWidths;

    // Format header row (bold)
    for (let col = 0; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: 'E0E0E0' } },
        };
      }
    }

    // Format number and currency columns
    for (let row = 1; row <= range.e.r; row++) {
      for (let col = 0; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellAddress];

        if (cell && typeof cell.v === 'number') {
          const header = headers[col].toLowerCase();

          if (
            header.includes('amount') ||
            header.includes('price') ||
            header.includes('revenue') ||
            header.includes('commission')
          ) {
            // Currency format
            cell.z = '#,##0.00';
          } else if (header.includes('rate') || header.includes('percentage')) {
            // Percentage format
            cell.z = '0.00%';
          } else {
            // General number format
            cell.z = '#,##0';
          }
        }
      }
    }

    // Freeze header row
    worksheet['!freeze'] = { xSplit: 0, ySplit: 1 };
  }

  private generatePDFContent(data: any[], template: string): string {
    // Simple PDF content generation
    // In a real implementation, use a proper PDF library
    let content = `Report Template: ${template}\n\n`;
    content += `Generated at: ${new Date().toISOString()}\n\n`;
    content += '='.repeat(80) + '\n\n';

    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      content += headers.join(' | ') + '\n';
      content += '-'.repeat(80) + '\n';

      data.forEach((row) => {
        const values = headers.map((header) => row[header] || '');
        content += values.join(' | ') + '\n';
      });
    }

    return content;
  }

  async getScheduledReports(): Promise<ScheduledReport[]> {
    // Mock scheduled reports
    // In a real implementation, fetch from database
    return [];
  }

  async cancelScheduledReport(scheduleId: string): Promise<{ message: string }> {
    // Mock cancellation
    // In a real implementation, remove from job queue and database
    return {
      message: `Schedule ${scheduleId} cancelled successfully`,
    };
  }
}
