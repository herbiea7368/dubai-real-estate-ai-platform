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
import { User } from '../../auth/entities/user.entity';

export enum EscrowStatus {
  ACTIVE = 'active',
  FUNDED = 'funded',
  PARTIAL_RELEASE = 'partial_release',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed',
}

export interface EscrowCondition {
  id: string;
  description: string;
  required: boolean;
  fulfilled: boolean;
  fulfilledAt?: Date;
  fulfilledBy?: string;
  evidence?: string;
}

export interface ReleaseApproval {
  requestId: string;
  amount: number;
  reason: string;
  requestedBy: string;
  requestedAt: Date;
  buyerApproved: boolean;
  buyerApprovedAt?: Date;
  sellerApproved: boolean;
  sellerApprovedAt?: Date;
  executed: boolean;
  executedAt?: Date;
  recipient?: string;
}

@Entity('escrow_accounts')
@Index(['accountNumber'], { unique: true })
@Index(['propertyId'])
@Index(['buyerId'])
@Index(['sellerId'])
@Index(['status'])
export class EscrowAccount {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  accountNumber!: string;

  @Column({ type: 'uuid' })
  propertyId!: string;

  @ManyToOne(() => Property)
  @JoinColumn({ name: 'propertyId' })
  property!: Property;

  @Column({ type: 'uuid' })
  buyerId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'buyerId' })
  buyer!: User;

  @Column({ type: 'uuid' })
  sellerId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sellerId' })
  seller!: User;

  @Column({ type: 'uuid', nullable: true })
  agentId?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'agentId' })
  agent?: User;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  totalAmount!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  depositedAmount!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  releasedAmount!: number;

  @Column({
    type: 'enum',
    enum: EscrowStatus,
    default: EscrowStatus.ACTIVE,
  })
  status!: EscrowStatus;

  @Column({ type: 'jsonb', default: [] })
  conditions!: EscrowCondition[];

  @Column({ type: 'jsonb', default: [] })
  releaseApprovals!: ReleaseApproval[];

  @Column({ type: 'varchar', length: 200 })
  bankName!: string;

  @Column({ type: 'varchar', length: 100 })
  bankAccountNumber!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  iban?: string;

  @Column({ type: 'timestamp' })
  openedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  closedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
