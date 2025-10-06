import { Injectable, ForbiddenException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PrebuiltReportsService } from './prebuilt-reports.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly prebuiltReportsService: PrebuiltReportsService,
  ) {}

  async getExecutiveDashboard(
    dateFrom: string,
    dateTo: string,
  ): Promise<{
    data: any;
    metadata: Record<string, any>;
  }> {
    // Get key metrics
    const keyMetrics = await this.dataSource.query(
      `
      SELECT
        COUNT(DISTINCT l.id) as total_listings,
        COUNT(DISTINCT ld.id) as total_leads,
        COUNT(DISTINCT CASE WHEN ld.status = 'converted' THEN ld.id END) as total_conversions,
        COALESCE(SUM(p.amount), 0) as total_revenue,
        CASE
          WHEN COUNT(DISTINCT ld.id) > 0
          THEN ROUND(COUNT(DISTINCT CASE WHEN ld.status = 'converted' THEN ld.id END)::numeric / COUNT(DISTINCT ld.id) * 100, 2)
          ELSE 0
        END as conversion_rate
      FROM listings l
      LEFT JOIN leads ld ON ld."propertyId" = l."propertyId"
      LEFT JOIN payments p ON p."propertyId" = l."propertyId" AND p.status = 'completed'
      WHERE l."createdAt" BETWEEN $1 AND $2
    `,
      [dateFrom, dateTo],
    );

    // Calculate trends (week over week)
    const oneWeekAgo = new Date(new Date(dateTo).getTime() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    const twoWeeksAgo = new Date(new Date(dateTo).getTime() - 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const lastWeek = await this.dataSource.query(
      `
      SELECT
        COUNT(DISTINCT l.id) as listings,
        COUNT(DISTINCT ld.id) as leads,
        COALESCE(SUM(p.amount), 0) as revenue
      FROM listings l
      LEFT JOIN leads ld ON ld."propertyId" = l."propertyId"
      LEFT JOIN payments p ON p."propertyId" = l."propertyId" AND p.status = 'completed'
      WHERE l."createdAt" BETWEEN $1 AND $2
    `,
      [oneWeekAgo, dateTo],
    );

    const previousWeek = await this.dataSource.query(
      `
      SELECT
        COUNT(DISTINCT l.id) as listings,
        COUNT(DISTINCT ld.id) as leads,
        COALESCE(SUM(p.amount), 0) as revenue
      FROM listings l
      LEFT JOIN leads ld ON ld."propertyId" = l."propertyId"
      LEFT JOIN payments p ON p."propertyId" = l."propertyId" AND p.status = 'completed'
      WHERE l."createdAt" BETWEEN $1 AND $2
    `,
      [twoWeeksAgo, oneWeekAgo],
    );

    const trends = {
      listings_wow: this.calculatePercentageChange(
        lastWeek[0].listings,
        previousWeek[0].listings,
      ),
      leads_wow: this.calculatePercentageChange(
        lastWeek[0].leads,
        previousWeek[0].leads,
      ),
      revenue_wow: this.calculatePercentageChange(
        lastWeek[0].revenue,
        previousWeek[0].revenue,
      ),
    };

    // Top performers
    const topAgents = await this.dataSource.query(
      `
      SELECT
        u.id,
        u.name,
        COUNT(DISTINCT ld.id) FILTER (WHERE ld.status = 'converted') as conversions,
        COALESCE(SUM(p.amount), 0) as revenue
      FROM users u
      LEFT JOIN leads ld ON ld."assignedTo" = u.id
      LEFT JOIN listings l ON l."propertyId" = ld."propertyId"
      LEFT JOIN payments p ON p."propertyId" = l."propertyId" AND p.status = 'completed'
      WHERE u.role = 'agent' AND ld."createdAt" BETWEEN $1 AND $2
      GROUP BY u.id, u.name
      ORDER BY revenue DESC
      LIMIT 5
    `,
      [dateFrom, dateTo],
    );

    const topProperties = await this.dataSource.query(
      `
      SELECT
        p.id,
        p.title,
        COUNT(DISTINCT ae.id) FILTER (WHERE ae."eventType" = 'property_view') as views,
        COUNT(DISTINCT ld.id) FILTER (WHERE ld.status = 'converted') as conversions
      FROM properties p
      LEFT JOIN analytics_events ae ON ae."propertyId" = p.id
      LEFT JOIN leads ld ON ld."propertyId" = p.id
      WHERE ae."createdAt" BETWEEN $1 AND $2
      GROUP BY p.id, p.title
      ORDER BY conversions DESC, views DESC
      LIMIT 5
    `,
      [dateFrom, dateTo],
    );

    // Alerts
    const alerts = await this.getExecutiveAlerts();

    return {
      data: {
        key_metrics: keyMetrics[0],
        trends,
        top_agents: topAgents,
        top_properties: topProperties,
        alerts,
      },
      metadata: {
        reportName: 'Executive Dashboard',
        generatedAt: new Date(),
        dateRange: { from: dateFrom, to: dateTo },
      },
    };
  }

  async getAgentDashboard(
    agentId: string,
    dateFrom: string,
    dateTo: string,
    requestingUserId: string,
  ): Promise<{
    data: any;
    metadata: Record<string, any>;
  }> {
    // Security check: agents can only view their own dashboard
    if (agentId !== requestingUserId) {
      const requestingUser = await this.dataSource.query(
        `SELECT role FROM users WHERE id = $1`,
        [requestingUserId],
      );
      if (
        !requestingUser[0] ||
        !['compliance', 'marketing'].includes(requestingUser[0].role)
      ) {
        throw new ForbiddenException(
          'You can only view your own dashboard',
        );
      }
    }

    // Personal metrics
    const personalMetrics = await this.dataSource.query(
      `
      SELECT
        COUNT(DISTINCT l.id) as my_listings,
        COUNT(DISTINCT ld.id) as my_leads,
        COUNT(DISTINCT CASE WHEN ld.status = 'converted' THEN ld.id END) as my_conversions,
        COALESCE(SUM(p.amount), 0) as my_commissions,
        ROUND(AVG(EXTRACT(EPOCH FROM (la."createdAt" - ld."createdAt")) / 3600), 2) as avg_response_time_hours
      FROM listings l
      LEFT JOIN leads ld ON ld."propertyId" = l."propertyId" AND ld."assignedTo" = $1
      LEFT JOIN lead_activities la ON la."leadId" = ld.id AND la."activityType" = 'status_change'
      LEFT JOIN payments p ON p."propertyId" = l."propertyId" AND p.status = 'completed'
      WHERE l."agentId" = $1 AND l."createdAt" BETWEEN $2 AND $3
    `,
      [agentId, dateFrom, dateTo],
    );

    // Leads pipeline
    const leadsPipeline = await this.dataSource.query(
      `
      SELECT
        status,
        tier,
        COUNT(*) as count
      FROM leads
      WHERE "assignedTo" = $1 AND "createdAt" BETWEEN $2 AND $3
      GROUP BY status, tier
      ORDER BY status, tier
    `,
      [agentId, dateFrom, dateTo],
    );

    // Upcoming tasks
    const upcomingTasks = await this.dataSource.query(
      `
      SELECT
        ld.id as lead_id,
        ld."fullName" as lead_name,
        ld.status,
        la."activityType",
        la."createdAt" as last_activity
      FROM leads ld
      LEFT JOIN lead_activities la ON la."leadId" = ld.id
      WHERE ld."assignedTo" = $1 AND ld.status NOT IN ('converted', 'lost')
      ORDER BY la."createdAt" ASC
      LIMIT 10
    `,
      [agentId],
    );

    // Comparison to team average
    const teamAverage = await this.dataSource.query(
      `
      SELECT
        AVG(conversions) as avg_conversions,
        AVG(revenue) as avg_revenue
      FROM (
        SELECT
          u.id,
          COUNT(DISTINCT CASE WHEN ld.status = 'converted' THEN ld.id END) as conversions,
          COALESCE(SUM(p.amount), 0) as revenue
        FROM users u
        LEFT JOIN leads ld ON ld."assignedTo" = u.id AND ld."createdAt" BETWEEN $1 AND $2
        LEFT JOIN listings l ON l."propertyId" = ld."propertyId"
        LEFT JOIN payments p ON p."propertyId" = l."propertyId" AND p.status = 'completed'
        WHERE u.role = 'agent'
        GROUP BY u.id
      ) team_stats
    `,
      [dateFrom, dateTo],
    );

    return {
      data: {
        personal_metrics: personalMetrics[0],
        leads_pipeline: leadsPipeline,
        upcoming_tasks: upcomingTasks,
        team_comparison: {
          my_conversions: personalMetrics[0].my_conversions,
          team_avg_conversions: Math.round(
            teamAverage[0].avg_conversions || 0,
          ),
          my_revenue: personalMetrics[0].my_commissions,
          team_avg_revenue: Math.round(teamAverage[0].avg_revenue || 0),
        },
      },
      metadata: {
        reportName: 'Agent Dashboard',
        agentId,
        generatedAt: new Date(),
        dateRange: { from: dateFrom, to: dateTo },
      },
    };
  }

  async getMarketingDashboard(
    dateFrom: string,
    dateTo: string,
  ): Promise<{
    data: any;
    metadata: Record<string, any>;
  }> {
    // Get funnel metrics
    const funnelMetrics = await this.dataSource.query(
      `
      SELECT
        COUNT(DISTINCT ae.id) FILTER (WHERE ae."eventType" = 'property_view') as total_views,
        COUNT(DISTINCT ae.id) FILTER (WHERE ae."eventType" = 'contact_agent') as total_contacts,
        COUNT(DISTINCT ld.id) as total_leads,
        COUNT(DISTINCT CASE WHEN ld.status = 'converted' THEN ld.id END) as total_conversions,
        ROUND(
          COUNT(DISTINCT ae.id) FILTER (WHERE ae."eventType" = 'contact_agent')::numeric /
          NULLIF(COUNT(DISTINCT ae.id) FILTER (WHERE ae."eventType" = 'property_view'), 0) * 100,
          2
        ) as view_to_contact_rate,
        ROUND(
          COUNT(DISTINCT ld.id)::numeric /
          NULLIF(COUNT(DISTINCT ae.id) FILTER (WHERE ae."eventType" = 'contact_agent'), 0) * 100,
          2
        ) as contact_to_lead_rate,
        ROUND(
          COUNT(DISTINCT CASE WHEN ld.status = 'converted' THEN ld.id END)::numeric /
          NULLIF(COUNT(DISTINCT ld.id), 0) * 100,
          2
        ) as lead_to_conversion_rate
      FROM analytics_events ae
      LEFT JOIN leads ld ON ld."propertyId" = ae."propertyId"
      WHERE ae."createdAt" BETWEEN $1 AND $2
    `,
      [dateFrom, dateTo],
    );

    // Get marketing report data
    const marketingData = await this.prebuiltReportsService.getMarketingReport(
      dateFrom,
      dateTo,
    );

    // Lead quality by source
    const leadQuality = await this.dataSource.query(
      `
      SELECT
        source,
        COUNT(*) as total_leads,
        COUNT(*) FILTER (WHERE tier = 'hot') as hot_leads,
        COUNT(*) FILTER (WHERE status = 'converted') as conversions,
        ROUND(AVG(EXTRACT(EPOCH FROM ("convertedAt" - "createdAt")) / 86400), 2) as avg_days_to_convert
      FROM leads
      WHERE "createdAt" BETWEEN $1 AND $2
      GROUP BY source
      ORDER BY conversions DESC
    `,
      [dateFrom, dateTo],
    );

    return {
      data: {
        funnel_metrics: funnelMetrics[0],
        channel_effectiveness: marketingData.data.channel_effectiveness,
        lead_quality: leadQuality,
        search_analytics: marketingData.data.search_analytics,
        top_content: marketingData.data.top_converting_content,
      },
      metadata: {
        reportName: 'Marketing Dashboard',
        generatedAt: new Date(),
        dateRange: { from: dateFrom, to: dateTo },
      },
    };
  }

  async getComplianceDashboard(
    dateFrom: string,
    dateTo: string,
  ): Promise<{
    data: any;
    metadata: Record<string, any>;
  }> {
    const complianceData =
      await this.prebuiltReportsService.getComplianceReport(dateFrom, dateTo);

    // Additional audit log summary
    const auditSummary = await this.dataSource.query(
      `
      SELECT
        'documents_processed' as metric,
        COUNT(*) as count
      FROM documents
      WHERE "uploadedAt" BETWEEN $1 AND $2
      UNION ALL
      SELECT
        'messages_screened' as metric,
        COUNT(*) as count
      FROM messages
      WHERE "createdAt" BETWEEN $1 AND $2
      UNION ALL
      SELECT
        'consent_requests' as metric,
        COUNT(*) as count
      FROM consents
      WHERE "createdAt" BETWEEN $1 AND $2
    `,
      [dateFrom, dateTo],
    );

    return {
      data: {
        permit_compliance: complianceData.data.permit_compliance,
        tdra_compliance: complianceData.data.tdra_compliance,
        consent_compliance: complianceData.data.consent_compliance,
        document_verification: complianceData.data.document_verification,
        audit_summary: auditSummary,
      },
      metadata: {
        reportName: 'Compliance Dashboard',
        generatedAt: new Date(),
        dateRange: { from: dateFrom, to: dateTo },
      },
    };
  }

  private async getExecutiveAlerts(): Promise<any[]> {
    const alerts = [];

    // Expiring permits
    const expiringPermits = await this.dataSource.query(
      `
      SELECT COUNT(*) as count
      FROM permits
      WHERE "expiryDate" BETWEEN NOW() AND NOW() + INTERVAL '30 days'
        AND status = 'active'
    `,
    );

    if (expiringPermits[0].count > 0) {
      alerts.push({
        type: 'warning',
        message: `${expiringPermits[0].count} permits expiring within 30 days`,
        action: 'Review permit renewals',
      });
    }

    // Overdue installments
    const overdueInstallments = await this.dataSource.query(
      `
      SELECT COUNT(*) as count, SUM(amount) as total
      FROM installment_plans
      WHERE status = 'overdue'
    `,
    );

    if (overdueInstallments[0].count > 0) {
      alerts.push({
        type: 'critical',
        message: `${overdueInstallments[0].count} overdue installments totaling AED ${parseFloat(overdueInstallments[0].total).toFixed(2)}`,
        action: 'Follow up on payments',
      });
    }

    // Low conversion rate
    const conversionRate = await this.dataSource.query(
      `
      SELECT
        ROUND(
          COUNT(*) FILTER (WHERE status = 'converted')::numeric /
          NULLIF(COUNT(*), 0) * 100,
          2
        ) as rate
      FROM leads
      WHERE "createdAt" >= NOW() - INTERVAL '30 days'
    `,
    );

    if (conversionRate[0].rate < 10) {
      alerts.push({
        type: 'info',
        message: `Conversion rate is ${conversionRate[0].rate}% (below 10% threshold)`,
        action: 'Review lead quality and agent performance',
      });
    }

    return alerts;
  }

  private calculatePercentageChange(current: number, previous: number): string {
    if (previous === 0) return current > 0 ? '+100%' : '0%';
    const change = ((current - previous) / previous) * 100;
    return change > 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
  }
}
