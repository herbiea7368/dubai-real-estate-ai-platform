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
import { User } from '../../auth/entities/user.entity';
import { EscrowAccount } from './escrow-account.entity';

export enum PaymentType {
  BOOKING_DEPOSIT = 'booking_deposit',
  DOWN_PAYMENT = 'down_payment',
  INSTALLMENT = 'installment',
  AGENCY_FEE = 'agency_fee',
  SERVICE_FEE = 'service_fee',
  EARNEST_MONEY = 'earnest_money',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  DISPUTED = 'disputed',
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer',
  CHEQUE = 'cheque',
  CASH = 'cash',
}

export enum PaymentGateway {
  TELR = 'telr',
  NETWORK_INTERNATIONAL = 'network_international',
  PAYFORT = 'payfort',
  STRIPE = 'stripe',
  MANUAL = 'manual',
}

@Entity('payments')
@Index(['transactionId'], { unique: true })
@Index(['status'])
@Index(['propertyId'])
@Index(['leadId'])
@Index(['paidBy'])
@Index(['createdAt'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  transactionId!: string;

  @Column({
    type: 'enum',
    enum: PaymentType,
  })
  paymentType!: PaymentType;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount!: number;

  @Column({ type: 'varchar', length: 3, default: 'AED' })
  currency!: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status!: PaymentStatus;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  paymentMethod!: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentGateway,
  })
  gateway!: PaymentGateway;

  @Column({ type: 'varchar', length: 200, nullable: true })
  gatewayTransactionId?: string;

  @Column({ type: 'jsonb', nullable: true })
  gatewayResponse?: any;

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

  @Column({ type: 'uuid' })
  paidBy!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'paidBy' })
  payer!: User;

  @Column({ type: 'uuid', nullable: true })
  receivedBy?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'receivedBy' })
  receiver?: User;

  @Column({ type: 'uuid', nullable: true })
  escrowAccountId?: string;

  @ManyToOne(() => EscrowAccount)
  @JoinColumn({ name: 'escrowAccountId' })
  escrowAccount?: EscrowAccount;

  @Column({ type: 'varchar', length: 100, nullable: true })
  invoiceNumber?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  receiptUrl?: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  refundAmount!: number;

  @Column({ type: 'timestamp', nullable: true })
  refundedAt?: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  processingFee!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  netAmount!: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: any;

  @Column({ type: 'text', nullable: true })
  failureReason?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
