import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PermitsService } from './permits.service';
import { Permit, PermitStatus, Market, PermitType, Issuer } from './entities/permit.entity';

describe('PermitsService', () => {
  let service: PermitsService;
  let repository: Repository<Permit>;

  const mockPermitRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermitsService,
        {
          provide: getRepositoryToken(Permit),
          useValue: mockPermitRepository,
        },
      ],
    }).compile();

    service = module.get<PermitsService>(PermitsService);
    repository = module.get<Repository<Permit>>(getRepositoryToken(Permit));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkPermit', () => {
    it('should return valid result for a valid permit', async () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 6);

      const mockPermit = {
        id: 'test-id',
        trakheesiNumber: 'DLD-2024-12345',
        market: Market.DUBAI,
        issuer: Issuer.DLD,
        expiryDate: futureDate,
        status: PermitStatus.VALID,
        validationHistory: [],
      } as Permit;

      mockPermitRepository.findOne.mockResolvedValue(mockPermit);
      mockPermitRepository.save.mockResolvedValue(mockPermit);

      const result = await service.checkPermit('DLD-2024-12345', Market.DUBAI);

      expect(result.valid).toBe(true);
      expect(result.issuer).toBe(Issuer.DLD);
      expect(result.errors).toHaveLength(0);
      expect(mockPermitRepository.save).toHaveBeenCalled();
    });

    it('should return invalid result for expired permit', async () => {
      const pastDate = new Date('2023-12-31');

      const mockPermit = {
        id: 'test-id',
        trakheesiNumber: 'RERA-2023-54321',
        market: Market.DUBAI,
        issuer: Issuer.RERA,
        expiryDate: pastDate,
        status: PermitStatus.VALID,
        validationHistory: [],
      } as Permit;

      mockPermitRepository.findOne.mockResolvedValue(mockPermit);
      mockPermitRepository.save.mockResolvedValue({ ...mockPermit, status: PermitStatus.EXPIRED });

      const result = await service.checkPermit('RERA-2023-54321', Market.DUBAI);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Permit has expired');
      expect(mockPermitRepository.save).toHaveBeenCalled();
    });

    it('should return not_found status for non-existent permit', async () => {
      mockPermitRepository.findOne.mockResolvedValue(null);

      const result = await service.checkPermit('FAKE-123', Market.DUBAI);

      expect(result.valid).toBe(false);
      expect(result.status).toBe('not_found');
      expect(result.errors).toContain('Permit not found in system');
    });
  });

  describe('validatePermitForPublish', () => {
    it('should link permit to property if valid', async () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 6);

      const mockPermit = {
        id: 'test-id',
        trakheesiNumber: 'DLD-2024-12345',
        market: Market.DUBAI,
        issuer: Issuer.DLD,
        expiryDate: futureDate,
        status: PermitStatus.VALID,
        validationHistory: [],
        propertyId: null,
      } as Permit;

      mockPermitRepository.findOne.mockResolvedValue(mockPermit);
      mockPermitRepository.save.mockResolvedValue({
        ...mockPermit,
        propertyId: 'property-123',
      });

      const result = await service.validatePermitForPublish(
        'DLD-2024-12345',
        'property-123',
        Market.DUBAI,
      );

      expect(result.propertyId).toBe('property-123');
      expect(mockPermitRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException for expired permit', async () => {
      const pastDate = new Date('2023-12-31');

      const mockPermit = {
        id: 'test-id',
        trakheesiNumber: 'RERA-2023-54321',
        market: Market.DUBAI,
        expiryDate: pastDate,
        status: PermitStatus.VALID,
        validationHistory: [],
      } as Permit;

      mockPermitRepository.findOne.mockResolvedValue(mockPermit);
      mockPermitRepository.save.mockResolvedValue({ ...mockPermit, status: PermitStatus.EXPIRED });

      await expect(
        service.validatePermitForPublish('RERA-2023-54321', 'property-123', Market.DUBAI),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('listExpiringPermits', () => {
    it('should return permits expiring within specified days', async () => {
      const now = new Date();
      const expiryDate15Days = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

      const mockPermits = [
        {
          id: 'test-id-1',
          trakheesiNumber: 'DLD-2024-98765',
          expiryDate: expiryDate15Days,
          status: PermitStatus.VALID,
        } as Permit,
      ];

      mockPermitRepository.find.mockResolvedValue(mockPermits);

      const result = await service.listExpiringPermits(30);

      expect(result).toHaveLength(1);
      expect(result[0].trakheesiNumber).toBe('DLD-2024-98765');
      expect(mockPermitRepository.find).toHaveBeenCalled();
    });
  });

  describe('bulkCheckPermits', () => {
    it('should process multiple permits and return validation results', async () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 6);

      const mockPermits = [
        {
          id: 'test-id-1',
          trakheesiNumber: 'DLD-2024-12345',
          expiryDate: futureDate,
          status: PermitStatus.VALID,
          validationHistory: [],
        } as Permit,
        {
          id: 'test-id-2',
          trakheesiNumber: 'RERA-2023-54321',
          expiryDate: new Date('2023-12-31'),
          status: PermitStatus.VALID,
          validationHistory: [],
        } as Permit,
      ];

      mockPermitRepository.find.mockResolvedValue(mockPermits);
      mockPermitRepository.save.mockResolvedValue(mockPermits);

      const result = await service.bulkCheckPermits([
        'DLD-2024-12345',
        'RERA-2023-54321',
        'NON-EXISTENT',
      ]);

      expect(result.size).toBe(3);
      expect(result.get('DLD-2024-12345')?.valid).toBe(true);
      expect(result.get('RERA-2023-54321')?.valid).toBe(false);
      expect(result.get('NON-EXISTENT')?.valid).toBe(false);
      expect(result.get('NON-EXISTENT')?.status).toBe('not_found');
    });
  });

  describe('getPermitStatus', () => {
    it('should return status with days until expiry', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);

      const mockPermit = {
        id: 'test-id',
        trakheesiNumber: 'DLD-2024-98765',
        expiryDate: futureDate,
        status: PermitStatus.VALID,
      } as Permit;

      mockPermitRepository.findOne.mockResolvedValue(mockPermit);

      const result = await service.getPermitStatus('DLD-2024-98765');

      expect(result.status).toBe(PermitStatus.VALID);
      expect(result.daysUntilExpiry).toBeGreaterThanOrEqual(14);
      expect(result.daysUntilExpiry).toBeLessThanOrEqual(16);
    });

    it('should throw NotFoundException for non-existent permit', async () => {
      mockPermitRepository.findOne.mockResolvedValue(null);

      await expect(service.getPermitStatus('FAKE-123')).rejects.toThrow(NotFoundException);
    });
  });
});
