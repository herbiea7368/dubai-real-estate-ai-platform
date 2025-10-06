import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentsController } from './documents.controller';
import { Document } from './entities/document.entity';
import { ExtractedField } from './entities/extracted-field.entity';
import { Property } from '../properties/entities/property.entity';
import { Lead } from '../leads/entities/lead.entity';
import { OcrService } from './services/ocr.service';
import { DataExtractionService } from './services/data-extraction.service';
import { ValidationService } from './services/validation.service';
import { DocumentProcessingService } from './services/document-processing.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document, ExtractedField, Property, Lead]),
  ],
  controllers: [DocumentsController],
  providers: [
    OcrService,
    DataExtractionService,
    ValidationService,
    DocumentProcessingService,
  ],
  exports: [DocumentProcessingService, ValidationService],
})
export class DocumentsModule {}
