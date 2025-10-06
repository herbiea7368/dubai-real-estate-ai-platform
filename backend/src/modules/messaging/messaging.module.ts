import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { MessageTemplate } from './entities/message-template.entity';
import { Consent } from '../consent/entities/consent.entity';
import { MessagingController } from './messaging.controller';
import { MessagingService } from './messaging.service';
import { TdraComplianceService } from './services/tdra-compliance.service';
import { ConsentVerificationService } from './services/consent-verification.service';
import { MessageQueueService } from './services/message-queue.service';
import { WhatsappService } from './services/whatsapp.service';
import { SmsService } from './services/sms.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, MessageTemplate, Consent]),
  ],
  controllers: [MessagingController],
  providers: [
    MessagingService,
    TdraComplianceService,
    ConsentVerificationService,
    MessageQueueService,
    WhatsappService,
    SmsService,
  ],
  exports: [MessagingService, MessageQueueService],
})
export class MessagingModule {}
