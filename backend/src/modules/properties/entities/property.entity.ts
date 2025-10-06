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
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Listing } from './listing.entity';
import { Market } from '../../permits/entities/permit.entity';

export enum PropertyType {
  APARTMENT = 'apartment',
  VILLA = 'villa',
  TOWNHOUSE = 'townhouse',
  PENTHOUSE = 'penthouse',
  LAND = 'land',
  COMMERCIAL = 'commercial',
}

export enum PropertyStatus {
  AVAILABLE = 'available',
  RESERVED = 'reserved',
  SOLD = 'sold',
  RENTED = 'rented',
  OFF_MARKET = 'off_market',
}

export enum PropertyPurpose {
  SALE = 'sale',
  RENT = 'rent',
}

export enum CompletionStatus {
  READY = 'ready',
  OFF_PLAN = 'off_plan',
}

@Entity('properties')
@Index(['community'])
@Index(['developer'])
@Index(['referenceNumber'])
export class Property {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  referenceNumber!: string;

  @Column({
    type: 'enum',
    enum: Market,
    default: Market.DUBAI,
  })
  market!: Market;

  @Column({
    type: 'enum',
    enum: PropertyType,
  })
  type!: PropertyType;

  @Column({
    type: 'enum',
    enum: PropertyStatus,
    default: PropertyStatus.AVAILABLE,
  })
  status!: PropertyStatus;

  @Column({
    type: 'enum',
    enum: PropertyPurpose,
  })
  purpose!: PropertyPurpose;

  @Column()
  @Index()
  community!: string;

  @Column({ nullable: true })
  subCommunity!: string;

  @Column({ nullable: true })
  @Index()
  developer!: string;

  @Column({ type: 'int' })
  bedrooms!: number;

  @Column({ type: 'decimal', precision: 3, scale: 1 })
  bathrooms!: number;

  @Column({ type: 'int' })
  areaSqft!: number;

  @Column({ type: 'int' })
  areaSqm!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  priceAed!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  pricePerSqft!: number;

  @Column({
    type: 'enum',
    enum: CompletionStatus,
  })
  completionStatus!: CompletionStatus;

  @Column({ type: 'date', nullable: true })
  handoverDate!: Date;

  @Column('text', { array: true, default: '{}' })
  amenities!: string[];

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  location!: {
    lat: number;
    lng: number;
  };

  @Column({ type: 'jsonb' })
  address!: {
    street?: string;
    building?: string;
    area?: string;
  };

  @Column({ type: 'uuid' })
  agentId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'agentId' })
  agent!: User;

  @OneToMany(() => Listing, (listing) => listing.property)
  listings!: Listing[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @BeforeInsert()
  @BeforeUpdate()
  calculateDerivedFields() {
    if (this.areaSqft) {
      this.areaSqm = Math.round(this.areaSqft * 0.092903);
    }
    if (this.areaSqft && this.priceAed) {
      this.pricePerSqft = Number((Number(this.priceAed) / this.areaSqft).toFixed(2));
    }
  }
}
