import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConsentLedger } from './entities/consent-ledger.entity';
import { GrantConsentDto } from './dto/grant-consent.dto';
import { RevokeConsentDto } from './dto/revoke-consent.dto';

export interface ConsentStatus {
  granted: boolean;
  timestamp: Date;
  version: string;
}

@Injectable()
export class ConsentService {
  private consentCache: Map<string, { status: ConsentStatus; expiresAt: number }> = new Map();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(
    @InjectRepository(ConsentLedger)
    private consentLedgerRepository: Repository<ConsentLedger>,
  ) {}

  /**
   * Grant consent for a specific communication channel
   * Creates an immutable consent record with granted=true
   */
  async grantConsent(
    personId: string,
    grantConsentDto: GrantConsentDto,
    ipAddress: string,
  ): Promise<ConsentLedger> {
    const consent = this.consentLedgerRepository.create({
      personId,
      consentType: grantConsentDto.consentType,
      granted: true,
      version: grantConsentDto.version,
      ipAddress,
    });

    const savedConsent = await this.consentLedgerRepository.save(consent);

    // Invalidate cache for this person + consent type
    this.invalidateCache(personId, grantConsentDto.consentType);

    // Note: Audit logging will be added via AuditLogService in next step
    return savedConsent;
  }

  /**
   * Revoke consent for a specific communication channel
   * Creates a NEW immutable record with granted=false (never updates existing)
   */
  async revokeConsent(
    personId: string,
    revokeConsentDto: RevokeConsentDto,
    ipAddress: string,
  ): Promise<ConsentLedger> {
    const consent = this.consentLedgerRepository.create({
      personId,
      consentType: revokeConsentDto.consentType,
      granted: false,
      version: 'revocation',
      ipAddress,
    });

    const savedConsent = await this.consentLedgerRepository.save(consent);

    // Invalidate cache
    this.invalidateCache(personId, revokeConsentDto.consentType);

    // Note: Audit logging will be added via AuditLogService in next step
    return savedConsent;
  }

  /**
   * Check the current consent status for a person and consent type
   * Returns the latest consent record (granted or revoked)
   * Results are cached for 5 minutes to optimize performance
   */
  async checkConsent(personId: string, consentType: string): Promise<ConsentStatus> {
    const cacheKey = `${personId}:${consentType}`;

    // Check cache first
    const cached = this.consentCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.status;
    }

    // Query latest consent record for this person + type
    const latestConsent = await this.consentLedgerRepository.findOne({
      where: { personId, consentType },
      order: { grantedAt: 'DESC' },
    });

    const status: ConsentStatus = latestConsent
      ? {
          granted: latestConsent.granted,
          timestamp: latestConsent.grantedAt,
          version: latestConsent.version,
        }
      : {
          granted: false,
          timestamp: new Date(),
          version: 'none',
        };

    // Cache the result
    this.consentCache.set(cacheKey, {
      status,
      expiresAt: Date.now() + this.CACHE_TTL_MS,
    });

    return status;
  }

  /**
   * Get full consent history for a person
   * Returns all consent records ordered by timestamp DESC
   * Optional filter by consentType
   */
  async getConsentHistory(personId: string, consentType?: string): Promise<ConsentLedger[]> {
    const whereClause: any = { personId };
    if (consentType) {
      whereClause.consentType = consentType;
    }

    return this.consentLedgerRepository.find({
      where: whereClause,
      order: { grantedAt: 'DESC' },
    });
  }

  /**
   * Bulk check consent status for multiple consent types
   * Optimized with single DB query using IN clause
   */
  async bulkCheckConsents(
    personId: string,
    consentTypes: string[],
  ): Promise<Record<string, ConsentStatus>> {
    const result: Record<string, ConsentStatus> = {};

    // Get all consent records for this person and the specified types
    const consents = await this.consentLedgerRepository.find({
      where: {
        personId,
        consentType: In(consentTypes),
      },
      order: { grantedAt: 'DESC' },
    });

    // Group by consentType and get the latest for each
    const latestByType = new Map<string, ConsentLedger>();
    for (const consent of consents) {
      if (!latestByType.has(consent.consentType)) {
        latestByType.set(consent.consentType, consent);
      }
    }

    // Build result map
    for (const consentType of consentTypes) {
      const latest = latestByType.get(consentType);
      result[consentType] = latest
        ? {
            granted: latest.granted,
            timestamp: latest.grantedAt,
            version: latest.version,
          }
        : {
            granted: false,
            timestamp: new Date(),
            version: 'none',
          };
    }

    return result;
  }

  /**
   * Invalidate cache for a specific person + consent type
   */
  private invalidateCache(personId: string, consentType: string): void {
    const cacheKey = `${personId}:${consentType}`;
    this.consentCache.delete(cacheKey);
  }
}
