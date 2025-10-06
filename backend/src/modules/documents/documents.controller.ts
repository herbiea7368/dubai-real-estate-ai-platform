import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { DocumentProcessingService } from './services/document-processing.service';
import { ValidationService } from './services/validation.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document, DocumentType } from './entities/document.entity';
import { ExtractedField } from './entities/extracted-field.entity';
import { multerOptions } from './config/multer.config';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(
    private readonly documentProcessingService: DocumentProcessingService,
    private readonly validationService: ValidationService,
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    @InjectRepository(ExtractedField)
    private readonly extractedFieldRepository: Repository<ExtractedField>,
  ) {}

  @Post('upload')
  @UseGuards(RolesGuard)
  @Roles(UserRole.AGENT, UserRole.COMPLIANCE, UserRole.BUYER)
  @UseInterceptors(FileInterceptor('file', multerOptions))
  @HttpCode(HttpStatus.CREATED)
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Query('documentType') documentType: DocumentType,
    @Query('relatedToPropertyId') relatedToPropertyId?: string,
    @Query('relatedToLeadId') relatedToLeadId?: string,
    @Query('relatedToPersonId') relatedToPersonId?: string,
    @Request() req?: any,
  ) {
    const userId = req.user.userId;

    const document = await this.documentProcessingService.processDocument(
      file,
      userId,
      {
        documentType,
        relatedToPropertyId,
        relatedToLeadId,
        relatedToPersonId,
      },
    );

    return {
      documentId: document.id,
      status: document.processingStatus,
      extractedData: document.extractedData,
    };
  }

  @Get(':id')
  async getDocument(@Param('id') id: string) {
    const document = await this.documentRepository.findOne({
      where: { id },
      relations: ['extractedFields', 'uploader', 'relatedProperty', 'relatedLead'],
    });

    if (!document) {
      return { error: 'Document not found' };
    }

    return document;
  }

  @Get(':id/extracted-fields')
  async getExtractedFields(@Param('id') id: string) {
    const fields = await this.extractedFieldRepository.find({
      where: { documentId: id },
      order: { createdAt: 'ASC' },
    });

    return fields;
  }

  @Post(':id/validate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COMPLIANCE)
  async validateDocument(@Param('id') id: string) {
    const result = await this.validationService.validateDocument(id);
    return result;
  }

  @Post(':id/reprocess')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COMPLIANCE)
  async reprocessDocument(@Param('id') id: string) {
    const document = await this.documentProcessingService.reprocessDocument(id);
    return {
      documentId: document.id,
      status: document.processingStatus,
      extractedData: document.extractedData,
    };
  }

  @Get('property/:propertyId')
  async getDocumentsByProperty(@Param('propertyId') propertyId: string) {
    const documents = await this.documentProcessingService.getDocumentsByProperty(
      propertyId,
    );
    return documents;
  }

  @Get('lead/:leadId')
  async getDocumentsByLead(@Param('leadId') leadId: string) {
    const documents = await this.documentProcessingService.getDocumentsByLead(
      leadId,
    );
    return documents;
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.COMPLIANCE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDocument(@Param('id') id: string) {
    await this.documentProcessingService.deleteDocument(id);
  }
}
