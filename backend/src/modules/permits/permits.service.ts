import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  Permit,
  PermitStatus,
  Market,
  Issuer,
  ValidationHistoryEntry,
} from './entities/permit.entity';
import { RegisterPermitDto } from './dto/register-permit.dto';

export interface PermitCheckResult {
  valid: boolean;
  issuer?: Issuer;
  expiryDate?: Date;
  errors: string[];
  status?: PermitStatus;
}

export interface PermitStatusResult {
  status: PermitStatus;
  expiryDate: Date;
  daysUntilExpiry: number;
}

@Injectable()
export class PermitsService {
  constructor(
    @InjectRepository(Permit)
    private permitsRepository: Repository<Permit>,
  ) {}

  /**
   * Check permit validity without modifying it
   */
  async checkPermit(trakheesiNumber: string, market: Market): Promise<PermitCheckResult> {
    const permit = await this.permitsRepository.findOne({
      where: { trakheesiNumber, market },
    });

    if (!permit) {
      return {
        valid: false,
        status: 'not_found' as PermitStatus,
        errors: ['Permit not found in system'],
      };
    }

    const now = new Date();
    const isExpired = new Date(permit.expiryDate) < now;

    // Update status if expired
    if (isExpired && permit.status === PermitStatus.VALID) {
      permit.status = PermitStatus.EXPIRED;
    }

    // Add validation entry to history
    const validationEntry: ValidationHistoryEntry = {
      timestamp: now,
      status: permit.status,
      result: isExpired || permit.status !== PermitStatus.VALID ? 'invalid' : 'valid',
      reason: isExpired ? 'Permit expired' : undefined,
    };

    permit.validationHistory = [...(permit.validationHistory || []), validationEntry];
    permit.lastCheckedAt = now;

    await this.permitsRepository.save(permit);

    const errors: string[] = [];
    if (isExpired) {
      errors.push('Permit has expired');
    }
    if (permit.status === PermitStatus.REVOKED) {
      errors.push('Permit has been revoked');
    }
    if (permit.status === PermitStatus.PENDING) {
      errors.push('Permit is still pending approval');
    }

    return {
      valid: permit.status === PermitStatus.VALID && !isExpired,
      issuer: permit.issuer,
      expiryDate: permit.expiryDate,
      status: permit.status,
      errors,
    };
  }

  /**
   * Validate permit for listing (non-throwing version)
   */
  async validatePermitForListing(
    trakheesiNumber: string,
    propertyId: string,
    market: Market = Market.DUBAI,
  ): Promise<{
    isValid: boolean;
    errors: string[];
    permit?: Permit;
  }> {
    // Check permit validity
    await this.checkPermit(trakheesiNumber, market);

    // Get permit from database
    const permit = await this.permitsRepository.findOne({
      where: { trakheesiNumber, market },
    });

    if (!permit) {
      return {
        isValid: false,
        errors: ['Permit not found in system'],
      };
    }

    // Check if expired
    const now = new Date();
    const isExpired = new Date(permit.expiryDate) < now;

    // Check if status is valid
    const errors: string[] = [];
    if (isExpired) {
      errors.push('Permit has expired');
    }
    if (permit.status !== PermitStatus.VALID) {
      errors.push(`Permit status is ${permit.status}`);
    }

    if (errors.length > 0) {
      return {
        isValid: false,
        errors,
        permit,
      };
    }

    // Valid - update permit with property link
    permit.propertyId = propertyId;

    // Add validation entry to history
    const validationEntry: ValidationHistoryEntry = {
      timestamp: now,
      status: permit.status,
      result: 'valid',
      reason: `Linked to property ${propertyId}`,
    };

    permit.validationHistory = [...(permit.validationHistory || []), validationEntry];

    // Save permit
    await this.permitsRepository.save(permit);

    return {
      isValid: true,
      errors: [],
      permit,
    };
  }

  /**
   * Validate permit for property publication
   */
  async validatePermitForPublish(
    trakheesiNumber: string,
    propertyId: string,
    market: Market,
  ): Promise<Permit> {
    const checkResult = await this.checkPermit(trakheesiNumber, market);

    if (!checkResult.valid) {
      throw new BadRequestException(`Cannot publish property: ${checkResult.errors.join(', ')}`);
    }

    const permit = await this.permitsRepository.findOne({
      where: { trakheesiNumber, market },
    });

    if (!permit) {
      throw new NotFoundException('Permit not found');
    }

    // Link permit to property
    permit.propertyId = propertyId;

    // Add validation entry
    const validationEntry: ValidationHistoryEntry = {
      timestamp: new Date(),
      status: permit.status,
      result: 'valid',
      reason: `Linked to property ${propertyId}`,
    };

    permit.validationHistory = [...(permit.validationHistory || []), validationEntry];

    return await this.permitsRepository.save(permit);
  }

