import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ValidationService } from './validation.service';
import { Document } from '../entities/document.entity';
import { Property } from '../../properties/entities/property.entity';

describe('ValidationService', () => {
  let service: ValidationService;
  let mockDocumentRepository: any;
  let mockPropertyRepository: any;

  beforeEach(async () => {
    mockDocumentRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    mockPropertyRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidationService,
        {
          provide: getRepositoryToken(Document),
          useValue: mockDocumentRepository,
        },
        {
          provide: getRepositoryToken(Property),
          useValue: mockPropertyRepository,
        },
      ],
    }).compile();

    service = module.get<ValidationService>(ValidationService);
  });

  describe('validateEmiratesID', () => {
    it('should validate correct Emirates ID format', () => {
      const data = {
        idNumber: '784-2020-1234567-8',
        expiryDate: '14/03/2028',
        fullName: 'Ahmed Al-Mansouri',
      };

      const result = service.validateEmiratesID(data);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid Emirates ID format', () => {
      const data = {
        idNumber: '123-456-789',
        expiryDate: '14/03/2028',
      };

      const result = service.validateEmiratesID(data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Invalid Emirates ID format. Expected: 784-YYYY-XXXXXXX-X',
      );
    });

    it('should detect expired Emirates ID', () => {
      const data = {
        idNumber: '784-2020-1234567-8',
        expiryDate: '14/03/2020',
      };

      const result = service.validateEmiratesID(data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Emirates ID has expired');
    });

    it('should warn about expiring soon Emirates ID', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);
      const dateStr = `${futureDate.getDate()}/${futureDate.getMonth() + 1}/${futureDate.getFullYear()}`;

      const data = {
        idNumber: '784-2020-1234567-8',
        expiryDate: dateStr,
      };

      const result = service.validateEmiratesID(data);
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('Emirates ID expires within 30 days');
    });

    it('should require ID number', () => {
      const data = {
        expiryDate: '14/03/2028',
      };

      const result = service.validateEmiratesID(data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Emirates ID number is missing');
    });
  });

  describe('validatePassport', () => {
    it('should validate correct passport data', () => {
      const data = {
        passportNumber: 'A12345678',
        expiryDate: '14/03/2028',
      };

      const result = service.validatePassport(data);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect expired passport', () => {
      const data = {
        passportNumber: 'A12345678',
        expiryDate: '14/03/2020',
      };

      const result = service.validatePassport(data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Passport has expired');
    });

    it('should warn about passport expiring within 6 months', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 90); // 3 months
      const dateStr = `${futureDate.getDate()}/${futureDate.getMonth() + 1}/${futureDate.getFullYear()}`;

      const data = {
        passportNumber: 'A12345678',
        expiryDate: dateStr,
      };

      const result = service.validatePassport(data);
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('Passport expires within 6 months');
    });
  });

  describe('validateTradeLicense', () => {
    it('should validate correct trade license data', () => {
      const data = {
        licenseNumber: 'CN-1234567',
        companyName: 'Test Company LLC',
        expiryDate: '31/12/2025',
        issueDate: '01/01/2024',
      };

      const result = service.validateTradeLicense(data);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect expired trade license', () => {
      const data = {
        licenseNumber: 'CN-1234567',
        companyName: 'Test Company LLC',
        expiryDate: '31/12/2020',
        issueDate: '01/01/2020',
      };

      const result = service.validateTradeLicense(data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Trade license has expired');
    });

    it('should reject future issue date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const dateStr = `${futureDate.getDate()}/${futureDate.getMonth() + 1}/${futureDate.getFullYear()}`;

      const data = {
        licenseNumber: 'CN-1234567',
        companyName: 'Test Company LLC',
        expiryDate: '31/12/2025',
        issueDate: dateStr,
      };

      const result = service.validateTradeLicense(data);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Issue date cannot be in the future');
    });
  });
});
