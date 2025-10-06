import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message, MessageChannel } from './entities/message.entity';
import { MessageTemplate } from './entities/message-template.entity';
import { CreateTemplateDto } from './dto/create-template.dto';

@Injectable()
export class MessagingService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(MessageTemplate)
    private templateRepository: Repository<MessageTemplate>,
  ) {}

  async createTemplate(dto: CreateTemplateDto, approvedBy: string): Promise<MessageTemplate> {
    const template = this.templateRepository.create({
      ...dto,
      approvedBy,
    });

    return this.templateRepository.save(template);
  }

  async getTemplates(channel?: MessageChannel, language?: string, category?: string): Promise<MessageTemplate[]> {
    const query = this.templateRepository.createQueryBuilder('template')
      .where('template.active = :active', { active: true });

    if (channel) {
      query.andWhere('template.channel = :channel', { channel });
    }

    if (language) {
      query.andWhere('template.language = :language', { language });
    }

    if (category) {
      query.andWhere('template.category = :category', { category });
    }

    return query.getMany();
  }

  async getMessage(id: string): Promise<Message | null> {
    return this.messageRepository.findOne({ where: { id } });
  }

  async getMessagesByRecipient(recipientId: string): Promise<Message[]> {
    return this.messageRepository.find({
      where: { recipientId },
      order: { createdAt: 'DESC' },
    });
  }
}
