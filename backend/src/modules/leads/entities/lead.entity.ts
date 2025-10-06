import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { LeadActivity } from './lead-activity.entity';

export enum LeadSource {
  WEBSITE = 'website',
  BAYUT = 'bayut',
  DUBIZZLE = 'dubizzle',
  PF = 'pf',
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram',
  REFERRAL = 'referral',
  WALK_IN = 'walk_in',
  CALL = 'call',
}

export enum LeadTier {
  HOT = 'hot',
  WARM = 'warm',
  COLD = 'cold',
}

export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  NURTURE = 'nurture',
  CONVERTED = 'converted',
  LOST = 'lost',
}

export enum PropertyType {
  APARTMENT = 'apartment',
  VILLA = 'villa',
  TOWNHOUSE = 'townhouse',
  PENTHOUSE = 'penthouse',
}

@Entity('leads')
@Index(['email'])
@Index(['phone'])
@Index(['tier', 'status'])
@Index(['assignedToAgentId'])
@Index(['source'])
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  personId!: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'personId' })
  person!: User | null;

  @Column({ type: 'varchar', length: 100 })
  firstName!: string;

  @Column({ type: 'varchar', length: 100 })
  lastName!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 20 })
  phone!: string;

  @Column({ type: 'varchar', length: 10, default: '+971' })
  countryCode!: string;

  @Column({
    type: 'enum',
    enum: LeadSource,
  })
  source!: LeadSource;

  @Column({ type: 'varchar', length: 255, nullable: true })
  campaign!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  utmSource!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  utmMedium!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  utmCampaign!: string | null;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.0 })
  score!: number;

  @Column({
    type: 'enum',
    enum: LeadTier,
    default: LeadTier.COLD,
  })
  tier!: LeadTier;

  @Column({
    type: 'enum',
    enum: LeadStatus,
    default: LeadStatus.NEW,
  })
  status!: LeadStatus;

  @Column({ type: 'uuid', nullable: true })
  assignedToAgentId!: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignedToAgentId' })
  assignedToAgent!: User | null;

  @Column({ type: 'jsonb', default: [] })
  propertyInterests!: Array<{
    propertyId?: string;
    propertyType?: string;
    community?: string;
  }>;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  budget!: {
    min?: number;
    max?: number;
    currency?: string;
  } | null;

  @Column({ type: 'text', array: true, default: [] })
  preferredCommunities!: string[];

  @Column({
    type: 'enum',
    enum: PropertyType,
    nullable: true,
  })
  preferredPropertyType!: PropertyType | null;

  @Column({ type: 'boolean', default: false })
  interestedInOffPlan!: boolean;

  @Column({ type: 'boolean', default: false })
  investorProfile!: boolean;

  @Column({ type: 'boolean', default: false })
  visaEligibilityInterest!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastContactedAt!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  conversionDate!: Date | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'jsonb', default: {} })
  scoringFeatures!: {
    budgetScore?: number;
    engagementScore?: number;
    sourceScore?: number;
    responseScore?: number;
    completenessScore?: number;
  };

  @OneToMany(() => LeadActivity, (activity) => activity.lead)
  activities!: LeadActivity[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
