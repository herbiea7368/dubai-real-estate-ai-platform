import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Document } from './document.entity';

export enum FieldType {
  TEXT = 'text',
  DATE = 'date',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
}

@Entity('extracted_fields')
export class ExtractedField {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  documentId!: string;

  @ManyToOne(() => Document, (document) => document.extractedFields)
  @JoinColumn({ name: 'documentId' })
  document!: Document;

  @Column({ type: 'varchar', length: 255 })
  fieldName!: string;

  @Column({ type: 'text' })
  fieldValue!: string;

  @Column({
    type: 'enum',
    enum: FieldType,
  })
  fieldType!: FieldType;

  @Column({ type: 'decimal', precision: 3, scale: 2 })
  confidence!: number;

  @Column({ type: 'jsonb', nullable: true })
  boundingBox!: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  validated!: boolean;

  @Column({ type: 'text', nullable: true })
  validationError!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
