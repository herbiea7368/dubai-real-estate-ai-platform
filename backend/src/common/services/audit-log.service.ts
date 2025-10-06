import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../database/entities/audit-log.entity';

export enum AuditAction {
  CONSENT_GRANTED = 'consent_granted',
  CONSENT_REVOKED = 'consent_revoked',
  CONSENT_CHECKED = 'consent_checked',
  DSR_ACCESS = 'dsr_access',
  DSR_DELETION = 'dsr_deletion',
  DSR_EXPORT = 'dsr_export',
  CONSENT_BLOCKED = 'consent_blocked',
}

export interface ConsentChangeDetails {
  consentType: string;
  granted: boolean;
  version: string;
}

export interface DsrRequestDetails {
  requestType: string;
  requestId?: number;
  status?: string;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * Log consent changes (grant/revoke)
   */
  async logConsentChange(
    userId: string,
    action: AuditAction,
    details: ConsentChangeDetails,
    ipAddress: string,
  ): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      userId,
      action,
      entityType: 'consent',
      entityId: null,
      details,
      ipAddress,
    } as any);

    return (await this.auditLogRepository.save(auditLog)) as unknown as AuditLog;
  }

  /**
   * Log DSR requests (access, deletion, export)
   */
  async logDsrRequest(
    userId: string,
    action: AuditAction,
    details: DsrRequestDetails,
    ipAddress: string,
  ): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      userId,
      action,
      entityType: 'dsr',
      entityId: details.requestId || null,
      details,
      ipAddress,
    } as any);

    return (await this.auditLogRepository.save(auditLog)) as unknown as AuditLog;
  }

  /**
   * Log blocked consent attempts
   */
  async logConsentBlocked(
    userId: string,
    consentType: string,
    ipAddress: string,
  ): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      userId,
      action: AuditAction.CONSENT_BLOCKED,
      entityType: 'consent',
      entityId: null,
      details: { consentType, reason: 'consent_not_granted' },
      ipAddress,
    } as any);

    return (await this.auditLogRepository.save(auditLog)) as unknown as AuditLog;
  }

  /**
   * Get audit logs for a user
   */
  async getUserAuditLogs(userId: string, action?: AuditAction): Promise<AuditLog[]> {
    const whereClause: any = { userId };
    if (action) {
      whereClause.action = action;
    }

    return this.auditLogRepository.find({
      where: whereClause,
      order: { timestamp: 'DESC' },
    });
  }

  /**
   * Get all audit logs for compliance review
   */
  async getAllAuditLogs(limit: number = 100, offset: number = 0): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      order: { timestamp: 'DESC' },
      take: limit,
      skip: offset,
    });
  }
}
