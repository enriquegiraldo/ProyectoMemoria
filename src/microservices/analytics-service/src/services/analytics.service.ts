import { getRepository } from 'typeorm';
import { Metric, MetricType } from '../models/Analytics';
import { Event, EventType } from '../models/Event';
import { logger } from '../utils';
import config from '../config';

export interface MetricData {
  name: string;
  type: MetricType;
  value: number;
  labels?: Record<string, string>;
  timestamp: Date;
}

export interface KPIData {
  name: string;
  value: number;
  target?: number;
  breakdown?: Record<string, number>;
  date: Date;
}

export interface AnalyticsQuery {
  startDate: Date;
  endDate: Date;
  userId?: string;
  eventTypes?: EventType[];
  groupBy?: string;
}

export class AnalyticsService {
  private metricRepository = getRepository(Metric);
  private eventRepository = getRepository(Event);

  /**
   * Process events and generate metrics
   */
  async processEvents(): Promise<void> {
    try {
      const unprocessedEvents = await this.eventRepository.find({
        where: { isProcessed: false },
        order: { eventTime: 'ASC' }
      });

      for (const event of unprocessedEvents) {
        await this.processEvent(event);
      }

      logger.info('Events processed', {
        count: unprocessedEvents.length
      });
    } catch (error) {
      logger.error('Error processing events:', error);
      throw error;
    }
  }

  /**
   * Process a single event
   */
  private async processEvent(event: Event): Promise<void> {
    try {
      // Generate metrics based on event type
      const metrics = await this.generateMetricsFromEvent(event);
      
      // Save metrics
      for (const metric of metrics) {
        await this.saveMetric(metric);
      }

      // Mark event as processed
      event.isProcessed = true;
      await this.eventRepository.save(event);

      logger.debug('Event processed', {
        eventId: event.id,
        type: event.type,
        metricsCount: metrics.length
      });
    } catch (error) {
      logger.error('Error processing event:', error);
      throw error;
    }
  }

  /**
   * Generate metrics from an event
   */
  private async generateMetricsFromEvent(event: Event): Promise<MetricData[]> {
    const metrics: MetricData[] = [];
    const timestamp = event.eventTime || event.createdAt;

    switch (event.type) {
      case EventType.USER_REGISTERED:
        metrics.push({
          name: 'user_registrations',
          type: MetricType.COUNTER,
          value: 1,
          timestamp
        });
        break;

      case EventType.USER_LOGIN:
        metrics.push({
          name: 'user_logins',
          type: MetricType.COUNTER,
          value: 1,
          timestamp
        });
        break;

      case EventType.MEMORY_CREATED:
        metrics.push({
          name: 'memories_created',
          type: MetricType.COUNTER,
          value: 1,
          labels: { userId: event.userId || 'unknown' },
          timestamp
        });
        break;

      case EventType.PAYMENT_SUCCEEDED:
        metrics.push({
          name: 'payments_succeeded',
          type: MetricType.COUNTER,
          value: 1,
          labels: { 
            userId: event.userId || 'unknown',
            currency: event.currency || 'unknown'
          },
          timestamp
        });

        if (event.value) {
          metrics.push({
            name: 'payment_amount',
            type: MetricType.GAUGE,
            value: event.value,
            labels: { 
              userId: event.userId || 'unknown',
              currency: event.currency || 'unknown'
            },
            timestamp
          });
        }
        break;

      case EventType.SUBSCRIPTION_CREATED:
        metrics.push({
          name: 'subscriptions_created',
          type: MetricType.COUNTER,
          value: 1,
          labels: { userId: event.userId || 'unknown' },
          timestamp
        });
        break;

      case EventType.MEDIA_UPLOADED:
        metrics.push({
          name: 'media_uploads',
          type: MetricType.COUNTER,
          value: 1,
          labels: { userId: event.userId || 'unknown' },
          timestamp
        });
        break;

      case EventType.SYSTEM_ERROR:
        metrics.push({
          name: 'system_errors',
          type: MetricType.COUNTER,
          value: 1,
          timestamp
        });
        break;
    }

    return metrics;
  }

