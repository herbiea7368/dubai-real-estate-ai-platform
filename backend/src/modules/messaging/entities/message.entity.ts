import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

export enum MessageChannel {
  WHATSAPP = 'whatsapp',
  SMS = 'sms',
  EMAIL = 'email',
}

export enum MessageType {
  TRANSACTIONAL = 'transactional',
  MARKETING = 'marketing',
  NOTIFICATION = 'notification',
}

export enum MessageStatus {
  QUEUED = 'queued',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  BLOCKED = 'blocked',
  CANCELLED = 'cancelled',
}

export enum MessageLanguage {
  EN = 'en',
  AR = 'ar',
}

@Entity('messages')
@Index(['recipientPhone'])
@Index(['status'])
@Index(['scheduledFor'])
@Index(['createdAt'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  recipientId!: string;

  @Column({ type: 'varchar', length: 20 })
  recipientPhone!: string;

  @Column({
    type: 'enum',
    enum: MessageChannel,
  })
  channel!: MessageChannel;

  @Column({
    type: 'enum',
    enum: MessageType,
  })
  messageType!: MessageType;

  @Column({ type: 'varchar', length: 100, nullable: true })
  templateId!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({
    type: 'enum',
    enum: MessageLanguage,
    default: MessageLanguage.EN,
  })
  language!: MessageLanguage;

  @Column({
    type: 'enum',
    enum: MessageStatus,
    default: MessageStatus.QUEUED,
  })
  status!: MessageStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  blockReason!: string;

  @Column({ type: 'timestamp', nullable: true })
  sentAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  scheduledFor!: Date;

  @Column({ type: 'boolean', default: false })
  consentVerified!: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  consentVersion!: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: {
    campaignId?: string;
    propertyId?: string;
    propertyReference?: string;
    agentId?: string;
    leadId?: string;
    appointmentId?: string;
    [key: string]: any;
  };

  @Column({ type: 'varchar', length: 255, nullable: true })
  vendorMessageId!: string;

  @Column({ type: 'jsonb', nullable: true })
  vendorResponse!: {
    status?: string;
    errorCode?: string;
    errorMessage?: string;
    deliveryStatus?: string;
    [key: string]: any;
  };

  @Column({ type: 'int', default: 0 })
  retryCount!: number;

  @Column({ type: 'uuid' })
  createdBy!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
