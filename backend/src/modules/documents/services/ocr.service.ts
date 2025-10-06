import { Injectable, Logger } from '@nestjs/common';
import { createWorker, Worker } from 'tesseract.js';
import pdfParse from 'pdf-parse';
import sharp from 'sharp';
import { DocumentLanguage, FileType } from '../entities/document.entity';

interface OcrResult {
  text: string;
  language: DocumentLanguage;
  confidence: number;
}

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);
  private worker: Worker | null = null;

  async onModuleInit() {
    // Initialize Tesseract worker
    this.worker = await createWorker(['eng', 'ara'], undefined, {
      logger: (m: any) => this.logger.debug(m),
    });
  }

  async onModuleDestroy() {
    // Terminate Tesseract worker
    if (this.worker) {
      await this.worker.terminate();
    }
  }

  /**
   * Extract text from image or PDF
   */
  async extractText(
    fileBuffer: Buffer,
    fileType: FileType,
  ): Promise<OcrResult> {
    this.logger.log(`Extracting text from ${fileType} file`);

    if (fileType === FileType.PDF) {
      return this.extractTextFromPDF(fileBuffer);
    } else {
      return this.processImage(fileBuffer);
    }
  }

  /**
   * Extract text from PDF by converting pages to images
   */
  async extractTextFromPDF(pdfBuffer: Buffer): Promise<OcrResult> {
    this.logger.log('Extracting text from PDF');

    try {
      // Parse PDF to extract text directly first
      const pdfData = await pdfParse(pdfBuffer);
      let combinedText = pdfData.text.trim();

      // If PDF has extractable text, use it
      if (combinedText.length > 50) {
        const language = this.detectLanguage(combinedText);
        return {
          text: combinedText,
          language,
          confidence: 0.9, // High confidence for native PDF text
        };
      }

      // If no text found, it might be a scanned PDF - would need image conversion
      // For MVP, return what we have
      const language = this.detectLanguage(combinedText);
      return {
        text: combinedText || 'No text extracted from PDF',
        language: language || DocumentLanguage.EN,
        confidence: 0.5,
      };
    } catch (error) {
      this.logger.error('Error extracting text from PDF:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  /**
   * Process image with OCR
   */
  async processImage(imageBuffer: Buffer): Promise<OcrResult> {
    this.logger.log('Processing image with OCR');

    try {
      // Enhance image quality
      const enhancedImage = await this.enhanceImage(imageBuffer);

      // Perform OCR
      if (!this.worker) {
        throw new Error('OCR worker not initialized');
      }

      const {
        data: { text, confidence },
      } = await this.worker.recognize(enhancedImage);

      const language = this.detectLanguage(text);

      return {
        text: text.trim(),
        language,
        confidence: confidence / 100, // Convert to 0-1 scale
      };
    } catch (error) {
      this.logger.error('Error processing image:', error);
      throw new Error('Failed to process image with OCR');
    }
  }

  /**
   * Enhance image quality for better OCR results
   */
  private async enhanceImage(imageBuffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(imageBuffer)
        .grayscale()
        .normalize()
        .sharpen()
        .toBuffer();
    } catch (error) {
      this.logger.warn('Image enhancement failed, using original:', error);
      return imageBuffer;
    }
  }

  /**
   * Detect language from text
   */
  detectLanguage(text: string): DocumentLanguage {
    // Check for Arabic characters
    const arabicPattern = /[\u0600-\u06FF]/;
    const englishPattern = /[a-zA-Z]/;

    const hasArabic = arabicPattern.test(text);
    const hasEnglish = englishPattern.test(text);

    if (hasArabic && hasEnglish) {
      return DocumentLanguage.MIXED;
    } else if (hasArabic) {
      return DocumentLanguage.AR;
    } else {
      return DocumentLanguage.EN;
    }
  }

  /**
   * Detect document type from extracted text
   */
  detectDocumentType(text: string): {
    type: string;
    confidence: number;
  } {
    const normalizedText = text.toLowerCase();

    // Emirates ID detection
    if (
      normalizedText.includes('emirates id') ||
      normalizedText.includes('هوية الإمارات') ||
      /784-\d{4}-\d{7}-\d/.test(text)
    ) {
      return { type: 'emirates_id', confidence: 0.9 };
    }

    // Passport detection
    if (
      normalizedText.includes('passport') ||
      normalizedText.includes('جواز سفر') ||
      normalizedText.includes('travel document')
    ) {
      return { type: 'passport', confidence: 0.85 };
    }

    // Trade License detection
    if (
      normalizedText.includes('trade license') ||
      normalizedText.includes('رخصة تجارية') ||
      normalizedText.includes('commercial license')
    ) {
      return { type: 'trade_license', confidence: 0.85 };
    }

    // Title Deed detection
    if (
      normalizedText.includes('title deed') ||
      normalizedText.includes('سند ملكية') ||
      normalizedText.includes('property title')
    ) {
      return { type: 'title_deed', confidence: 0.85 };
    }

    // Tenancy Contract detection
    if (
      normalizedText.includes('tenancy contract') ||
      normalizedText.includes('عقد إيجار') ||
      normalizedText.includes('rental agreement')
    ) {
      return { type: 'tenancy_contract', confidence: 0.8 };
    }

    // NOC detection
    if (
      normalizedText.includes('no objection') ||
      normalizedText.includes('noc') ||
      normalizedText.includes('لا مانع')
    ) {
      return { type: 'noc', confidence: 0.75 };
    }

    return { type: 'other', confidence: 0.5 };
  }
}
