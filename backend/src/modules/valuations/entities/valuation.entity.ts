import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Property } from '../../properties/entities/property.entity';
import { User } from '../../auth/entities/user.entity';

export enum ConfidenceLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum ValuationMethod {
  COMPARATIVE = 'comparative',
  HEDONIC = 'hedonic',
  HYBRID = 'hybrid'
}

@Entity('valuations')
@Index(['propertyId', 'createdAt'])
@Index(['requestedBy'])
export class Valuation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  propertyId!: string;

  @ManyToOne(() => Property, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'propertyId' })
  property!: Property;

  @Column('decimal', { precision: 12, scale: 2 })
  estimatedValueAed!: number;

  @Column('decimal', { precision: 12, scale: 2 })
  confidenceLowAed!: number;

  @Column('decimal', { precision: 12, scale: 2 })
  confidenceHighAed!: number;

  @Column({
    type: 'enum',
    enum: ConfidenceLevel
  })
  confidenceLevel!: ConfidenceLevel;

  @Column({
    type: 'enum',
    enum: ValuationMethod,
    default: ValuationMethod.COMPARATIVE
  })
  valuationMethod!: ValuationMethod;

  @Column('jsonb', { nullable: true })
  comparableProperties!: Array<{
    propertyId: string;
    similarityScore: number;
    price: number;
    adjustedPrice: number;
  }>;

  @Column('jsonb')
  features!: {
    locationScore: number;
    sizeScore: number;
    amenityScore: number;
    ageScore: number;
    floorScore?: number;
    viewScore?: number;
    [key: string]: any;
  };

  @Column('jsonb', { nullable: true })
  marketFactors!: {
    avgPriceSqft: number;
    marketTrend: string;
    transactionVolume: number;
    [key: string]: any;
  };

  @Column('decimal', { precision: 10, scale: 2 })
  pricePerSqft!: number;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  estimatedRentAed!: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  grossYieldPct!: number;

  @Column('decimal', { precision: 5, scale: 2, comment: 'Mean Absolute Error percentage' })
  mae!: number;

  @Column('uuid')
  requestedBy!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'requestedBy' })
  requester!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
