import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Property } from '../../properties/entities/property.entity';
import { Listing } from '../../properties/entities/listing.entity';
import { Lead } from '../../leads/entities/lead.entity';

export enum EventType {
  PAGE_VIEW = 'page_view',
  SEARCH = 'search',
  LISTING_CLICK = 'listing_click',
  PROPERTY_VIEW = 'property_view',
  CONTACT_CLICK = 'contact_click',
  WHATSAPP_CLICK = 'whatsapp_click',
  CALL_CLICK = 'call_click',
  EMAIL_CLICK = 'email_click',
  FAVORITE_ADD = 'favorite_add',
  FAVORITE_REMOVE = 'favorite_remove',
  FILTER_APPLY = 'filter_apply',
  SHARE_CLICK = 'share_click',
}

export enum DeviceType {
  DESKTOP = 'desktop',
  MOBILE = 'mobile',
  TABLET = 'tablet',
}

@Entity('analytics_events')
@Index(['sessionId', 'timestamp'])
@Index(['eventType', 'timestamp'])
export class AnalyticsEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: EventType,
  })
  eventType!: EventType;

  @Column('uuid')
  sessionId!: string;

  @Column('uuid', { nullable: true })
  userId!: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column('uuid', { nullable: true })
  propertyId!: string;

  @ManyToOne(() => Property, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'propertyId' })
  property!: Property;

  @Column('uuid', { nullable: true })
  listingId!: string;

  @ManyToOne(() => Listing, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listingId' })
  listing!: Listing;

  @Column('uuid', { nullable: true })
  leadId!: string;

  @ManyToOne(() => Lead, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'leadId' })
  lead!: Lead;

  @Column('jsonb', { nullable: true })
  eventData!: Record<string, any>;

  @Column({ length: 50, default: 'web' })
  source!: string;

  @Column({
    type: 'enum',
    enum: DeviceType,
    nullable: true,
  })
  deviceType!: DeviceType;

  @Column({ type: 'text', nullable: true })
  userAgent!: string;

  @Column({ length: 45, nullable: true })
  ipAddress!: string;

  @Column({ type: 'text', nullable: true })
  referrer!: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  timestamp!: Date;
}
