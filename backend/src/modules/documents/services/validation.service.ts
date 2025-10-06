import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document, DocumentType } from '../entities/document.entity';
import { Property } from '../../properties/entities/property.entity';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface CrossValidationResult {
  match: boolean;
  discrepancies: string[];
  matchScore: number;
}

@Injectable()
export class ValidationService {
  private readonly logger = new Logger(ValidationService.name);

  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
  ) {}

  /**
   * Validate Emirates ID
   */
  validateEmiratesID(data: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check ID number format: 784-YYYY-XXXXXXX-X
    if (data.idNumber) {
      const idPattern = /^784-\d{4}-\d{7}-\d$/;
      if (!idPattern.test(data.idNumber)) {
        errors.push('Invalid Emirates ID format. Expected: 784-YYYY-XXXXXXX-X');
      } else {
        // Validate checksum (simplified - actual checksum algorithm is proprietary)
        const checkDigit = parseInt(data.idNumber.slice(-1));
        if (isNaN(checkDigit)) {
          errors.push('Invalid check digit in Emirates ID');
        }
      }
    } else {
      errors.push('Emirates ID number is missing');
    }

    // Check expiry date
    if (data.expiryDate) {
      const expiryDate = this.parseDate(data.expiryDate);
      if (!expiryDate) {
        errors.push('Invalid expiry date format');
      } else if (expiryDate < new Date()) {
        errors.push('Emirates ID has expired');
      } else if (expiryDate < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) {
        warnings.push('Emirates ID expires within 30 days');
      }
    } else {
      errors.push('Expiry date is missing');
    }

    // Check if name is present
    if (!data.fullName && !data.fullNameAr) {
      warnings.push('No name information found');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate Passport
   */
  validatePassport(data: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check passport number
    if (data.passportNumber) {
      // Basic format check (varies by country)
      if (data.passportNumber.length < 6 || data.passportNumber.length > 12) {
        warnings.push('Passport number length is unusual');
      }
    } else {
      errors.push('Passport number is missing');
    }

    // Check expiry date
    if (data.expiryDate) {
      const expiryDate = this.parseDate(data.expiryDate);
      if (!expiryDate) {
        errors.push('Invalid expiry date format');
      } else if (expiryDate < new Date()) {
        errors.push('Passport has expired');
      } else if (expiryDate < new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)) {
        warnings.push('Passport expires within 6 months');
      }
    } else {
      errors.push('Expiry date is missing');
    }

    // Validate MRZ checksum if available
    if (data.mrz) {
      const mrzValid = this.validateMRZ(data.mrz);
      if (!mrzValid) {
        errors.push('MRZ checksum validation failed');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate Trade License
   */
  validateTradeLicense(data: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check license number
    if (!data.licenseNumber) {
      errors.push('License number is missing');
    }

    // Check company name
    if (!data.companyName && !data.companyNameAr) {
      errors.push('Company name is missing');
    }

    // Check expiry date
    if (data.expiryDate) {
      const expiryDate = this.parseDate(data.expiryDate);
      if (!expiryDate) {
        errors.push('Invalid expiry date format');
      } else if (expiryDate < new Date()) {
        errors.push('Trade license has expired');
      } else if (expiryDate < new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)) {
        warnings.push('Trade license expires within 60 days');
      }
    } else {
      errors.push('Expiry date is missing');
    }

    // Check issue date
    if (data.issueDate) {
      const issueDate = this.parseDate(data.issueDate);
      if (issueDate && issueDate > new Date()) {
        errors.push('Issue date cannot be in the future');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Cross-validate property document with property record
   */
  async crossValidateProperty(
    extractedData: any,
    propertyId: string,
  ): Promise<CrossValidationResult> {
    const discrepancies: string[] = [];
    let matchScore = 100;

    try {
      const property = await this.propertyRepository.findOne({
        where: { id: propertyId },
      });

      if (!property) {
        return {
          match: false,
          discrepancies: ['Property not found'],
          matchScore: 0,
        };
      }

      // Check area with 5% tolerance
      if (extractedData.area && property.areaSqft) {
        const extractedArea = parseFloat(extractedData.area);
        const propertyArea = property.areaSqft;
        const tolerance = propertyArea * 0.05;

        if (Math.abs(extractedArea - propertyArea) > tolerance) {
          discrepancies.push(
            `Area mismatch: Document has ${extractedArea} sqft, Property record has ${propertyArea} sqft (tolerance: ±5%)`,
          );
          matchScore -= 20;
        }
      }

      // Check community
      if (extractedData.community && property.community) {
        const normalizedExtracted = extractedData.community.toLowerCase().trim();
        const normalizedProperty = property.community.toLowerCase().trim();

        if (normalizedExtracted !== normalizedProperty) {
          discrepancies.push(
            `Community mismatch: Document has ${extractedData.community}, Property record has ${property.community}`,
          );
          matchScore -= 25;
        }
      }

      return {
        match: matchScore >= 70,
        discrepancies,
        matchScore,
      };
    } catch (error) {
      this.logger.error('Error in cross-validation:', error);
      return {
        match: false,
        discrepancies: ['Error during cross-validation'],
        matchScore: 0,
      };
    }
  }

  /**
   * Validate document based on type
   */
  async validateDocument(documentId: string): Promise<ValidationResult> {
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
    });

    if (!document) {
      return {
        valid: false,
        errors: ['Document not found'],
      };
    }

    let validationResult: ValidationResult;

    switch (document.documentType) {
      case DocumentType.EMIRATES_ID:
        validationResult = this.validateEmiratesID(document.extractedData || {});
        break;
      case DocumentType.PASSPORT:
        validationResult = this.validatePassport(document.extractedData || {});
        break;
      case DocumentType.TRADE_LICENSE:
        validationResult = this.validateTradeLicense(document.extractedData || {});
        break;
      default:
        validationResult = {
          valid: true,
          errors: [],
          warnings: ['No specific validation rules for this document type'],
        };
    }

    // Update document with validation results
    document.validationResults = {
      valid: validationResult.valid,
      errors: validationResult.errors,
      warnings: validationResult.warnings,
      validatedAt: new Date().toISOString(),
    };
    document.validationCompleted = true;

    await this.documentRepository.save(document);

    return validationResult;
  }

  /**
   * Parse date from various formats
   */
  private parseDate(dateStr: string): Date | null {
    // Try various date formats
    const formats = [
      /(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/, // DD-MM-YYYY or DD/MM/YYYY
      /(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/, // YYYY-MM-DD or YYYY/MM/DD
    ];

    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        if (match[0].startsWith('2') || match[0].startsWith('1')) {
          // YYYY-MM-DD format
          return new Date(match[0]);
        } else {
          // DD-MM-YYYY format - convert to YYYY-MM-DD
          const day = match[1];
          const month = match[2];
          const year = match[3];
          return new Date(`${year}-${month}-${day}`);
        }
      }
    }

    return null;
  }

  /**
   * Validate MRZ checksum (simplified)
   */
  private validateMRZ(mrz: string): boolean {
    // This is a simplified validation
    // Real MRZ validation involves complex checksum calculations
    const lines = mrz.split('|');
    if (lines.length !== 2) {
      return false;
    }

    // Check each line is 44 characters
    return lines.every((line) => line.length === 44);
  }
}
