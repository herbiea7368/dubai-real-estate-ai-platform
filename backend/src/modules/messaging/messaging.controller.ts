import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { MessagingService } from './messaging.service';
import { MessageQueueService } from './services/message-queue.service';
import { TdraComplianceService } from './services/tdra-compliance.service';
import { WhatsappService } from './services/whatsapp.service';
import { SendWhatsAppDto } from './dto/send-whatsapp.dto';
import { SendSMSDto } from './dto/send-sms.dto';
import { BulkMessageDto } from './dto/bulk-message.dto';
import { CreateTemplateDto } from './dto/create-template.dto';
import { MessageChannel, MessageType } from './entities/message.entity';

@Controller('messaging')
export class MessagingController {
  constructor(
    private messagingService: MessagingService,
    private queueService: MessageQueueService,
    private tdraService: TdraComplianceService,
    private whatsappService: WhatsappService,
  ) {}

  @Post('send/whatsapp')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.MARKETING)
  @HttpCode(HttpStatus.CREATED)
  async sendWhatsApp(@Body() dto: SendWhatsAppDto, @Request() req: any) {
    // Send template-based WhatsApp message
    const templateResult = await this.whatsappService.sendTemplateMessage(
      dto.recipientPhone || '',
      dto.templateKey,
      dto.variables,
      dto.language,
    );

    if (!templateResult.success) {
      return {
        success: false,
        error: templateResult.error,
      };
    }

    // Queue the message
    const queueResult = await this.queueService.queueMessage({
      recipientId: dto.recipientId,
      recipientPhone: dto.recipientPhone || '',
      channel: MessageChannel.WHATSAPP,
      messageType: MessageType.MARKETING,
      content: JSON.stringify(dto.variables),
      language: dto.language,
      templateId: dto.templateKey,
      scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : undefined,
      metadata: { propertyId: dto.propertyId },
      createdBy: req.user.userId,
    });

    return {
      messageId: queueResult.message.id,
      status: queueResult.status,
      scheduledFor: queueResult.message.scheduledFor,
      reason: queueResult.reason,
    };
  }

  @Post('send/sms')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.MARKETING)
  @HttpCode(HttpStatus.CREATED)
  async sendSMS(@Body() dto: SendSMSDto, @Request() req: any) {
    const queueResult = await this.queueService.queueMessage({
      recipientPhone: dto.recipientPhone,
      channel: MessageChannel.SMS,
      messageType: dto.messageType,
      content: dto.message,
      language: dto.language,
      scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : undefined,
      createdBy: req.user.userId,
    });

    return {
      messageId: queueResult.message.id,
      status: queueResult.status,
      scheduledFor: queueResult.message.scheduledFor,
      reason: queueResult.reason,
    };
  }

  @Post('send/bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MARKETING)
  @HttpCode(HttpStatus.CREATED)
  async sendBulk(@Body() dto: BulkMessageDto, @Request() req: any) {
    const results = {
      queued: 0,
      blocked: 0,
      reasons: [] as { phone: string; reason: string }[],
    };

    for (const recipient of dto.recipients) {
      const variables = { ...dto.variables, ...recipient.variables };

      let content = '';
      if (dto.channel === MessageChannel.WHATSAPP) {
        const templateResult = await this.whatsappService.sendTemplateMessage(
          recipient.phone,
          dto.templateKey,
          variables,
          'en',
        );
        if (templateResult.success) {
          content = JSON.stringify(variables);
        } else {
          results.blocked++;
          results.reasons.push({ phone: recipient.phone, reason: templateResult.error || 'Template error' });
          continue;
        }
      }

      const queueResult = await this.queueService.queueMessage({
        recipientPhone: recipient.phone,
        channel: dto.channel,
        messageType: MessageType.MARKETING,
        content: content || JSON.stringify(variables),
        language: 'en',
        templateId: dto.templateKey,
        scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : undefined,
        createdBy: req.user.userId,
      });

      if (queueResult.status === 'blocked') {
        results.blocked++;
        results.reasons.push({ phone: recipient.phone, reason: queueResult.reason || 'Blocked' });
      } else {
        results.queued++;
      }
    }

    return results;
  }

  @Get('messages/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getMessage(@Param('id') id: string) {
    return this.messagingService.getMessage(id);
  }

  @Get('messages/recipient/:recipientId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.MARKETING, UserRole.COMPLIANCE)
  @HttpCode(HttpStatus.OK)
  async getMessagesByRecipient(@Param('recipientId') recipientId: string) {
    return this.messagingService.getMessagesByRecipient(recipientId);
  }

  @Post('templates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MARKETING, UserRole.COMPLIANCE)
  @HttpCode(HttpStatus.CREATED)
  async createTemplate(@Body() dto: CreateTemplateDto, @Request() req: any) {
    return this.messagingService.createTemplate(dto, req.user.userId);
  }

  @Get('templates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.MARKETING)
  @HttpCode(HttpStatus.OK)
  async getTemplates(
    @Query('channel') channel?: MessageChannel,
    @Query('language') language?: string,
    @Query('category') category?: string,
  ) {
    return this.messagingService.getTemplates(channel, language, category);
  }

  @Get('compliance-report')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPLIANCE)
  @HttpCode(HttpStatus.OK)
  async getComplianceReport(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ) {
    return this.tdraService.getComplianceReport(
      new Date(dateFrom),
      new Date(dateTo),
    );
  }

  @Post('process-queue')
  @HttpCode(HttpStatus.OK)
  async processQueue() {
    return this.queueService.processQueue();
  }
}
