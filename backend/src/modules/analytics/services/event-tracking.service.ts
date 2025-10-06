import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Request } from 'express';
import { AnalyticsEvent, EventType, DeviceType } from '../entities/analytics-event.entity';

@Injectable()
export class EventTrackingService {
  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly analyticsEventRepository: Repository<AnalyticsEvent>,
  ) {}

  /**
   * Track any analytics event
   */
  async trackEvent(
    eventType: EventType,
    sessionId: string,
    userId?: string,
    propertyId?: string,
    listingId?: string,
    leadId?: string,
    eventData?: Record<string, any>,
    request?: Request,
  ): Promise<AnalyticsEvent> {
    const userAgent = request?.headers['user-agent'] || 'Unknown';
    const ipAddress = (request?.ip || request?.headers['x-forwarded-for'] as string) || 'Unknown';
    const deviceType = this.detectDeviceType(userAgent);

    const event = this.analyticsEventRepository.create({
      eventType,
      sessionId,
      userId,
      propertyId,
      listingId,
      leadId,
      eventData,
      userAgent,
      ipAddress,
      deviceType,
    });

    return await this.analyticsEventRepository.save(event);
  }

  /**
   * Track property view event
   */
  async trackPropertyView(
    propertyId: string,
    listingId: string,
    sessionId: string,
    userId?: string,
    request?: Request,
  ): Promise<AnalyticsEvent> {
    const event = await this.trackEvent(
      EventType.PROPERTY_VIEW,
      sessionId,
      userId,
      propertyId,
      listingId,
      undefined,
      undefined,
      request,
    );

    // Note: Property and Listing view count increments would be handled here
    // This requires injecting PropertyService and ListingService
    // For now, we'll track the event only

    return event;
  }

  /**
   * Track contact action (WhatsApp, call, email clicks)
   */
  async trackContactAction(
    contactType: 'whatsapp' | 'call' | 'email',
    propertyId: string,
    listingId: string,
    sessionId: string,
    userId?: string,
    request?: Request,
  ): Promise<AnalyticsEvent> {
    const eventTypeMap = {
      whatsapp: EventType.WHATSAPP_CLICK,
      call: EventType.CALL_CLICK,
      email: EventType.EMAIL_CLICK,
    };

    const eventType = eventTypeMap[contactType];

    const event = await this.trackEvent(
      eventType,
      sessionId,
      userId,
      propertyId,
      listingId,
      undefined,
      undefined,
      request,
    );

    // Note: Listing contact count increment would be handled here
    // This requires injecting ListingService

    return event;
  }

  /**
   * Track search event
   */
  async trackSearch(
    filters: Record<string, any>,
    resultsCount: number,
    sessionId: string,
    userId?: string,
    request?: Request,
  ): Promise<AnalyticsEvent> {
    const eventData = {
      filters,
      resultsCount,
    };

    return await this.trackEvent(
      EventType.SEARCH,
      sessionId,
      userId,
      undefined,
      undefined,
      undefined,
      eventData,
      request,
    );
  }

  /**
   * Get all events for a session
   */
  async getSessionEvents(sessionId: string): Promise<AnalyticsEvent[]> {
    return await this.analyticsEventRepository.find({
      where: { sessionId },
      order: { timestamp: 'ASC' },
    });
  }

  /**
   * Detect device type from user agent
   */
  private detectDeviceType(userAgent: string): DeviceType {
    const ua = userAgent.toLowerCase();

    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return DeviceType.MOBILE;
    }

    if (ua.includes('tablet') || ua.includes('ipad')) {
      return DeviceType.TABLET;
    }

    return DeviceType.DESKTOP;
  }
}
