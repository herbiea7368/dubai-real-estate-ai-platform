import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Message, MessageChannel, MessageType, MessageStatus, MessageLanguage } from '../entities/message.entity';
import { TdraComplianceService } from './tdra-compliance.service';
import { ConsentVerificationService } from './consent-verification.service';
import { WhatsappService } from './whatsapp.service';
import { SmsService } from './sms.service';

export interface QueueMessageDto {
  recipientId?: string;
  recipientPhone: string;
  channel: MessageChannel;
  messageType: MessageType;
  content: string;
  language?: 'en' | 'ar';
  templateId?: string;
  scheduledFor?: Date;
  metadata?: any;
  createdBy: string;
}

export interface QueueMessageResult {
  message: Message;
  status: 'queued' | 'blocked' | 'scheduled';
  reason?: string;
}

export interface ProcessQueueResult {
  processed: number;
  sent: number;
  failed: number;
  blocked: number;
}

export interface RetryResult {
  attempted: number;
  succeeded: number;
  failed: number;
}

@Injectable()
export class MessageQueueService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    private tdraService: TdraComplianceService,
    private consentService: ConsentVerificationService,
    private whatsappService: WhatsappService,
    private smsService: SmsService,
  ) {}

  /**
   * Queue a message for sending
   */
  async queueMessage(dto: QueueMessageDto): Promise<QueueMessageResult> {
    // Verify consent first
    const consentCheck = await this.consentService.verifyConsentForMessage(
      dto.recipientId || null,
      dto.recipientPhone,
      dto.channel,
      dto.messageType,
    );

    if (!consentCheck.allowed) {
      // Create blocked message record
      const message = this.messageRepository.create({
        recipientId: dto.recipientId || undefined,
        recipientPhone: dto.recipientPhone,
        channel: dto.channel,
        messageType: dto.messageType,
        content: dto.content,
        language: (dto.language || 'en') as MessageLanguage,
        templateId: dto.templateId,
        status: MessageStatus.BLOCKED,
        blockReason: consentCheck.reason,
        consentVerified: false,
        metadata: dto.metadata,
        createdBy: dto.createdBy,
      });

      await this.messageRepository.save(message);

      return {
        message,
        status: 'blocked',
        reason: consentCheck.reason,
      };
    }

    // Check TDRA window for SMS messages
    if (dto.channel === MessageChannel.SMS && !dto.scheduledFor) {
      const tdraCheck = this.tdraService.isWithinTDRAWindow();

      if (!tdraCheck.allowed) {
        // Schedule for next allowed time
        const message = this.messageRepository.create({
          recipientId: dto.recipientId || undefined,
          recipientPhone: dto.recipientPhone,
          channel: dto.channel,
          messageType: dto.messageType,
          content: dto.content,
          language: (dto.language || 'en') as MessageLanguage,
          templateId: dto.templateId,
          status: MessageStatus.QUEUED,
          scheduledFor: tdraCheck.nextAllowedTime || undefined,
          consentVerified: true,
          consentVersion: consentCheck.reason.includes('version:')
            ? consentCheck.reason.split('version:')[1].trim().replace(')', '')
            : undefined,
          metadata: dto.metadata,
          createdBy: dto.createdBy,
        });

        await this.messageRepository.save(message);

        return {
          message,
          status: 'scheduled',
          reason: `Scheduled for next TDRA window: ${this.tdraService.formatUAETime(tdraCheck.nextAllowedTime!)}`,
        };
      }
    }

    // Create queued message
    const message = this.messageRepository.create({
      recipientId: dto.recipientId || undefined,
      recipientPhone: dto.recipientPhone,
      channel: dto.channel,
      messageType: dto.messageType,
      content: dto.content,
      language: (dto.language || 'en') as MessageLanguage,
      templateId: dto.templateId,
      status: MessageStatus.QUEUED,
      scheduledFor: dto.scheduledFor || new Date(),
      consentVerified: true,
      consentVersion: consentCheck.reason.includes('version:')
        ? consentCheck.reason.split('version:')[1].trim().replace(')', '')
        : undefined,
      metadata: dto.metadata,
      createdBy: dto.createdBy,
    });

    await this.messageRepository.save(message);

    return {
      message,
      status: 'queued',
    };
  }

  /**
   * Process queued messages
   */
  async processQueue(): Promise<ProcessQueueResult> {
    const now = new Date();

    // Get all queued messages that are due
    const messages = await this.messageRepository.find({
      where: {
        status: MessageStatus.QUEUED,
        scheduledFor: LessThanOrEqual(now),
      },
      take: 100, // Process in batches
    });

    let sent = 0;
    let failed = 0;
    let blocked = 0;

    for (const message of messages) {
      // Re-verify TDRA window if SMS
      if (message.channel === MessageChannel.SMS) {
        const tdraCheck = this.tdraService.isWithinTDRAWindow();
        if (!tdraCheck.allowed) {
          message.status = MessageStatus.BLOCKED;
          message.blockReason = tdraCheck.reason || 'Outside TDRA window';
          if (tdraCheck.nextAllowedTime) {
            message.scheduledFor = tdraCheck.nextAllowedTime;
          }
          await this.messageRepository.save(message);
          blocked++;
          continue;
        }
      }

      // Re-verify consent
      const consentCheck = await this.consentService.verifyConsentForMessage(
        message.recipientId,
        message.recipientPhone,
        message.channel,
        message.messageType,
      );

      if (!consentCheck.allowed) {
        message.status = MessageStatus.BLOCKED;
        message.blockReason = consentCheck.reason;
        await this.messageRepository.save(message);
        blocked++;
        continue;
      }

      // Send message via appropriate service
      try {
        let result;

        if (message.channel === MessageChannel.WHATSAPP) {
          result = await this.whatsappService.sendMessage(
            message.recipientPhone,
            message.content,
            message.language,
          );
        } else if (message.channel === MessageChannel.SMS) {
          result = await this.smsService.sendSMS(
            message.recipientPhone,
            message.content,
            message.language,
          );
        } else {
          throw new Error(`Unsupported channel: ${message.channel}`);
        }

        if (result.success) {
          message.status = MessageStatus.SENT;
          message.sentAt = new Date();
          if (result.messageId) {
            message.vendorMessageId = result.messageId;
          }
          message.vendorResponse = { success: true };
          sent++;
        } else {
          message.status = MessageStatus.FAILED;
          message.vendorResponse = { success: false, error: result.error };
          failed++;
        }
      } catch (error) {
        message.status = MessageStatus.FAILED;
        message.vendorResponse = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        failed++;
      }

      await this.messageRepository.save(message);
    }

    return {
      processed: messages.length,
      sent,
      failed,
      blocked,
    };
  }

  /**
   * Retry failed messages
   */
  async retryFailedMessages(maxRetries = 3): Promise<RetryResult> {
    const failedMessages = await this.messageRepository.find({
      where: {
        status: MessageStatus.FAILED,
      },
      take: 50, // Retry in batches
    });

    let succeeded = 0;
    let failed = 0;

    for (const message of failedMessages) {
      if (message.retryCount >= maxRetries) {
        continue; // Skip if max retries reached
      }

      message.retryCount++;

      try {
        let result;

        if (message.channel === MessageChannel.WHATSAPP) {
          result = await this.whatsappService.sendMessage(
            message.recipientPhone,
            message.content,
            message.language,
          );
        } else if (message.channel === MessageChannel.SMS) {
          result = await this.smsService.sendSMS(
            message.recipientPhone,
            message.content,
            message.language,
          );
        } else {
          throw new Error(`Unsupported channel: ${message.channel}`);
        }

        if (result.success) {
          message.status = MessageStatus.SENT;
          message.sentAt = new Date();
          if (result.messageId) {
            message.vendorMessageId = result.messageId;
          }
          message.vendorResponse = { success: true, retried: true };
          succeeded++;
        } else {
          message.vendorResponse = { success: false, error: result.error, retried: true };
          failed++;
        }
      } catch (error) {
        message.vendorResponse = { success: false, error: error instanceof Error ? error.message : 'Unknown error', retried: true };
        failed++;
      }

      await this.messageRepository.save(message);
    }

    return {
      attempted: failedMessages.length,
      succeeded,
      failed,
    };
  }

  /**
   * Cancel a queued message
   */
  async cancelMessage(messageId: string): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    if (message.status !== MessageStatus.QUEUED) {
      throw new Error(`Cannot cancel message with status: ${message.status}`);
    }

    message.status = MessageStatus.CANCELLED;
    return this.messageRepository.save(message);
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    queued: number;
    scheduled: number;
    processing: number;
  }> {
    const now = new Date();

    const [queued, scheduled] = await Promise.all([
      this.messageRepository.count({
        where: {
          status: MessageStatus.QUEUED,
          scheduledFor: LessThanOrEqual(now),
        },
      }),
      this.messageRepository.count({
        where: {
          status: MessageStatus.QUEUED,
        },
      }),
    ]);

    return {
      queued,
      scheduled,
      processing: 0, // Could be enhanced with a processing status
    };
  }
}
