import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Property } from '../../properties/entities/property.entity';
import { Lead } from '../../leads/entities/lead.entity';
import { ExtractedField } from './extracted-field.entity';

export enum FileType {
  PDF = 'pdf',
  IMAGE = 'image',
  JPEG = 'jpeg',
  PNG = 'png',
}

export enum DocumentType {
  EMIRATES_ID = 'emirates_id',
  PASSPORT = 'passport',
  TRADE_LICENSE = 'trade_license',
  TITLE_DEED = 'title_deed',
  TENANCY_CONTRACT = 'tenancy_contract',
  NOC = 'noc',
  OTHER = 'other',
}

export enum ProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  VALIDATED = 'validated',
}

export enum DocumentLanguage {
  EN = 'en',
  AR = 'ar',
  MIXED = 'mixed',
}

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 500 })
  fileName!: string;

  @Column({ type: 'text' })
  fileUrl!: string;

  @Column({
    type: 'enum',
    enum: FileType,
  })
  fileType!: FileType;

  @Column({
    type: 'enum',
    enum: DocumentType,
  })
  documentType!: DocumentType;

  @Column({ type: 'uuid' })
  uploadedBy!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploadedBy' })
  uploader!: User;

  @Column({ type: 'uuid', nullable: true })
  relatedToPersonId!: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'relatedToPersonId' })
  relatedPerson!: User;

  @Column({ type: 'uuid', nullable: true })
  relatedToPropertyId!: string;

  @ManyToOne(() => Property, { nullable: true })
  @JoinColumn({ name: 'relatedToPropertyId' })
  relatedProperty!: Property;

  @Column({ type: 'uuid', nullable: true })
  relatedToLeadId!: string;

  @ManyToOne(() => Lead, { nullable: true })
  @JoinColumn({ name: 'relatedToLeadId' })
  relatedLead!: Lead;

  @Column({
    type: 'enum',
    enum: ProcessingStatus,
    default: ProcessingStatus.PENDING,
  })
  processingStatus!: ProcessingStatus;

  @Column({ type: 'boolean', default: false })
  ocrCompleted!: boolean;

  @Column({ type: 'boolean', default: false })
  validationCompleted!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  extractedData!: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  validationResults!: Record<string, any>;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ocrProvider!: string;

  @Column({ type: 'text', array: true, nullable: true })
  processingErrors!: string[];

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  confidenceScore!: number;

  @Column({
    type: 'enum',
    enum: DocumentLanguage,
    nullable: true,
  })
  language!: DocumentLanguage;

  @Column({ type: 'integer', nullable: true })
  pageCount!: number;

  @Column({ type: 'integer', nullable: true })
  fileSize!: number;

  @OneToMany(() => ExtractedField, (field) => field.document)
  extractedFields!: ExtractedField[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
