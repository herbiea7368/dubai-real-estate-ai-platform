import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Check,
} from 'typeorm';

export enum PermitType {
  BROKER = 'broker',
  LISTING = 'listing',
  ADVERTISEMENT = 'advertisement',
}

export enum Market {
  DUBAI = 'Dubai',
  ABU_DHABI = 'Abu Dhabi',
}

export enum Issuer {
  DLD = 'DLD',
  RERA = 'RERA',
  ADGM = 'ADGM',
  ADREC = 'ADREC',
}

export enum PermitStatus {
  VALID = 'valid',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
  PENDING = 'pending',
}

export interface ValidationHistoryEntry {
  timestamp: Date;
  status: PermitStatus;
  checkedBy?: string;
  result: 'valid' | 'invalid';
  reason?: string;
}

@Entity('permits')
@Index(['status', 'market'])
@Check('"expiryDate" > "issueDate"')
export class Permit {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  @Index()
  trakheesiNumber!: string;

  @Column({ type: 'uuid', nullable: true })
  propertyId!: string | null;

  @Column({
    type: 'enum',
    enum: PermitType,
  })
  permitType!: PermitType;

  @Column({
    type: 'enum',
    enum: Market,
  })
  market!: Market;

  @Column({
    type: 'enum',
    enum: Issuer,
  })
  issuer!: Issuer;

  @Column({ type: 'date' })
  issueDate!: Date;

  @Column({ type: 'date' })
  @Index()
  expiryDate!: Date;

  @Column({
    type: 'enum',
    enum: PermitStatus,
    default: PermitStatus.VALID,
  })
  status!: PermitStatus;

  @Column({ type: 'jsonb', default: [] })
  validationHistory!: ValidationHistoryEntry[];

  @Column({ type: 'timestamp', nullable: true })
  lastCheckedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
