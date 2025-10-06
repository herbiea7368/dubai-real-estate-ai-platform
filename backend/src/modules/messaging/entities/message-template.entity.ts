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
import { MessageChannel, MessageLanguage } from './message.entity';

export enum TemplateCategory {
  PROPERTY_ALERT = 'property_alert',
  LEAD_FOLLOWUP = 'lead_followup',
  APPOINTMENT_REMINDER = 'appointment_reminder',
  MARKET_UPDATE = 'market_update',
  VALUATION_READY = 'valuation_ready',
  VIEWING_CONFIRMATION = 'viewing_confirmation',
}

@Entity('message_templates')
@Index(['templateKey'], { unique: true })
@Index(['channel', 'language'])
@Index(['active'])
export class MessageTemplate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  templateKey!: string;

  @Column({
    type: 'enum',
    enum: MessageChannel,
  })
  channel!: MessageChannel;

  @Column({
    type: 'enum',
    enum: MessageLanguage,
  })
  language!: MessageLanguage;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({
    type: 'enum',
    enum: TemplateCategory,
  })
  category!: TemplateCategory;

  @Column({ type: 'jsonb' })
  variables!: string[];

  @Column({ type: 'varchar', length: 255, nullable: true })
  whatsappTemplateId!: string;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @Column({ type: 'uuid', nullable: true })
  approvedBy!: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approvedBy' })
  approver!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
