import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class ProcessDocumentDto {
  @IsUUID()
  documentId!: string;

  @IsOptional()
  @IsBoolean()
  forceReprocess?: boolean;
}
