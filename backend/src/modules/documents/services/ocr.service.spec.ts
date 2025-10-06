import { Test, TestingModule } from '@nestjs/testing';
import { OcrService } from './ocr.service';
import { DocumentLanguage, FileType } from '../entities/document.entity';

describe('OcrService', () => {
  let service: OcrService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OcrService],
    }).compile();

    service = module.get<OcrService>(OcrService);
    await service.onModuleInit();
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  describe('detectLanguage', () => {
    it('should detect English text', () => {
      const text = 'This is an English document';
      const language = service.detectLanguage(text);
      expect(language).toBe(DocumentLanguage.EN);
    });

    it('should detect Arabic text', () => {
      const text = 'هذا مستند عربي';
      const language = service.detectLanguage(text);
      expect(language).toBe(DocumentLanguage.AR);
    });

    it('should detect mixed language text', () => {
      const text = 'Emirates ID هوية الإمارات';
      const language = service.detectLanguage(text);
      expect(language).toBe(DocumentLanguage.MIXED);
    });
  });

  describe('detectDocumentType', () => {
    it('should detect Emirates ID', () => {
      const text = 'Emirates ID Number: 784-2020-1234567-8';
      const result = service.detectDocumentType(text);
      expect(result.type).toBe('emirates_id');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should detect Passport', () => {
      const text = 'PASSPORT No: A12345678 Travel Document';
      const result = service.detectDocumentType(text);
      expect(result.type).toBe('passport');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should detect Trade License', () => {
      const text = 'Trade License Number: CN-1234567 Commercial License';
      const result = service.detectDocumentType(text);
      expect(result.type).toBe('trade_license');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should detect Title Deed', () => {
      const text = 'Title Deed Property Title DLD-2023-12345';
      const result = service.detectDocumentType(text);
      expect(result.type).toBe('title_deed');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should return "other" for unknown document type', () => {
      const text = 'This is some random text that does not match any document type';
      const result = service.detectDocumentType(text);
      expect(result.type).toBe('other');
      expect(result.confidence).toBeLessThanOrEqual(0.5);
    });
  });
});
