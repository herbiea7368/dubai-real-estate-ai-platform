import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';
import { PropertyType } from '../../properties/entities/property.entity';

@Entity('market_data')
@Index(['community', 'propertyType', 'dataDate'])
@Index(['dataDate'])
export class MarketData {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100 })
  @Index()
  community!: string;

  @Column({
    type: 'enum',
    enum: PropertyType
  })
  @Index()
  propertyType!: PropertyType;

  @Column('decimal', { precision: 10, scale: 2, comment: 'Average price per square foot in AED' })
  avgPriceSqft!: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true, comment: 'Average rent per square foot in AED' })
  avgRentSqft!: number;

  @Column('integer', { default: 0 })
  transactionCount!: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true, comment: 'Year-over-year price change percentage' })
  priceChangeYoY!: number;

  @Column('date')
  @Index()
  dataDate!: Date;

  @Column({ length: 50, comment: 'Data source: DLD, internal, market_index, etc.' })
  source!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
