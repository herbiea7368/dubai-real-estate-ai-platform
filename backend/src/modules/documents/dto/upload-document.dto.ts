import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { DocumentType } from '../entities/document.entity';

export class UploadDocumentDto {
  @IsEnum(DocumentType)
  documentType!: DocumentType;

  @IsOptional()
  @IsUUID()
  relatedToPropertyId?: string;

  @IsOptional()
  @IsUUID()
  relatedToLeadId?: string;

  @IsOptional()
  @IsUUID()
  relatedToPersonId?: string;
}
