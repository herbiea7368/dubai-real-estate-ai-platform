import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Consent, ConsentType } from '../../consent/entities/consent.entity';
import { MessageChannel, MessageType } from '../entities/message.entity';

export interface ConsentVerificationResult {
  granted: boolean;
  version: string | null;
  grantedAt: Date | null;
}

export interface MessageConsentResult {
  allowed: boolean;
  reason: string;
}

@Injectable()
export class ConsentVerificationService {
  constructor(
    @InjectRepository(Consent)
    private consentRepository: Repository<Consent>,
  ) {}

  /**
   * Verify if a person has granted consent for a specific channel
   */
  async verifyConsent(
    personId: string | null,
    phone: string | null,
    channel: MessageChannel,
  ): Promise<ConsentVerificationResult> {
    if (!personId && !phone) {
      return {
        granted: false,
        version: null,
        grantedAt: null,
      };
    }

    // Map channel to consent type
    const consentType = this.mapChannelToConsentType(channel);

    // Build query
    const query = this.consentRepository.createQueryBuilder('consent')
      .where('consent.consentType = :consentType', { consentType })
      .andWhere('consent.granted = :granted', { granted: true })
      .orderBy('consent.grantedAt', 'DESC');

    // Add person or phone filter
    if (personId) {
      query.andWhere('consent.personId = :personId', { personId });
    } else if (phone) {
      query.andWhere('consent.phone = :phone', { phone });
    }

    const consent = await query.getOne();

    if (!consent) {
      return {
        granted: false,
        version: null,
        grantedAt: null,
      };
    }

    // Check if consent is still valid (not expired)
    if (consent.expiresAt && new Date() > consent.expiresAt) {
      return {
        granted: false,
        version: null,
        grantedAt: null,
      };
    }

    return {
      granted: true,
      version: consent.version,
      grantedAt: consent.timestamp,
    };
  }

  /**
   * Verify consent specifically for a message
   */
  async verifyConsentForMessage(
    recipientId: string | null,
    recipientPhone: string,
    channel: MessageChannel,
    messageType: MessageType,
  ): Promise<MessageConsentResult> {
    // Transactional messages don't require consent (e.g., password reset, order confirmation)
    if (messageType === MessageType.TRANSACTIONAL) {
      return {
        allowed: true,
        reason: 'Transactional messages do not require consent',
      };
    }

    // Marketing and notification messages require consent
    const consentResult = await this.verifyConsent(recipientId, recipientPhone, channel);

    if (!consentResult.granted) {
      return {
        allowed: false,
        reason: `Missing ${channel} consent for ${messageType} messages`,
      };
    }

    return {
      allowed: true,
      reason: `Consent granted (version: ${consentResult.version})`,
    };
  }

  /**
   * Record consent check in audit trail
   * This can be used to log consent verification attempts
   */
  async recordConsentCheck(
    _messageId: string,
    _consentStatus: boolean,
    _version: string | null,
  ): Promise<boolean> {
    // This is a placeholder for audit logging
    // In a production system, you might log to a separate audit table
    // or an external logging service

    // For now, we just return success
    return true;
  }

  /**
   * Map message channel to consent type
   */
  private mapChannelToConsentType(channel: MessageChannel): ConsentType {
    switch (channel) {
      case MessageChannel.WHATSAPP:
        return ConsentType.WHATSAPP;
      case MessageChannel.SMS:
        return ConsentType.SMS;
      case MessageChannel.EMAIL:
        return ConsentType.EMAIL;
      default:
        return ConsentType.SMS; // Default fallback
    }
  }

  /**
   * Check if consent exists for multiple channels
   */
  async verifyMultiChannelConsent(
    personId: string | null,
    phone: string | null,
    channels: MessageChannel[],
  ): Promise<Map<MessageChannel, ConsentVerificationResult>> {
    const results = new Map<MessageChannel, ConsentVerificationResult>();

    for (const channel of channels) {
      const result = await this.verifyConsent(personId, phone, channel);
      results.set(channel, result);
    }

    return results;
  }

  /**
   * Get consent summary for a recipient
   */
  async getConsentSummary(
    personId: string | null,
    phone: string | null,
  ): Promise<{
    whatsapp: boolean;
    sms: boolean;
    email: boolean;
  }> {
    const [whatsapp, sms, email] = await Promise.all([
      this.verifyConsent(personId, phone, MessageChannel.WHATSAPP),
      this.verifyConsent(personId, phone, MessageChannel.SMS),
      this.verifyConsent(personId, phone, MessageChannel.EMAIL),
    ]);

    return {
      whatsapp: whatsapp.granted,
      sms: sms.granted,
      email: email.granted,
    };
  }
}
