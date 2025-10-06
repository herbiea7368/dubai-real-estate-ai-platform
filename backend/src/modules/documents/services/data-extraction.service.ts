import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExtractedField, FieldType } from '../entities/extracted-field.entity';
import { DocumentType } from '../entities/document.entity';

interface ExtractedData {
  [key: string]: string;
}

interface ExtractedFieldData {
  fieldName: string;
  fieldValue: string;
  fieldType: FieldType;
  confidence: number;
}

@Injectable()
export class DataExtractionService {
  private readonly logger = new Logger(DataExtractionService.name);

  constructor(
    @InjectRepository(ExtractedField)
    private readonly extractedFieldRepository: Repository<ExtractedField>,
  ) {}

  /**
   * Extract Emirates ID data
   */
  extractEmiratesID(text: string): ExtractedData {
    const data: ExtractedData = {};

    // Extract ID Number: 784-YYYY-XXXXXXX-X
    const idPattern = /784-\d{4}-\d{7}-\d/;
    const idMatch = text.match(idPattern);
    if (idMatch) {
      data.idNumber = idMatch[0];
    }

    // Extract Name (look for patterns like "Name:" or specific positions)
    const namePatternEn = /Name[:\s]+([A-Z][A-Za-z\s]+)/i;
    const nameMatchEn = text.match(namePatternEn);
    if (nameMatchEn) {
      data.fullName = nameMatchEn[1].trim();
    }

    // Extract Arabic name
    const namePatternAr = /الاسم[:\s]+([\u0600-\u06FF\s]+)/;
    const nameMatchAr = text.match(namePatternAr);
    if (nameMatchAr) {
      data.fullNameAr = nameMatchAr[1].trim();
    }

    // Extract Date of Birth
    const dobPattern = /(?:Date of Birth|DOB)[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i;
    const dobMatch = text.match(dobPattern);
    if (dobMatch) {
      data.dateOfBirth = dobMatch[1];
    }

    // Extract Expiry Date
    const expiryPattern = /(?:Expiry|Expiry Date)[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i;
    const expiryMatch = text.match(expiryPattern);
    if (expiryMatch) {
      data.expiryDate = expiryMatch[1];
    }

    // Extract Nationality
    const nationalityPattern = /Nationality[:\s]+([A-Za-z\s]+)/i;
    const nationalityMatch = text.match(nationalityPattern);
    if (nationalityMatch) {
      data.nationality = nationalityMatch[1].trim();
    }

    return data;
  }

  /**
   * Extract Passport data
   */
  extractPassport(text: string): ExtractedData {
    const data: ExtractedData = {};

    // Extract Passport Number (various formats)
    const passportPattern = /(?:Passport No|Passport Number|No\.)[:\s]+([A-Z0-9]+)/i;
    const passportMatch = text.match(passportPattern);
    if (passportMatch) {
      data.passportNumber = passportMatch[1];
    }

    // Extract Full Name
    const namePattern = /(?:Name|Surname)[:\s]+([A-Z][A-Za-z\s]+)/i;
    const nameMatch = text.match(namePattern);
    if (nameMatch) {
      data.fullName = nameMatch[1].trim();
    }

    // Extract Nationality
    const nationalityPattern = /Nationality[:\s]+([A-Za-z\s]+)/i;
    const nationalityMatch = text.match(nationalityPattern);
    if (nationalityMatch) {
      data.nationality = nationalityMatch[1].trim();
    }

    // Extract Date of Birth
    const dobPattern = /(?:Date of Birth|DOB)[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i;
    const dobMatch = text.match(dobPattern);
    if (dobMatch) {
      data.dateOfBirth = dobMatch[1];
    }

    // Extract Issue Date
    const issueDatePattern = /(?:Date of Issue|Issue Date)[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i;
    const issueDateMatch = text.match(issueDatePattern);
    if (issueDateMatch) {
      data.issueDate = issueDateMatch[1];
    }

    // Extract Expiry Date
    const expiryPattern = /(?:Date of Expiry|Expiry Date)[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i;
    const expiryMatch = text.match(expiryPattern);
    if (expiryMatch) {
      data.expiryDate = expiryMatch[1];
    }

    // Extract MRZ (Machine Readable Zone) - typically 2 lines of alphanumeric
    const mrzPattern = /([A-Z0-9<]{44}[\r\n]+[A-Z0-9<]{44})/;
    const mrzMatch = text.match(mrzPattern);
    if (mrzMatch) {
      data.mrz = mrzMatch[1].replace(/[\r\n]/g, '|');
    }

    return data;
  }

  /**
   * Extract Trade License data
   */
  extractTradeLicense(text: string): ExtractedData {
    const data: ExtractedData = {};

    // Extract License Number
    const licensePattern = /(?:License No|License Number|رقم الرخصة)[:\s]+([A-Z0-9\-\/]+)/i;
    const licenseMatch = text.match(licensePattern);
    if (licenseMatch) {
      data.licenseNumber = licenseMatch[1];
    }

    // Extract Company Name (English)
    const companyPattern = /(?:Trade Name|Company Name)[:\s]+([A-Z][A-Za-z0-9\s&\-\.]+)/i;
    const companyMatch = text.match(companyPattern);
    if (companyMatch) {
      data.companyName = companyMatch[1].trim();
    }

    // Extract Company Name (Arabic)
    const companyPatternAr = /(?:الاسم التجاري)[:\s]+([\u0600-\u06FF\s]+)/;
    const companyMatchAr = text.match(companyPatternAr);
    if (companyMatchAr) {
      data.companyNameAr = companyMatchAr[1].trim();
    }

    // Extract Issue Date
    const issueDatePattern = /(?:Issue Date|تاريخ الإصدار)[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i;
    const issueDateMatch = text.match(issueDatePattern);
    if (issueDateMatch) {
      data.issueDate = issueDateMatch[1];
    }

    // Extract Expiry Date
    const expiryPattern = /(?:Expiry Date|تاريخ الانتهاء)[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i;
    const expiryMatch = text.match(expiryPattern);
    if (expiryMatch) {
      data.expiryDate = expiryMatch[1];
    }

    // Extract Legal Form
    const legalFormPattern = /(?:Legal Form|الشكل القانوني)[:\s]+([A-Za-z\s]+)/i;
    const legalFormMatch = text.match(legalFormPattern);
    if (legalFormMatch) {
      data.legalForm = legalFormMatch[1].trim();
    }

    return data;
  }

  /**
   * Extract Title Deed data
   */
  extractTitleDeed(text: string): ExtractedData {
    const data: ExtractedData = {};

    // Extract Plot/Unit Number
    const plotPattern = /(?:Plot No|Unit No|Plot Number)[:\s]+([A-Z0-9\-\/]+)/i;
    const plotMatch = text.match(plotPattern);
    if (plotMatch) {
      data.plotNumber = plotMatch[1];
    }

    // Extract Community/Area
    const communityPattern = /(?:Community|Area|Location)[:\s]+([A-Za-z\s]+)/i;
    const communityMatch = text.match(communityPattern);
    if (communityMatch) {
      data.community = communityMatch[1].trim();
    }

    // Extract Area (sqft/sqm)
    const areaPattern = /(\d+(?:,\d+)?)\s*(?:sq\.?\s*ft|sqft|square feet|sq\.?\s*m|sqm)/i;
    const areaMatch = text.match(areaPattern);
    if (areaMatch) {
      data.area = areaMatch[1].replace(',', '');
    }

    // Extract Owner Name
    const ownerPattern = /(?:Owner|Owner Name)[:\s]+([A-Z][A-Za-z\s]+)/i;
    const ownerMatch = text.match(ownerPattern);
    if (ownerMatch) {
      data.ownerName = ownerMatch[1].trim();
    }

    // Extract DLD Number (Dubai Land Department)
    const dldPattern = /(?:DLD No|DLD Number)[:\s]+([A-Z0-9\-\/]+)/i;
    const dldMatch = text.match(dldPattern);
    if (dldMatch) {
      data.dldNumber = dldMatch[1];
    }

    return data;
  }

  /**
   * Extract fields based on document type
   */
  async extractFields(
    text: string,
    documentType: DocumentType,
    documentId: string,
  ): Promise<ExtractedFieldData[]> {
    this.logger.log(`Extracting fields for document type: ${documentType}`);

    let extractedData: ExtractedData = {};

    switch (documentType) {
      case DocumentType.EMIRATES_ID:
        extractedData = this.extractEmiratesID(text);
        break;
      case DocumentType.PASSPORT:
        extractedData = this.extractPassport(text);
        break;
      case DocumentType.TRADE_LICENSE:
        extractedData = this.extractTradeLicense(text);
        break;
      case DocumentType.TITLE_DEED:
        extractedData = this.extractTitleDeed(text);
        break;
      default:
        this.logger.warn(`No extraction method for document type: ${documentType}`);
        return [];
    }

    // Convert extracted data to field entities
    const fields: ExtractedFieldData[] = [];
    for (const [fieldName, fieldValue] of Object.entries(extractedData)) {
      const fieldType = this.determineFieldType(fieldName, fieldValue);
      const confidence = this.calculateConfidence(fieldValue);

      fields.push({
        fieldName,
        fieldValue,
        fieldType,
        confidence,
      });
    }

    // Save fields to database
    for (const fieldData of fields) {
      const field = this.extractedFieldRepository.create({
        documentId,
        ...fieldData,
      });
      await this.extractedFieldRepository.save(field);
    }

    return fields;
  }

  /**
   * Determine field type based on field name and value
   */
  private determineFieldType(fieldName: string, value: string): FieldType {
    const lowerFieldName = fieldName.toLowerCase();

    if (lowerFieldName.includes('date') || lowerFieldName.includes('expiry')) {
      return FieldType.DATE;
    }

    if (
      lowerFieldName.includes('number') ||
      lowerFieldName.includes('area') ||
      /^\d+$/.test(value)
    ) {
      return FieldType.NUMBER;
    }

    return FieldType.TEXT;
  }

  /**
   * Calculate confidence based on value characteristics
   */
  private calculateConfidence(value: string): number {
    // Base confidence
    let confidence = 0.7;

    // Increase confidence if value matches expected patterns
    if (/\d{4}-\d{2}-\d{2}/.test(value)) {
      // ISO date format
      confidence = 0.9;
    } else if (/784-\d{4}-\d{7}-\d/.test(value)) {
      // Emirates ID
      confidence = 0.95;
    } else if (/^[A-Z0-9]{6,12}$/.test(value)) {
      // Likely document number
      confidence = 0.85;
    }

    return confidence;
  }
}
