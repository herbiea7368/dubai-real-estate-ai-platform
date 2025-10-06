import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User } from './modules/auth/entities/user.entity';
import { Consent } from './modules/consent/entities/consent.entity';
import { Permit } from './modules/permits/entities/permit.entity';
import { Property } from './modules/properties/entities/property.entity';
import { Listing } from './modules/properties/entities/listing.entity';
import { Lead } from './modules/leads/entities/lead.entity';
import { LeadActivity } from './modules/leads/entities/lead-activity.entity';
import { StagedImage } from './modules/ai/entities/staged-image.entity';
import { Valuation } from './modules/valuations/entities/valuation.entity';
import { MarketData } from './modules/valuations/entities/market-data.entity';
import { AnalyticsEvent } from './modules/analytics/entities/analytics-event.entity';
import { FunnelStage } from './modules/analytics/entities/funnel-stage.entity';
import { Message } from './modules/messaging/entities/message.entity';
import { MessageTemplate } from './modules/messaging/entities/message-template.entity';
import { Document } from './modules/documents/entities/document.entity';
import { ExtractedField } from './modules/documents/entities/extracted-field.entity';
import { Payment } from './modules/payments/entities/payment.entity';
import { EscrowAccount } from './modules/payments/entities/escrow-account.entity';
import { InstallmentPlan } from './modules/payments/entities/installment-plan.entity';

config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'real_estate_dev',
  entities: [User, Consent, Permit, Property, Listing, Lead, LeadActivity, StagedImage, Valuation, MarketData, AnalyticsEvent, FunnelStage, Message, MessageTemplate, Document, ExtractedField, Payment, EscrowAccount, InstallmentPlan],
  migrations: ['src/migrations/**/*.ts'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
