import { getRepository } from 'typeorm';
import { Event, EventType, EventSource } from '../models/Event';
import { logger } from '../utils';
import config from '../config';

export interface EventData {
  type: EventType;
  source: EventSource;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  properties?: Record<string, any>;
  value?: number;
  currency?: string;
  eventTime?: Date;
}

export class EventSourcingService {
  private eventRepository = getRepository(Event);
  private batchSize: number;
  private eventQueue: EventData[] = [];

  constructor() {
    this.batchSize = config.analytics.batchSize;
  }

  /**
   * Track a single event
   */
  async trackEvent(eventData: EventData): Promise<void> {
    try {
      const event = new Event();
      event.type = eventData.type;
      event.source = eventData.source;
      event.userId = eventData.userId;
      event.sessionId = eventData.sessionId;
      event.metadata = eventData.metadata;
      event.properties = eventData.properties;
      event.value = eventData.value;
      event.currency = eventData.currency;
      event.eventTime = eventData.eventTime || new Date();
      event.isProcessed = false;

      await this.eventRepository.save(event);

      logger.debug('Event tracked', {
        type: eventData.type,
        userId: eventData.userId
      });
    } catch (error) {
      logger.error('Error tracking event:', error);
      throw error;
    }
  }

  /**
   * Track multiple events in batch
   */
  async trackEvents(events: EventData[]): Promise<void> {
    try {
      const eventEntities = events.map(eventData => {
        const event = new Event();
        event.type = eventData.type;
        event.source = eventData.source;
        event.userId = eventData.userId;
        event.sessionId = eventData.sessionId;
        event.metadata = eventData.metadata;
        event.properties = eventData.properties;
        event.value = eventData.value;
        event.currency = eventData.currency;
        event.eventTime = eventData.eventTime || new Date();
        event.isProcessed = false;
        return event;
      });

      await this.eventRepository.save(eventEntities);

      logger.info('Batch events tracked', {
        count: events.length
      });
    } catch (error) {
      logger.error('Error tracking batch events:', error);
      throw error;
    }
  }

  /**
   * Get events by type and date range
   */
  async getEventsByType(
    type: EventType,
    startDate: Date,
    endDate: Date,
    limit = 100,
    offset = 0
  ): Promise<Event[]> {
    try {
      return await this.eventRepository.find({
        where: {
          type,
          eventTime: {
            $gte: startDate,
            $lte: endDate
          }
        },
        order: {
          eventTime: 'DESC'
        },
        take: limit,
        skip: offset
      });
    } catch (error) {
      logger.error('Error getting events by type:', error);
      throw error;
    }
  }

  /**
   * Get events by user
   */
  async getEventsByUser(
    userId: string,
    limit = 100,
    offset = 0
  ): Promise<Event[]> {
    try {
      return await this.eventRepository.find({
        where: { userId },
        order: {
          eventTime: 'DESC'
        },
        take: limit,
        skip: offset
      });
    } catch (error) {
      logger.error('Error getting events by user:', error);
      throw error;
    }
  }

  /**
   * Get event statistics
   */
  async getEventStats(startDate: Date, endDate: Date): Promise<Record<string, number>> {
    try {
      const stats = await this.eventRepository
        .createQueryBuilder('event')
        .select('event.type', 'type')
        .addSelect('COUNT(*)', 'count')
        .where('event.eventTime BETWEEN :startDate AND :endDate', { startDate, endDate })
        .groupBy('event.type')
        .getRawMany();

      const result: Record<string, number> = {};
      stats.forEach(stat => {
        result[stat.type] = parseInt(stat.count);
      });

      return result;
    } catch (error) {
      logger.error('Error getting event stats:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const eventSourcingService = new EventSourcingService();
