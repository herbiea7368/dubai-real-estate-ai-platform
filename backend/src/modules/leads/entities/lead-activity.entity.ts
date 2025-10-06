import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Lead } from './lead.entity';
import { User } from '../../auth/entities/user.entity';

export enum ActivityType {
  EMAIL_SENT = 'email_sent',
  EMAIL_OPENED = 'email_opened',
  SMS_SENT = 'sms_sent',
  WHATSAPP_SENT = 'whatsapp_sent',
  CALL_MADE = 'call_made',
  PROPERTY_VIEWED = 'property_viewed',
  MEETING_SCHEDULED = 'meeting_scheduled',
  MEETING_COMPLETED = 'meeting_completed',
  OFFER_MADE = 'offer_made',
  NOTE_ADDED = 'note_added',
  LEAD_CREATED = 'lead_created',
  STATUS_CHANGED = 'status_changed',
  ASSIGNED = 'assigned',
}

@Entity('lead_activities')
@Index(['leadId', 'timestamp'])
@Index(['activityType'])
export class LeadActivity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  leadId!: string;

  @ManyToOne(() => Lead, (lead) => lead.activities, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'leadId' })
  lead!: Lead;

  @Column({
    type: 'enum',
    enum: ActivityType,
  })
  activityType!: ActivityType;

  @Column({ type: 'uuid', nullable: true })
  performedBy!: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'performedBy' })
  performer!: User | null;

  @Column({ type: 'jsonb', default: {} })
  details!: Record<string, any>;

  @CreateDateColumn()
  timestamp!: Date;
}
