import { Request, Response } from 'express';
import { eventSourcingService } from '../services/event-sourcing.service';
import { analyticsService } from '../services/analytics.service';
import { EventType, EventSource } from '../models/Event';
import { logger } from '../utils';
import { ValidationError } from '../utils/errors';

export class AnalyticsController {
  /**
   * Track a single event
   * POST /api/analytics/events
   */
  async trackEvent(req: Request, res: Response): Promise<void> {
    try {
      const { type, source, userId, sessionId, metadata, properties, value, currency, eventTime } = req.body;

      // Validate required fields
      if (!type || !source) {
        throw new ValidationError('Type and source are required');
      }

      // Validate event type
      if (!Object.values(EventType).includes(type)) {
        throw new ValidationError(`Invalid event type: ${type}`);
      }

      // Validate event source
      if (!Object.values(EventSource).includes(source)) {
        throw new ValidationError(`Invalid event source: ${source}`);
      }

      await eventSourcingService.trackEvent({
        type,
        source,
        userId,
        sessionId,
        metadata,
        properties,
        value,
        currency,
        eventTime: eventTime ? new Date(eventTime) : undefined
      });

      res.status(201).json({
        success: true,
        message: 'Event tracked successfully'
      });
    } catch (error) {
      logger.error('Error tracking event:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Track multiple events in batch
   * POST /api/analytics/events/batch
   */
  async trackEventsBatch(req: Request, res: Response): Promise<void> {
    try {
      const { events } = req.body;

      if (!Array.isArray(events) || events.length === 0) {
        throw new ValidationError('Events array is required and must not be empty');
      }

      // Validate each event
      for (const event of events) {
        if (!event.type || !event.source) {
          throw new ValidationError('Each event must have type and source');
        }

        if (!Object.values(EventType).includes(event.type)) {
          throw new ValidationError(`Invalid event type: ${event.type}`);
        }

        if (!Object.values(EventSource).includes(event.source)) {
          throw new ValidationError(`Invalid event source: ${event.source}`);
        }
      }

      await eventSourcingService.trackEvents(events);

      res.status(201).json({
        success: true,
        message: 'Events tracked successfully',
        count: events.length
      });
    } catch (error) {
      logger.error('Error tracking events batch:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get events by type
   * GET /api/analytics/events/type/:type
   */
  async getEventsByType(req: Request, res: Response): Promise<void> {
    try {
      const { type } = req.params;
      const { startDate, endDate, limit = 100, offset = 0 } = req.query;

      if (!Object.values(EventType).includes(type as EventType)) {
        throw new ValidationError(`Invalid event type: ${type}`);
      }

      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();

      const events = await eventSourcingService.getEventsByType(
        type as EventType,
        start,
        end,
        parseInt(limit as string),
        parseInt(offset as string)
      );

      res.json({
        success: true,
        data: events,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          total: events.length
        }
      });
    } catch (error) {
      logger.error('Error getting events by type:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get events by user
   * GET /api/analytics/events/user/:userId
   */
  async getEventsByUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { limit = 100, offset = 0 } = req.query;

      const events = await eventSourcingService.getEventsByUser(
        userId,
        parseInt(limit as string),
        parseInt(offset as string)
      );

      res.json({
        success: true,
        data: events,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          total: events.length
        }
      });
    } catch (error) {
      logger.error('Error getting events by user:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get event statistics
   * GET /api/analytics/events/stats
   */
  async getEventStats(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();

      const stats = await eventSourcingService.getEventStats(start, end);

      res.json({
        success: true,
        data: stats,
        period: {
          startDate: start,
          endDate: end
        }
      });
    } catch (error) {
      logger.error('Error getting event stats:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get metrics by name
   * GET /api/analytics/metrics/:name
   */
  async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.params;
      const { startDate, endDate, labels } = req.query;

      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();

      const parsedLabels = labels ? JSON.parse(labels as string) : undefined;

      const metrics = await analyticsService.getMetrics(name, start, end, parsedLabels);

      res.json({
        success: true,
        data: metrics,
        period: {
          startDate: start,
          endDate: end
        }
      });
    } catch (error) {
      logger.error('Error getting metrics:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get aggregated metrics
   * GET /api/analytics/metrics/:name/aggregated
   */
  async getAggregatedMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.params;
      const { startDate, endDate, aggregation = 'sum', groupBy } = req.query;

      if (!['sum', 'avg', 'count', 'min', 'max'].includes(aggregation as string)) {
        throw new ValidationError('Invalid aggregation type');
      }

      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();

      const metrics = await analyticsService.getAggregatedMetrics(
        name,
        start,
        end,
        aggregation as 'sum' | 'avg' | 'count' | 'min' | 'max',
        groupBy as string
      );

      res.json({
        success: true,
        data: metrics,
        aggregation,
        groupBy,
        period: {
          startDate: start,
          endDate: end
        }
      });
    } catch (error) {
      logger.error('Error getting aggregated metrics:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get dashboard data
   * GET /api/analytics/dashboard
   */
  async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.query;

      const dashboardData = await analyticsService.getDashboardData(userId as string);

      res.json({
        success: true,
        data: dashboardData
      });
    } catch (error) {
      logger.error('Error getting dashboard data:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Process events (admin endpoint)
   * POST /api/analytics/process
   */
  async processEvents(req: Request, res: Response): Promise<void> {
    try {
      await analyticsService.processEvents();

      res.json({
        success: true,
        message: 'Events processed successfully'
      });
    } catch (error) {
      logger.error('Error processing events:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Generate KPIs (admin endpoint)
   * POST /api/analytics/kpis/generate
   */
  async generateKPIs(req: Request, res: Response): Promise<void> {
    try {
      const { date } = req.body;
      const targetDate = date ? new Date(date) : new Date();

      await analyticsService.generateKPIs(targetDate);

      res.json({
        success: true,
        message: 'KPIs generated successfully',
        date: targetDate
      });
    } catch (error) {
      logger.error('Error generating KPIs:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