  /**
   * Save a metric
   */
  private async saveMetric(metricData: MetricData): Promise<void> {
    try {
      const metric = new Metric();
      metric.name = metricData.name;
      metric.type = metricData.type;
      metric.value = metricData.value;
      metric.labels = metricData.labels;
      metric.timestamp = metricData.timestamp;

      await this.metricRepository.save(metric);
    } catch (error) {
      logger.error('Error saving metric:', error);
      throw error;
    }
  }

  /**
   * Get metrics by name and time range
   */
  async getMetrics(
    name: string,
    startDate: Date,
    endDate: Date,
    labels?: Record<string, string>
  ): Promise<Metric[]> {
    try {
      const queryBuilder = this.metricRepository
        .createQueryBuilder('metric')
        .where('metric.name = :name', { name })
        .andWhere('metric.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate });

      if (labels) {
        Object.entries(labels).forEach(([key, value]) => {
          queryBuilder.andWhere(`metric.labels->>'${key}' = :${key}`, { [key]: value });
        });
      }

      return await queryBuilder
        .orderBy('metric.timestamp', 'ASC')
        .getMany();
    } catch (error) {
      logger.error('Error getting metrics:', error);
      throw error;
    }
  }

  /**
   * Get aggregated metrics
   */
  async getAggregatedMetrics(
    name: string,
    startDate: Date,
    endDate: Date,
    aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max',
    groupBy?: string
  ): Promise<any[]> {
    try {
      const queryBuilder = this.metricRepository
        .createQueryBuilder('metric')
        .select(`metric.name`, 'name')
        .addSelect(`${aggregation.toUpperCase()}(metric.value)`, 'value')
        .where('metric.name = :name', { name })
        .andWhere('metric.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate });

      if (groupBy) {
        queryBuilder
          .addSelect(`metric.labels->>'${groupBy}'`, 'group')
          .groupBy(`metric.labels->>'${groupBy}'`);
      }

      return await queryBuilder.getRawMany();
    } catch (error) {
      logger.error('Error getting aggregated metrics:', error);
      throw error;
    }
  }

  /**
   * Generate KPIs
   */
  async generateKPIs(date: Date): Promise<void> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // User registrations
      const registrations = await this.getAggregatedMetrics(
        'user_registrations',
        startOfDay,
        endOfDay,
        'sum'
      );

      // User logins
      const logins = await this.getAggregatedMetrics(
        'user_logins',
        startOfDay,
        endOfDay,
        'sum'
      );

      // Memories created
      const memories = await this.getAggregatedMetrics(
        'memories_created',
        startOfDay,
        endOfDay,
        'sum'
      );

      // Payments
      const payments = await this.getAggregatedMetrics(
        'payments_succeeded',
        startOfDay,
        endOfDay,
        'sum'
      );

      // Payment amount
      const paymentAmount = await this.getAggregatedMetrics(
        'payment_amount',
        startOfDay,
        endOfDay,
        'sum'
      );

      logger.info('KPIs generated', {
        date,
        registrations: registrations[0]?.value || 0,
        logins: logins[0]?.value || 0,
        memories: memories[0]?.value || 0,
        payments: payments[0]?.value || 0,
        paymentAmount: paymentAmount[0]?.value || 0
      });
    } catch (error) {
      logger.error('Error generating KPIs:', error);
      throw error;
    }
  }

  /**
   * Get dashboard data
   */
  async getDashboardData(userId?: string): Promise<any> {
    try {
      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      
      const startOfWeek = new Date(now);
      startOfWeek.setDate(startOfWeek.getDate() - 7);

      const startOfMonth = new Date(now);
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [dailyStats, weeklyStats, monthlyStats] = await Promise.all([
        this.getEventStats(startOfDay, now),
        this.getEventStats(startOfWeek, now),
        this.getEventStats(startOfMonth, now)
      ]);

      return {
        daily: dailyStats,
        weekly: weeklyStats,
        monthly: monthlyStats,
        timestamp: now
      };
    } catch (error) {
      logger.error('Error getting dashboard data:', error);
      throw error;
    }
  }

  /**
   * Get event statistics
   */
  private async getEventStats(startDate: Date, endDate: Date): Promise<Record<string, number>> {
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
export const analyticsService = new AnalyticsService();
