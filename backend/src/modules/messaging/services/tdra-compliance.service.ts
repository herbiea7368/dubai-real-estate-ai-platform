import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { DateTime } from 'luxon';
import { Message, MessageChannel, MessageStatus, MessageType } from '../entities/message.entity';

export interface TDRAWindowResult {
  allowed: boolean;
  reason: string | null;
  nextAllowedTime: Date | null;
}

export interface PhoneValidationResult {
  valid: boolean;
  formatted: string;
  error: string | null;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  sent: number;
}

export interface ComplianceReport {
  dateFrom: Date;
  dateTo: Date;
  totalAttempted: number;
  totalSent: number;
  totalBlocked: number;
  complianceRate: number;
  blockedReasons: {
    reason: string;
    count: number;
  }[];
  byChannel: {
    channel: string;
    attempted: number;
    sent: number;
    blocked: number;
  }[];
}

@Injectable()
export class TdraComplianceService {
  private readonly TDRA_START_HOUR = 7; // 07:00
  private readonly TDRA_END_HOUR = 21;   // 21:00
  private readonly TIMEZONE = 'Asia/Dubai';
  private readonly MARKETING_MESSAGE_DAILY_LIMIT = 3;

  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  /**
   * Check if current time or given time is within TDRA allowed window (07:00-21:00 UAE time)
   */
  isWithinTDRAWindow(targetDate?: Date): TDRAWindowResult {
    const uaeTime = targetDate
      ? DateTime.fromJSDate(targetDate).setZone(this.TIMEZONE)
      : DateTime.now().setZone(this.TIMEZONE);

    const hour = uaeTime.hour;

    if (hour >= this.TDRA_START_HOUR && hour < this.TDRA_END_HOUR) {
      return {
        allowed: true,
        reason: null,
        nextAllowedTime: null,
      };
    }

    const nextAllowedTime = this.calculateNextAllowedTime(uaeTime.toJSDate());

    return {
      allowed: false,
      reason: `Outside TDRA window (${this.TDRA_START_HOUR}:00-${this.TDRA_END_HOUR}:00 UAE time)`,
      nextAllowedTime,
    };
  }

  /**
   * Calculate the next allowed time for sending messages
   */
  calculateNextAllowedTime(fromDate: Date): Date {
    const uaeTime = DateTime.fromJSDate(fromDate).setZone(this.TIMEZONE);
    const hour = uaeTime.hour;

    let nextAllowed: DateTime;

    if (hour < this.TDRA_START_HOUR) {
      // Before 07:00, return 07:00 same day
      nextAllowed = uaeTime.set({
        hour: this.TDRA_START_HOUR,
        minute: 0,
        second: 0,
        millisecond: 0
      });
    } else if (hour >= this.TDRA_END_HOUR) {
      // After 21:00, return 07:00 next day
      nextAllowed = uaeTime.plus({ days: 1 }).set({
        hour: this.TDRA_START_HOUR,
        minute: 0,
        second: 0,
        millisecond: 0
      });
    } else {
      // Within window, return the given time
      nextAllowed = uaeTime;
    }

    return nextAllowed.toJSDate();
  }

  /**
   * Validate phone number format (UAE and international)
   */
  validatePhoneNumber(phone: string, _countryCode?: string): PhoneValidationResult {
    // Remove all whitespace and special characters except +
    const cleaned = phone.replace(/[^\d+]/g, '');

    // UAE phone number validation
    const uaePattern = /^\+971[0-9]{9}$/;
    const uaeLocalPattern = /^(05|04|02|03|06|07|09)[0-9]{8}$/;

    // International format
    const internationalPattern = /^\+[1-9][0-9]{7,14}$/;

    let formatted = cleaned;
    let valid = false;

    if (uaePattern.test(cleaned)) {
      valid = true;
      formatted = cleaned;
    } else if (uaeLocalPattern.test(cleaned)) {
      valid = true;
      formatted = `+971${cleaned.substring(1)}`;
    } else if (internationalPattern.test(cleaned)) {
      valid = true;
      formatted = cleaned;
    }

    if (!valid) {
      return {
        valid: false,
        formatted: phone,
        error: 'Invalid phone number format. Expected UAE (+971XXXXXXXXX) or international format (+XXXXXXXXXXX)',
      };
    }

    return {
      valid: true,
      formatted,
      error: null,
    };
  }

