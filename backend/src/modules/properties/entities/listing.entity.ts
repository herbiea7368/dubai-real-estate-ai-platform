import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Property } from './property.entity';
import { User } from '../../auth/entities/user.entity';

export enum ListingStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum ListingLanguage {
  EN = 'en',
  AR = 'ar',
  BOTH = 'both',
}

export enum ListingBadge {
  HOT_DEAL = 'hot_deal',
  NEW_LAUNCH = 'new_launch',
  VERIFIED = 'verified',
  EXCLUSIVE = 'exclusive',
}

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  TOUR_360 = '360',
  FLOORPLAN = 'floorplan',
}

@Entity('listings')
export class Listing {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  propertyId!: string;

  @ManyToOne(() => Property, (property) => property.listings)
  @JoinColumn({ name: 'propertyId' })
  property!: Property;

  @Column({ type: 'uuid', nullable: true })
  permitId!: string;

  @Column()
  titleEn!: string;

  @Column()
  titleAr!: string;

  @Column({ type: 'text' })
  descriptionEn!: string;

  @Column({ type: 'text' })
  descriptionAr!: string;

  @Column('text', { array: true, default: '{}' })
  features!: string[];

  @Column({
    type: 'jsonb',
    default: '[]',
  })
  mediaUrls!: Array<{
    url: string;
    type: MediaType;
    order?: number;
  }>;

  @Column({ type: 'boolean', default: false })
  virtualStagingApplied!: boolean;

  @Column({ type: 'int', default: 0 })
  stagedImageCount!: number;

  @Column('text', { array: true, default: '{}' })
  publishedChannels!: string[];

  @Column({
    type: 'enum',
    enum: ListingStatus,
    default: ListingStatus.DRAFT,
  })
  status!: ListingStatus;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt!: Date;

  @Column({ type: 'int', default: 0 })
  viewCount!: number;

  @Column({ type: 'int', default: 0 })
  contactCount!: number;

  @Column({
    type: 'enum',
    enum: ListingLanguage,
    default: ListingLanguage.BOTH,
  })
  language!: ListingLanguage;

  @Column('text', { array: true, default: '{}' })
  badges!: ListingBadge[];

  @Column({ type: 'uuid' })
  createdBy!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