  /**
   * Get permit by ID
   */
  async getPermitById(permitId: string): Promise<Permit> {
    const permit = await this.permitsRepository.findOne({
      where: { id: permitId },
    });

    if (!permit) {
      throw new NotFoundException('Permit not found');
    }

    return permit;
  }

  /**
   * Get current permit status without updating
   */
  async getPermitStatus(trakheesiNumber: string): Promise<PermitStatusResult> {
    const permit = await this.permitsRepository.findOne({
      where: { trakheesiNumber },
    });

    if (!permit) {
      throw new NotFoundException('Permit not found');
    }

    const now = new Date();
    const expiryDate = new Date(permit.expiryDate);
    const daysUntilExpiry = Math.ceil(
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      status: permit.status,
      expiryDate: permit.expiryDate,
      daysUntilExpiry,
    };
  }

  /**
   * Register a new permit in the system
   */
  async registerPermit(dto: RegisterPermitDto): Promise<Permit> {
    // Check if permit already exists
    const existing = await this.permitsRepository.findOne({
      where: { trakheesiNumber: dto.trakheesiNumber },
    });

    if (existing) {
      throw new BadRequestException('Permit already registered in system');
    }

    // Validate dates
    const issueDate = new Date(dto.issueDate);
    const expiryDate = new Date(dto.expiryDate);

    if (expiryDate <= issueDate) {
      throw new BadRequestException('Expiry date must be after issue date');
    }

    // Determine initial status based on expiry date
    const now = new Date();
    const initialStatus = expiryDate < now ? PermitStatus.EXPIRED : PermitStatus.VALID;

    const permit = this.permitsRepository.create({
      ...dto,
      issueDate,
      expiryDate,
      status: initialStatus,
      validationHistory: [
        {
          timestamp: now,
          status: initialStatus,
          result: initialStatus === PermitStatus.VALID ? 'valid' : 'invalid',
          reason: 'Initial registration',
        },
      ],
    });

    return await this.permitsRepository.save(permit);
  }

  /**
   * List permits expiring within specified days
   */
  async listExpiringPermits(daysAhead: number = 30): Promise<Permit[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return await this.permitsRepository.find({
      where: {
        expiryDate: Between(now, futureDate),
        status: PermitStatus.VALID,
      },
      order: {
        expiryDate: 'ASC',
      },
    });
  }

  /**
   * Bulk check multiple permits
   */
  async bulkCheckPermits(trakheesiNumbers: string[]): Promise<Map<string, PermitCheckResult>> {
    const results = new Map<string, PermitCheckResult>();

    // Fetch all permits in single query
    const permits = await this.permitsRepository.find({
      where: trakheesiNumbers.map((num) => ({ trakheesiNumber: num })),
    });

    const permitMap = new Map(permits.map((p) => [p.trakheesiNumber, p]));
    const now = new Date();

    // Process each permit
    for (const trakheesiNumber of trakheesiNumbers) {
      const permit = permitMap.get(trakheesiNumber);

      if (!permit) {
        results.set(trakheesiNumber, {
          valid: false,
          status: 'not_found' as PermitStatus,
          errors: ['Permit not found in system'],
        });
        continue;
      }

      const isExpired = new Date(permit.expiryDate) < now;

      // Update status if expired
      if (isExpired && permit.status === PermitStatus.VALID) {
        permit.status = PermitStatus.EXPIRED;
      }

      // Add validation entry
      const validationEntry: ValidationHistoryEntry = {
        timestamp: now,
        status: permit.status,
        result: isExpired || permit.status !== PermitStatus.VALID ? 'invalid' : 'valid',
        reason: isExpired ? 'Bulk check - expired' : 'Bulk check - valid',
      };

      permit.validationHistory = [...(permit.validationHistory || []), validationEntry];
      permit.lastCheckedAt = now;

      const errors: string[] = [];
      if (isExpired) errors.push('Permit has expired');
      if (permit.status === PermitStatus.REVOKED) errors.push('Permit has been revoked');
      if (permit.status === PermitStatus.PENDING) errors.push('Permit is still pending approval');

      results.set(trakheesiNumber, {
        valid: permit.status === PermitStatus.VALID && !isExpired,
        issuer: permit.issuer,
        expiryDate: permit.expiryDate,
        status: permit.status,
        errors,
      });
    }

    // Save all updated permits
    await this.permitsRepository.save(Array.from(permitMap.values()));

    return results;
  }

  /**
   * Get validation history for a permit
   */
  async getValidationHistory(trakheesiNumber: string): Promise<ValidationHistoryEntry[]> {
    const permit = await this.permitsRepository.findOne({
      where: { trakheesiNumber },
    });

    if (!permit) {
      throw new NotFoundException('Permit not found');
    }

    return permit.validationHistory || [];
  }
}