  /**
   * Check rate limits for marketing messages (max 3 per day)
   */
  async checkRateLimits(
    recipientPhone: string,
    channel: MessageChannel,
    messageType: 'marketing' | 'transactional' | 'notification',
  ): Promise<RateLimitResult> {
    // Transactional messages have no rate limits
    if (messageType === 'transactional') {
      return {
        allowed: true,
        limit: -1, // unlimited
        sent: 0,
      };
    }

    // Calculate 24 hours ago in UAE timezone
    const now = DateTime.now().setZone(this.TIMEZONE);
    const twentyFourHoursAgo = now.minus({ hours: 24 }).toJSDate();

    // Count marketing messages sent in last 24 hours
    const sentCount = await this.messageRepository.count({
      where: {
        recipientPhone,
        channel,
        messageType: MessageType.MARKETING,
        status: MessageStatus.SENT,
        createdAt: Between(twentyFourHoursAgo, now.toJSDate()),
      },
    });

    const allowed = sentCount < this.MARKETING_MESSAGE_DAILY_LIMIT;

    return {
      allowed,
      limit: this.MARKETING_MESSAGE_DAILY_LIMIT,
      sent: sentCount,
    };
  }

  /**
   * Get compliance report for a date range
   */
  async getComplianceReport(dateFrom: Date, dateTo: Date): Promise<ComplianceReport> {
    const messages = await this.messageRepository.find({
      where: {
        createdAt: Between(dateFrom, dateTo),
      },
    });

    const totalAttempted = messages.length;
    const totalSent = messages.filter(m =>
      m.status === MessageStatus.SENT || m.status === MessageStatus.DELIVERED
    ).length;
    const totalBlocked = messages.filter(m =>
      m.status === MessageStatus.BLOCKED
    ).length;

    const complianceRate = totalAttempted > 0
      ? (totalSent / totalAttempted) * 100
      : 0;

    // Group blocked messages by reason
    const blockedMessages = messages.filter(m => m.status === MessageStatus.BLOCKED);
    const reasonCounts = new Map<string, number>();

    blockedMessages.forEach(m => {
      const reason = m.blockReason || 'unknown';
      reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
    });

    const blockedReasons = Array.from(reasonCounts.entries()).map(([reason, count]) => ({
      reason,
      count,
    }));

    // Group by channel
    const channelStats = new Map<string, { attempted: number; sent: number; blocked: number }>();

    messages.forEach(m => {
      const channel = m.channel;
      const stats = channelStats.get(channel) || { attempted: 0, sent: 0, blocked: 0 };
      stats.attempted++;
      if (m.status === MessageStatus.SENT || m.status === MessageStatus.DELIVERED) {
        stats.sent++;
      }
      if (m.status === MessageStatus.BLOCKED) {
        stats.blocked++;
      }
      channelStats.set(channel, stats);
    });

    const byChannel = Array.from(channelStats.entries()).map(([channel, stats]) => ({
      channel,
      ...stats,
    }));

    return {
      dateFrom,
      dateTo,
      totalAttempted,
      totalSent,
      totalBlocked,
      complianceRate: Math.round(complianceRate * 100) / 100,
      blockedReasons,
      byChannel,
    };
  }

  /**
   * Get current UAE time
   */
  getCurrentUAETime(): Date {
    return DateTime.now().setZone(this.TIMEZONE).toJSDate();
  }

  /**
   * Format date to UAE timezone string
   */
  formatUAETime(date: Date): string {
    return DateTime.fromJSDate(date).setZone(this.TIMEZONE).toFormat('yyyy-MM-dd HH:mm:ss ZZZZ');
  }
}
