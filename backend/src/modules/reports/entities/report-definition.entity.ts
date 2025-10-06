import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

export enum ReportCategory {
  SALES = 'sales',
  MARKETING = 'marketing',
  LEADS = 'leads',
  FINANCE = 'finance',
  OPERATIONS = 'operations',
  COMPLIANCE = 'compliance',
}

export enum ReportType {
  SUMMARY = 'summary',
  DETAIL = 'detail',
  TREND = 'trend',
  COMPARISON = 'comparison',
  FORECAST = 'forecast',
}

@Entity('report_definitions')
@Index(['reportKey'], { unique: true })
@Index(['category'])
@Index(['isActive'])
export class ReportDefinition {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  @Index()
  reportKey!: string;

  @Column()
  name!: string;

  @Column('text')
  description!: string;

  @Column({
    type: 'enum',
    enum: ReportCategory,
  })
  category!: ReportCategory;

  @Column({
    type: 'enum',
    enum: ReportType,
  })
  reportType!: ReportType;

  @Column()
  dataSource!: string;

  @Column('jsonb', { nullable: true })
  parameters!: Record<string, any>;

  @Column('jsonb')
  columns!: Array<{
    key: string;
    label: string;
    type: string;
    format?: string;
  }>;

  @Column('jsonb', { nullable: true })
  aggregations!: Record<string, any>;

  @Column('jsonb', { nullable: true })
  filters!: Record<string, any>;

  @Column('jsonb', { nullable: true })
  sorting!: {
    field: string;
    order: 'ASC' | 'DESC';
  }[];

  @Column('jsonb', { nullable: true })
  visualizations!: Array<{
    type: string;
    config: Record<string, any>;
  }>;

  @Column('text', { array: true })
  accessRoles!: string[];

  @Column('uuid')
  createdBy!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator!: User;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
