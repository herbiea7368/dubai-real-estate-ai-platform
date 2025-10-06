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
import { Property } from '../../properties/entities/property.entity';
import { Lead } from '../../leads/entities/lead.entity';

export enum InstallmentFrequency {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  SEMI_ANNUAL = 'semi_annual',
  ANNUAL = 'annual',
}

export enum InstallmentPlanStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  DEFAULTED = 'defaulted',
  CANCELLED = 'cancelled',
}

export interface Installment {
  number: number;
  amount: number;
  dueDate: Date;
  paidDate?: Date;
  paymentId?: string;
  status: 'pending' | 'paid' | 'overdue' | 'waived';
  lateFee?: number;
}

@Entity('installment_plans')
@Index(['propertyId'])
@Index(['leadId'])
@Index(['status'])
@Index(['startDate'])
export class InstallmentPlan {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  propertyId!: string;

  @ManyToOne(() => Property)
  @JoinColumn({ name: 'propertyId' })
  property!: Property;

  @Column({ type: 'uuid' })
  leadId!: string;

  @ManyToOne(() => Lead)
  @JoinColumn({ name: 'leadId' })
  lead!: Lead;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  totalAmount!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  downPaymentAmount!: number;

  @Column({ type: 'int' })
  installmentCount!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  installmentAmount!: number;

  @Column({
    type: 'enum',
    enum: InstallmentFrequency,
  })
  frequency!: InstallmentFrequency;

  @Column({ type: 'date' })
  startDate!: Date;

  @Column({ type: 'date' })
  endDate!: Date;

  @Column({
    type: 'enum',
    enum: InstallmentPlanStatus,
    default: InstallmentPlanStatus.ACTIVE,
  })
  status!: InstallmentPlanStatus;

  @Column({ type: 'jsonb', default: [] })
  installments!: Installment[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
