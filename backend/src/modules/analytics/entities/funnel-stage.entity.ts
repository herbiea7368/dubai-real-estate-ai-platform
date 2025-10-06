import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Property } from '../../properties/entities/property.entity';
import { Listing } from '../../properties/entities/listing.entity';

export enum FunnelStageType {
  SEARCH = 'search',
  LISTING = 'listing',
  DETAIL = 'detail',
  CONTACT = 'contact',
  CONVERSION = 'conversion',
}

@Entity('funnel_stages')
@Index(['sessionId', 'enteredAt'])
export class FunnelStage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  sessionId!: string;

  @Column({
    type: 'enum',
    enum: FunnelStageType,
  })
  stage!: FunnelStageType;

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
  previousStageId!: string;

  @ManyToOne(() => FunnelStage, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'previousStageId' })
  previousStage!: FunnelStage;

  @Column('integer', { nullable: true })
  timeInStageSeconds!: number;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  enteredAt!: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  exitedAt!: Date;

  @Column('boolean', { default: false })
  convertedToNextStage!: boolean;
}
