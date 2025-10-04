import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../auth/entities/user.entity';

export enum ConsentType {
  WHATSAPP = 'whatsapp',
  SMS = 'sms',
  EMAIL = 'email',
  PHONE = 'phone',
}

/**
 * Consent Entity - PDPL Compliant Audit Ledger
 *
 * This entity maintains an immutable audit trail of all user consent decisions
 * in compliance with UAE's Personal Data Protection Law (PDPL).
 *
 * Key Features:
 * - Immutable records (no updates, only inserts)
 * - Timestamped with exact consent grant/revoke moment
 * - IP address tracking for audit purposes
 * - Version tracking for consent terms changes
 */
@Entity('consents')
@Index(['personId', 'consentType'])
@Index(['timestamp'])
export class Consent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  personId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'personId' })
  person!: User;

  @Column({
    type: 'enum',
    enum: ConsentType,
  })
  consentType!: ConsentType;

  @Column({ type: 'boolean' })
  granted!: boolean;

  /**
   * Immutable timestamp - exact moment of consent decision
   * Cannot be modified after creation
   */
  @Column({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
    update: false,
  })
  timestamp!: Date;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress!: string | null;

  /**
   * Version of consent terms at time of agreement
   * Allows tracking changes in consent requirements over time
   */
  @Column({ type: 'varchar', length: 50, default: '1.0' })
  version!: string;

  /**
   * Optional metadata for additional context
   * e.g., user agent, device info, channel source
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  /**
   * Reference to the privacy policy or terms that were presented
   */
  @Column({ type: 'text', nullable: true })
  termsUrl!: string | null;

  /**
   * Expiration date for time-limited consents
   */
  @Column({ type: 'timestamp with time zone', nullable: true })
  expiresAt!: Date | null;
}
