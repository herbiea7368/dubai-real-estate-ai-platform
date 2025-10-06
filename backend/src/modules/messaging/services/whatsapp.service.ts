import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageTemplate } from '../entities/message-template.entity';
import { MessageChannel, MessageLanguage } from '../entities/message.entity';

export interface SendResult {
  success: boolean;
  messageId: string | null;
  error: string | null;
}

/**
 * WhatsApp Business API Integration Service
 *
 * PRODUCTION INTEGRATION NOTES:
 * ==============================
 *
 * 1. Meta Business API Setup:
 *    - Business verification required: https://business.facebook.com
 *    - WhatsApp Business API access
 *    - Phone number registration and verification
 *    - Message template approval through Meta Business Manager
 *
 * 2. API Endpoint Configuration:
 *    - Base URL: https://graph.facebook.com/v18.0
 *    - Phone Number ID: Obtained from Meta Business Manager
 *    - Access Token: Long-lived token from Meta
 *
 * 3. Message Template Format:
 *    POST /{phone-number-id}/messages
 *    {
 *      "messaging_product": "whatsapp",
 *      "to": "+971501234567",
 *      "type": "template",
 *      "template": {
 *        "name": "property_alert_en",
 *        "language": { "code": "en" },
 *        "components": [
 *          {
 *            "type": "body",
 *            "parameters": [
 *              { "type": "text", "text": "{{propertyName}}" }
 *            ]
 *          }
 *        ]
 *      }
 *    }
 *
 * 4. Required Headers:
 *    - Authorization: Bearer {ACCESS_TOKEN}
 *    - Content-Type: application/json
 *
 * 5. Webhook Configuration:
 *    - Delivery status callbacks
 *    - Read receipts
 *    - Error notifications
 *    - Webhook URL: https://your-domain.com/webhooks/whatsapp
 *
 * 6. Rate Limits (Meta Business):
 *    - Tier 1: 1,000 messages/24h
 *    - Tier 2: 10,000 messages/24h
 *    - Tier 3: 100,000 messages/24h
 *    - Contact Meta to increase limits
 *
 * 7. Template Approval Process:
 *    - Create template in Business Manager
 *    - Submit for Meta review (24-48h)
 *    - Templates must follow Meta's policies
 *    - Variables limited to specific formats
 */
@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    @InjectRepository(MessageTemplate)
    private templateRepository: Repository<MessageTemplate>,
  ) {}

  /**
   * Send WhatsApp message (MVP: Mock implementation)
   * Production: Integrate with Meta Business API
   */
  async sendMessage(
    phone: string,
    content: string,
    language: 'en' | 'ar' = 'en',
  ): Promise<SendResult> {
    // MVP: Mock implementation for testing
    const messageId = `whatsapp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.logger.log(`[MVP-MOCK] WhatsApp message queued:`);
    this.logger.log(`  To: ${phone}`);
    this.logger.log(`  Language: ${language}`);
    this.logger.log(`  Content: ${content.substring(0, 100)}...`);
    this.logger.log(`  Message ID: ${messageId}`);
    this.logger.log(`  [PRODUCTION] Would call: POST ${process.env.WHATSAPP_API_URL}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`);

    // Simulate successful send
    return {
      success: true,
      messageId,
      error: null,
    };
  }

  /**
   * Send template-based WhatsApp message
   */
  async sendTemplateMessage(
    phone: string,
    templateKey: string,
    variables: Record<string, string>,
    language: 'en' | 'ar' = 'en',
  ): Promise<SendResult> {
    // Fetch template from database
    const template = await this.templateRepository.findOne({
      where: {
        templateKey,
        channel: MessageChannel.WHATSAPP,
        language: language as MessageLanguage,
        active: true,
      },
    });

    if (!template) {
      return {
        success: false,
        messageId: null,
        error: `Template not found: ${templateKey} (${language})`,
      };
    }

    // Validate required variables
    const missingVars = template.variables.filter(v => !variables[v]);
    if (missingVars.length > 0) {
      return {
        success: false,
        messageId: null,
        error: `Missing required variables: ${missingVars.join(', ')}`,
      };
    }

    // Replace placeholders in content
    let content = template.content;
    for (const [key, value] of Object.entries(variables)) {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    // Send the formatted message
    return this.sendMessage(phone, content, language);
  }

  /**
   * PRODUCTION IMPLEMENTATION EXAMPLE:
   *
   * async sendMessageProduction(phone: string, content: string): Promise<SendResult> {
   *   try {
   *     const response = await fetch(
   *       `${process.env.WHATSAPP_API_URL}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
   *       {
   *         method: 'POST',
   *         headers: {
   *           'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
   *           'Content-Type': 'application/json',
   *         },
   *         body: JSON.stringify({
   *           messaging_product: 'whatsapp',
   *           to: phone,
   *           type: 'text',
   *           text: { body: content }
   *         })
   *       }
   *     );
   *
   *     const data = await response.json();
   *
   *     if (!response.ok) {
   *       return {
   *         success: false,
   *         messageId: null,
   *         error: data.error?.message || 'Failed to send message'
   *       };
   *     }
   *
   *     return {
   *       success: true,
   *       messageId: data.messages[0].id,
   *       error: null
   *     };
   *   } catch (error) {
   *     return {
   *       success: false,
   *       messageId: null,
   *       error: error.message
   *     };
   *   }
   * }
   */
}
