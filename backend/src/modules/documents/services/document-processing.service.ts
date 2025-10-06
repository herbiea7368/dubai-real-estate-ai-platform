import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs/promises';
import {
  Document,
  DocumentType,
  FileType,
  ProcessingStatus,
} from '../entities/document.entity';
import { OcrService } from './ocr.service';
import { DataExtractionService } from './data-extraction.service';
import { ValidationService } from './validation.service';

interface ProcessingMetadata {
  documentType?: DocumentType;
  relatedToPersonId?: string;
  relatedToPropertyId?: string;
  relatedToLeadId?: string;
}

@Injectable()
export class DocumentProcessingService {
  private readonly logger = new Logger(DocumentProcessingService.name);

  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    private readonly ocrService: OcrService,
    private readonly dataExtractionService: DataExtractionService,
    private readonly validationService: ValidationService,
  ) {}

  /**
   * Process document - main workflow
   */
  async processDocument(
    file: Express.Multer.File,
    userId: string,
    metadata: ProcessingMetadata,
  ): Promise<Document> {
    this.logger.log(`Processing document: ${file.originalname}`);

    try {
      // Determine file type
      const fileType = this.determineFileType(file.mimetype);

      // Create document record
      const document = this.documentRepository.create({
        fileName: file.originalname,
        fileUrl: file.path,
        fileType,
        documentType: metadata.documentType || DocumentType.OTHER,
        uploadedBy: userId,
        relatedToPersonId: metadata.relatedToPersonId,
        relatedToPropertyId: metadata.relatedToPropertyId,
        relatedToLeadId: metadata.relatedToLeadId,
        fileSize: file.size,
        processingStatus: ProcessingStatus.PENDING,
      });

      await this.documentRepository.save(document);

      // Process asynchronously (in real app, use queue like Bull)
      this.processAsync(document.id).catch((error) => {
        this.logger.error(`Async processing failed for ${document.id}:`, error);
      });

      return document;
    } catch (error) {
      this.logger.error('Error processing document:', error);
      throw error;
    }
  }

  /**
   * Process document asynchronously
   */
  async processAsync(documentId: string): Promise<Document> {
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    try {
      // Update status to processing
      document.processingStatus = ProcessingStatus.PROCESSING;
      await this.documentRepository.save(document);

      // Read file
      const fileBuffer = await fs.readFile(document.fileUrl);

      // Step 1: OCR Extraction
      this.logger.log(`Running OCR on document ${documentId}`);
      const ocrResult = await this.ocrService.extractText(
        fileBuffer,
        document.fileType,
      );

      document.ocrCompleted = true;
      document.ocrProvider = 'tesseract';
      document.language = ocrResult.language;
      document.confidenceScore = ocrResult.confidence;

      // Detect document type if not specified
      if (document.documentType === DocumentType.OTHER) {
        const detected = this.ocrService.detectDocumentType(ocrResult.text);
        document.documentType = detected.type as DocumentType;
      }

      await this.documentRepository.save(document);

      // Step 2: Data Extraction
      this.logger.log(`Extracting fields from document ${documentId}`);
      const extractedFields = await this.dataExtractionService.extractFields(
        ocrResult.text,
        document.documentType,
        documentId,
      );

      // Build extracted data object
      const extractedData: Record<string, any> = {};
      for (const field of extractedFields) {
        extractedData[field.fieldName] = field.fieldValue;
      }

      document.extractedData = extractedData;
      await this.documentRepository.save(document);

      // Step 3: Validation
      this.logger.log(`Validating document ${documentId}`);
      await this.validationService.validateDocument(documentId);

      // Update final status
      document.processingStatus = ProcessingStatus.COMPLETED;
      await this.documentRepository.save(document);

      this.logger.log(`Document ${documentId} processing completed successfully`);
      return document;
    } catch (error) {
      this.logger.error(`Error in async processing for ${documentId}:`, error);

      // Update document with error
      document.processingStatus = ProcessingStatus.FAILED;
      document.processingErrors = [
        error instanceof Error ? error.message : 'Unknown error',
      ];
      await this.documentRepository.save(document);

      throw error;
    }
  }

  /**
   * Reprocess document
   */
  async reprocessDocument(documentId: string): Promise<Document> {
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Clear previous results
    document.ocrCompleted = false;
    document.validationCompleted = false;
    document.extractedData = {} as Record<string, any>;
    document.validationResults = {} as Record<string, any>;
    document.processingErrors = [];
    document.processingStatus = ProcessingStatus.PENDING;

    await this.documentRepository.save(document);

    // Reprocess
    return this.processAsync(documentId);
  }

  /**
   * Get processing status
   */
  async getProcessingStatus(documentId: string): Promise<{
    status: ProcessingStatus;
    progress: {
      ocrCompleted: boolean;
      extractionCompleted: boolean;
      validationCompleted: boolean;
    };
    errors?: string[];
  }> {
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
      relations: ['extractedFields'],
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return {
      status: document.processingStatus,
      progress: {
        ocrCompleted: document.ocrCompleted,
        extractionCompleted: document.extractedFields?.length > 0,
        validationCompleted: document.validationCompleted,
      },
      errors: document.processingErrors,
    };
  }

  /**
   * Get documents by property
   */
  async getDocumentsByProperty(propertyId: string): Promise<Document[]> {
    return this.documentRepository.find({
      where: { relatedToPropertyId: propertyId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get documents by lead
   */
  async getDocumentsByLead(leadId: string): Promise<Document[]> {
    return this.documentRepository.find({
      where: { relatedToLeadId: leadId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId: string): Promise<void> {
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Delete file from storage
    try {
      await fs.unlink(document.fileUrl);
    } catch (error) {
      this.logger.warn(`Failed to delete file ${document.fileUrl}:`, error);
    }

    // Delete from database
    await this.documentRepository.remove(document);
  }

  /**
   * Determine file type from MIME type
   */
  private determineFileType(mimeType: string): FileType {
    if (mimeType === 'application/pdf') {
      return FileType.PDF;
    } else if (mimeType === 'image/jpeg') {
      return FileType.JPEG;
    } else if (mimeType === 'image/png') {
      return FileType.PNG;
    } else {
      return FileType.IMAGE;
    }
  }
}
