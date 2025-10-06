import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Listing } from '../../properties/entities/listing.entity';

export enum StagingStyle {
  MODERN = 'modern',
  MINIMAL = 'minimal',
  LUXURY = 'luxury',
  TRADITIONAL = 'traditional',
  SCANDINAVIAN = 'scandinavian',
  ARABIC = 'arabic',
}

export enum RoomType {
  LIVING = 'living',
  BEDROOM = 'bedroom',
  KITCHEN = 'kitchen',
  DINING = 'dining',
  BATHROOM = 'bathroom',
  OUTDOOR = 'outdoor',
}

export enum ProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('staged_images')
export class StagedImage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  listingId!: string;

  @ManyToOne(() => Listing, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listingId' })
  listing!: Listing;

  @Column({ type: 'varchar', length: 1000 })
  originalImageUrl!: string;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  stagedImageUrl!: string;

  @Column({
    type: 'enum',
    enum: StagingStyle,
  })
  style!: StagingStyle;

  @Column({
    type: 'enum',
    enum: RoomType,
  })
  roomType!: RoomType;

  @Column({
    type: 'enum',
    enum: ProcessingStatus,
    default: ProcessingStatus.PENDING,
  })
  processingStatus!: ProcessingStatus;

  @Column({ type: 'varchar', length: 100, default: 'stable-diffusion-xl' })
  aiModel!: string;

  @Column({ type: 'int', nullable: true })
  processingTimeMs!: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: {
    dimensions?: { width: number; height: number };
    format?: string;
    transformations?: string[];
    fileSize?: number;
    error?: string;
  };

  @Column({ type: 'boolean', default: true })
  watermarkApplied!: boolean;

  @Column({ type: 'uuid' })
  createdBy!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt!: Date;
}
