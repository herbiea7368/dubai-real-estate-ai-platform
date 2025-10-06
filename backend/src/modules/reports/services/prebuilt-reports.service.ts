import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class PrebuiltReportsService {
  constructor(private readonly dataSource: DataSource) {}

  async getSalesSummary(
    dateFrom: string,
    dateTo: string,
  ): Promise<{
    data: any[];
    metadata: Record<string, any>;
  }> {
    const query = `
      SELECT
        DATE_TRUNC('month', l."createdAt") as month,
        COUNT(DISTINCT l.id) as total_listings,
        COUNT(DISTINCT ld.id) as total_leads,
        COUNT(DISTINCT CASE WHEN ld.status = 'converted' THEN ld.id END) as total_conversions,
        COALESCE(SUM(p.amount), 0) as total_revenue,
        CASE
          WHEN COUNT(DISTINCT ld.id) > 0
          THEN ROUND(COUNT(DISTINCT CASE WHEN ld.status = 'converted' THEN ld.id END)::numeric / COUNT(DISTINCT ld.id) * 100, 2)
          ELSE 0
        END as conversion_rate,
        CASE
          WHEN COUNT(DISTINCT CASE WHEN ld.status = 'converted' THEN ld.id END) > 0
          THEN ROUND(COALESCE(SUM(p.amount), 0) / COUNT(DISTINCT CASE WHEN ld.status = 'converted' THEN ld.id END), 2)
          ELSE 0
        END as average_deal_size
      FROM listings l
      LEFT JOIN leads ld ON ld."propertyId" = l."propertyId"
      LEFT JOIN payments p ON p."propertyId" = l."propertyId" AND p.status = 'completed'
      WHERE l."createdAt" BETWEEN $1 AND $2
      GROUP BY DATE_TRUNC('month', l."createdAt")
      ORDER BY month DESC
    `;

    const data = await this.dataSource.query(query, [dateFrom, dateTo]);

    return {
      data,
      metadata: {
        reportName: 'Sales Summary',
        generatedAt: new Date(),
        dateRange: { from: dateFrom, to: dateTo },
      },
    };
  }

  async getLeadFunnelReport(
    dateFrom: string,
    dateTo: string,
    agentId?: string,
  ): Promise<{
    data: any[];
    metadata: Record<string, any>;
  }> {
    let query = `
      SELECT
        source,
        tier,
        status,
        COUNT(*) as lead_count,
        ROUND(AVG(EXTRACT(EPOCH FROM (CASE WHEN status = 'converted' THEN "convertedAt" ELSE NOW() END - "createdAt")) / 86400), 2) as avg_days_to_conversion
      FROM leads
      WHERE "createdAt" BETWEEN $1 AND $2
    `;

    const params: any[] = [dateFrom, dateTo];

    if (agentId) {
      query += ` AND "assignedTo" = $3`;
      params.push(agentId);
    }

    query += `
      GROUP BY source, tier, status
      ORDER BY source, tier, status
    `;

    const rawData = await this.dataSource.query(query, params);

    // Calculate conversion rates by source
    const bySource = rawData.reduce((acc: any, row: any) => {
      if (!acc[row.source]) {
        acc[row.source] = { total: 0, converted: 0 };
      }
      acc[row.source].total += parseInt(row.lead_count);
      if (row.status === 'converted') {
        acc[row.source].converted += parseInt(row.lead_count);
      }
      return acc;
    }, {});

    const conversionRates = Object.entries(bySource).map(
      ([source, stats]: [string, any]) => ({
        source,
        total_leads: stats.total,
        converted_leads: stats.converted,
        conversion_rate: stats.total > 0
          ? ((stats.converted / stats.total) * 100).toFixed(2) + '%'
          : '0%',
      }),
    );

    return {
      data: [
        ...rawData,
        ...conversionRates,
      ],
      metadata: {
        reportName: 'Lead Funnel Report',
        generatedAt: new Date(),
        dateRange: { from: dateFrom, to: dateTo },
        agentId: agentId || 'all',
      },
    };
  }

  async getPropertyPerformance(
    dateFrom: string,
    dateTo: string,
    topN: number = 10,
  ): Promise<{
    data: any[];
    metadata: Record<string, any>;
  }> {
    const query = `
      SELECT
        p.id as property_id,
        p.title,
        p."propertyType",
        l.status as listing_status,
        COUNT(DISTINCT ae.id) FILTER (WHERE ae."eventType" = 'property_view') as views,
        COUNT(DISTINCT ae.id) FILTER (WHERE ae."eventType" = 'contact_agent') as contacts,
        COUNT(DISTINCT ae.id) FILTER (WHERE ae."eventType" = 'add_favorite') as favorites,
        COUNT(DISTINCT ld.id) as total_leads,
        COUNT(DISTINCT CASE WHEN ld.status = 'converted' THEN ld.id END) as conversions,
        CASE
          WHEN COUNT(DISTINCT ld.id) > 0
          THEN ROUND(COUNT(DISTINCT CASE WHEN ld.status = 'converted' THEN ld.id END)::numeric / COUNT(DISTINCT ld.id) * 100, 2)
          ELSE 0
        END as conversion_rate,
        EXTRACT(DAY FROM (NOW() - l."createdAt")) as days_on_market,
        ROUND(
          COUNT(DISTINCT ae.id) FILTER (WHERE ae."eventType" = 'property_view')::numeric /
          NULLIF(EXTRACT(DAY FROM (NOW() - l."createdAt")), 0),
          2
        ) as avg_views_per_day
      FROM properties p
      LEFT JOIN listings l ON l."propertyId" = p.id
      LEFT JOIN analytics_events ae ON ae."propertyId" = p.id AND ae."createdAt" BETWEEN $1 AND $2
      LEFT JOIN leads ld ON ld."propertyId" = p.id AND ld."createdAt" BETWEEN $1 AND $2
      WHERE l."createdAt" BETWEEN $1 AND $2
      GROUP BY p.id, p.title, p."propertyType", l.status, l."createdAt"
      ORDER BY conversion_rate DESC, views DESC
      LIMIT $3
    `;

    const data = await this.dataSource.query(query, [dateFrom, dateTo, topN]);

    return {
      data,
      metadata: {
        reportName: 'Property Performance',
        generatedAt: new Date(),
        dateRange: { from: dateFrom, to: dateTo },
        topN,
      },
    };
  }

  async getAgentPerformance(
    dateFrom: string,
    dateTo: string,
  ): Promise<{
    data: any[];
    metadata: Record<string, any>;
  }> {
    const query = `
      SELECT
        u.id as agent_id,
        u.name as agent_name,
        u.email,
        COUNT(DISTINCT l.id) as listings_created,
        COUNT(DISTINCT ld.id) as leads_assigned,
        COUNT(DISTINCT CASE WHEN ld.status = 'converted' THEN ld.id END) as leads_converted,
        COALESCE(SUM(p.amount), 0) as total_revenue,
        CASE
          WHEN COUNT(DISTINCT CASE WHEN ld.status = 'converted' THEN ld.id END) > 0
          THEN ROUND(COALESCE(SUM(p.amount), 0) / COUNT(DISTINCT CASE WHEN ld.status = 'converted' THEN ld.id END), 2)
          ELSE 0
        END as avg_deal_size,
        ROUND(
          AVG(EXTRACT(EPOCH FROM (la."createdAt" - ld."createdAt")) / 3600)
          FILTER (WHERE la."activityType" = 'status_change' AND la."createdAt" > ld."createdAt")
        , 2) as avg_response_time_hours,
        CASE
          WHEN COUNT(DISTINCT ld.id) > 0
          THEN ROUND(COUNT(DISTINCT CASE WHEN ld.status = 'converted' THEN ld.id END)::numeric / COUNT(DISTINCT ld.id) * 100, 2)
          ELSE 0
        END as conversion_rate
      FROM users u
      LEFT JOIN listings l ON l."agentId" = u.id AND l."createdAt" BETWEEN $1 AND $2
      LEFT JOIN leads ld ON ld."assignedTo" = u.id AND ld."createdAt" BETWEEN $1 AND $2
      LEFT JOIN lead_activities la ON la."leadId" = ld.id
      LEFT JOIN payments p ON p."propertyId" = l."propertyId" AND p.status = 'completed'
      WHERE u.role = 'agent'
      GROUP BY u.id, u.name, u.email
      ORDER BY total_revenue DESC, leads_converted DESC
    `;

    const data = await this.dataSource.query(query, [dateFrom, dateTo]);

    return {
      data,
      metadata: {
        reportName: 'Agent Performance Leaderboard',
        generatedAt: new Date(),
        dateRange: { from: dateFrom, to: dateTo },
      },
    };
  }

  async getFinancialReport(
    dateFrom: string,
    dateTo: string,
  ): Promise<{
    data: any;
    metadata: Record<string, any>;
  }> {
    // Total payments by type
    const paymentsByType = await this.dataSource.query(
      `
      SELECT
        "paymentType",
        COUNT(*) as transaction_count,
        SUM(amount) as total_amount
      FROM payments
      WHERE "createdAt" BETWEEN $1 AND $2 AND status = 'completed'
      GROUP BY "paymentType"
      ORDER BY total_amount DESC
    `,
      [dateFrom, dateTo],
    );

    // Monthly breakdown
    const monthlyBreakdown = await this.dataSource.query(
      `
      SELECT
        DATE_TRUNC('month', "createdAt") as month,
        SUM(amount) as total_payments,
        COUNT(*) as transaction_count,
        AVG(amount) as avg_transaction_size
      FROM payments
      WHERE "createdAt" BETWEEN $1 AND $2 AND status = 'completed'
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month DESC
    `,
      [dateFrom, dateTo],
    );

    // Escrow balances
    const escrowBalances = await this.dataSource.query(
      `
      SELECT
        status,
        COUNT(*) as account_count,
        SUM(balance) as total_balance
      FROM escrow_accounts
      GROUP BY status
    `,
    );

    // Pending installments
    const pendingInstallments = await this.dataSource.query(
      `
      SELECT
        COUNT(*) as total_installments,
        SUM(amount) as total_amount,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        SUM(amount) FILTER (WHERE status = 'pending') as pending_amount,
        COUNT(*) FILTER (WHERE status = 'overdue') as overdue_count,
        SUM(amount) FILTER (WHERE status = 'overdue') as overdue_amount
      FROM installment_plans
      WHERE "dueDate" BETWEEN $1 AND $2
    `,
      [dateFrom, dateTo],
    );

    // Refunds
    const refunds = await this.dataSource.query(
      `
      SELECT
        COUNT(*) as refund_count,
        COALESCE(SUM(amount), 0) as total_refunded
      FROM payments
      WHERE "createdAt" BETWEEN $1 AND $2 AND status = 'refunded'
    `,
      [dateFrom, dateTo],
    );

    return {
      data: {
        payments_by_type: paymentsByType,
        monthly_breakdown: monthlyBreakdown,
        escrow_summary: escrowBalances,
        installments_summary: pendingInstallments[0] || {},
        refunds_summary: refunds[0] || {},
      },
      metadata: {
        reportName: 'Financial Report',
        generatedAt: new Date(),
        dateRange: { from: dateFrom, to: dateTo },
      },
    };
  }

  async getComplianceReport(
    dateFrom: string,
    dateTo: string,
  ): Promise<{
    data: any;
    metadata: Record<string, any>;
  }> {
    // Permit compliance
    const permitCompliance = await this.dataSource.query(
      `
      SELECT
        COUNT(DISTINCT l.id) as total_listings,
        COUNT(DISTINCT CASE WHEN pm.status = 'active' AND pm."expiryDate" > NOW() THEN l.id END) as listings_with_valid_permits,
        COUNT(DISTINCT CASE WHEN pm."expiryDate" <= NOW() + INTERVAL '30 days' THEN l.id END) as permits_expiring_soon,
        COUNT(DISTINCT CASE WHEN pm."expiryDate" <= NOW() THEN l.id END) as expired_permits
      FROM listings l
      LEFT JOIN permits pm ON pm."propertyId" = l."propertyId"
      WHERE l."createdAt" BETWEEN $1 AND $2
    `,
      [dateFrom, dateTo],
    );

    // TDRA compliance
    const tdraCompliance = await this.dataSource.query(
      `
      SELECT
        COUNT(*) as total_messages,
        COUNT(*) FILTER (WHERE status = 'blocked') as blocked_messages,
        ROUND(
          COUNT(*) FILTER (WHERE status = 'blocked')::numeric / NULLIF(COUNT(*), 0) * 100,
          2
        ) as block_rate
      FROM messages
      WHERE "createdAt" BETWEEN $1 AND $2
    `,
      [dateFrom, dateTo],
    );

    // Consent compliance
    const consentCompliance = await this.dataSource.query(
      `
      SELECT
        COUNT(DISTINCT "userId") as total_users,
        COUNT(DISTINCT CASE WHEN status = 'granted' THEN "userId" END) as users_with_consent,
        ROUND(
          COUNT(DISTINCT CASE WHEN status = 'granted' THEN "userId" END)::numeric /
          NULLIF(COUNT(DISTINCT "userId"), 0) * 100,
          2
        ) as consent_rate
      FROM consents
      WHERE "createdAt" BETWEEN $1 AND $2
    `,
      [dateFrom, dateTo],
    );

    // Document verification
    const documentVerification = await this.dataSource.query(
      `
      SELECT
        "processingStatus",
        COUNT(*) as document_count,
        ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER () * 100, 2) as percentage
      FROM documents
      WHERE "uploadedAt" BETWEEN $1 AND $2
      GROUP BY "processingStatus"
    `,
      [dateFrom, dateTo],
    );

    return {
      data: {
        permit_compliance: permitCompliance[0] || {},
        tdra_compliance: tdraCompliance[0] || {},
        consent_compliance: consentCompliance[0] || {},
        document_verification: documentVerification,
      },
      metadata: {
        reportName: 'Compliance Report',
        generatedAt: new Date(),
        dateRange: { from: dateFrom, to: dateTo },
      },
    };
  }

  async getMarketingReport(
    dateFrom: string,
    dateTo: string,
  ): Promise<{
    data: any;
    metadata: Record<string, any>;
  }> {
    // Channel effectiveness
    const channelEffectiveness = await this.dataSource.query(
      `
      SELECT
        source as channel,
        COUNT(DISTINCT id) as total_leads,
        COUNT(DISTINCT CASE WHEN status = 'converted' THEN id END) as conversions,
        ROUND(
          COUNT(DISTINCT CASE WHEN status = 'converted' THEN id END)::numeric /
          NULLIF(COUNT(DISTINCT id), 0) * 100,
          2
        ) as conversion_rate
      FROM leads
      WHERE "createdAt" BETWEEN $1 AND $2
      GROUP BY source
      ORDER BY conversions DESC
    `,
      [dateFrom, dateTo],
    );

    // Search analytics
    const searchAnalytics = await this.dataSource.query(
      `
      SELECT
        "eventType",
        COUNT(*) as event_count,
        COUNT(DISTINCT "sessionId") as unique_sessions,
        COUNT(DISTINCT "userId") FILTER (WHERE "userId" IS NOT NULL) as authenticated_users
      FROM analytics_events
      WHERE "createdAt" BETWEEN $1 AND $2 AND "eventType" IN ('search', 'filter_applied', 'property_view')
      GROUP BY "eventType"
      ORDER BY event_count DESC
    `,
      [dateFrom, dateTo],
    );

    // Top performing content
    const topContent = await this.dataSource.query(
      `
      SELECT
        p.id as property_id,
        p.title,
        p."propertyType",
        COUNT(DISTINCT ae.id) FILTER (WHERE ae."eventType" = 'property_view') as views,
        COUNT(DISTINCT ld.id) as leads_generated,
        COUNT(DISTINCT CASE WHEN ld.status = 'converted' THEN ld.id END) as conversions
      FROM properties p
      LEFT JOIN analytics_events ae ON ae."propertyId" = p.id AND ae."createdAt" BETWEEN $1 AND $2
      LEFT JOIN leads ld ON ld."propertyId" = p.id AND ld."createdAt" BETWEEN $1 AND $2
      GROUP BY p.id, p.title, p."propertyType"
      HAVING COUNT(DISTINCT ae.id) > 0
      ORDER BY conversions DESC, leads_generated DESC
      LIMIT 10
    `,
      [dateFrom, dateTo],
    );

    return {
      data: {
        channel_effectiveness: channelEffectiveness,
        search_analytics: searchAnalytics,
        top_converting_content: topContent,
      },
      metadata: {
        reportName: 'Marketing Analytics Report',
        generatedAt: new Date(),
        dateRange: { from: dateFrom, to: dateTo },
      },
    };
  }
}
