import { Request, Response } from 'express';
import { 
  Schedule,
  Notification,
  ScheduledNotification,
  ScheduleQuery,
  ScheduleResult
} from '../types';
import { SchedulerService } from '../services';
import { logger, metrics } from '../utils';
import { 
  ValidationError, 
  ScheduleError,
  formatErrorResponse 
} from '../utils/errors';
import { 
  scheduleNotificationRequestSchema,
  scheduleQuerySchema 
} from '../utils/validation';

export class SchedulerController {
  private schedulerService: SchedulerService;

  constructor(schedulerService: SchedulerService) {
    this.schedulerService = schedulerService;
  }

  /**
   * Schedule a notification
   * POST /api/scheduler/schedule
   */
  async scheduleNotification(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      // Validate request body
      const validationResult = scheduleNotificationRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ValidationError('Invalid request body', validationResult.error.errors);
      }

      const { notification, schedule, options } = validationResult.data;

      // Schedule notification
      const result = await this.schedulerService.scheduleNotification(notification, schedule, options);

      const duration = Date.now() - startTime;
      metrics.recordHttpRequestDuration('POST', '/api/scheduler/schedule', duration / 1000);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Notification scheduled successfully',
        timestamp: new Date(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResponse = formatErrorResponse(error);
      
      logger.error('Schedule notification failed', {
        error: errorResponse.message,
        duration,
        userId: req.body?.notification?.userId,
        scheduledAt: req.body?.schedule?.scheduledAt,
      });

      metrics.recordHttpRequestDuration('POST', '/api/scheduler/schedule', duration / 1000);
      metrics.recordError('scheduler', 'schedule_failed');

      res.status(errorResponse.statusCode).json(errorResponse);
    }
  }

  /**
   * Schedule a recurring notification
   * POST /api/scheduler/recurring
   */
  async scheduleRecurringNotification(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const { notification, cronExpression, options } = req.body;

      if (!notification) {
        throw new ValidationError('Notification is required');
      }

      if (!cronExpression || typeof cronExpression !== 'string') {
        throw new ValidationError('Cron expression is required and must be a string');
      }

      // Schedule recurring notification
      const result = await this.schedulerService.scheduleRecurringNotification(
        notification,
        cronExpression,
        options
      );

      const duration = Date.now() - startTime;
      metrics.recordHttpRequestDuration('POST', '/api/scheduler/recurring', duration / 1000);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Recurring notification scheduled successfully',
        timestamp: new Date(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResponse = formatErrorResponse(error);
      
      logger.error('Schedule recurring notification failed', {
        error: errorResponse.message,
        duration,
        userId: req.body?.notification?.userId,
        cronExpression: req.body?.cronExpression,
      });

      metrics.recordHttpRequestDuration('POST', '/api/scheduler/recurring', duration / 1000);
      metrics.recordError('scheduler', 'recurring_schedule_failed');

      res.status(errorResponse.statusCode).json(errorResponse);
    }
  }

  /**
   * Schedule a delayed notification
   * POST /api/scheduler/delayed
   */
  async scheduleDelayedNotification(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const { notification, delayMs, options } = req.body;

      if (!notification) {
        throw new ValidationError('Notification is required');
      }

      if (!delayMs || typeof delayMs !== 'number' || delayMs <= 0) {
        throw new ValidationError('Delay in milliseconds is required and must be a positive number');
      }

      // Schedule delayed notification
      const result = await this.schedulerService.scheduleDelayedNotification(
        notification,
        delayMs,
        options
      );

      const duration = Date.now() - startTime;
      metrics.recordHttpRequestDuration('POST', '/api/scheduler/delayed', duration / 1000);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Delayed notification scheduled successfully',
        timestamp: new Date(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResponse = formatErrorResponse(error);
      
      logger.error('Schedule delayed notification failed', {
        error: errorResponse.message,
        duration,
        userId: req.body?.notification?.userId,
        delayMs: req.body?.delayMs,
      });

      metrics.recordHttpRequestDuration('POST', '/api/scheduler/delayed', duration / 1000);
      metrics.recordError('scheduler', 'delayed_schedule_failed');

      res.status(errorResponse.statusCode).json(errorResponse);
    }
  }

  /**
   * Get a schedule by ID
   * GET /api/scheduler/:id
   */
  async getSchedule(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError('Schedule ID is required');
      }

      // Get schedule
      const schedule = await this.schedulerService.getSchedule(id);

      if (!schedule) {
        throw new ScheduleError(`Schedule ${id} not found`);
      }

      const duration = Date.now() - startTime;
      metrics.recordHttpRequestDuration('GET', '/api/scheduler/:id', duration / 1000);

      res.status(200).json({
        success: true,
        data: schedule,
        message: 'Schedule retrieved successfully',
        timestamp: new Date(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResponse = formatErrorResponse(error);
      
      logger.error('Get schedule failed', {
        error: errorResponse.message,
        duration,
        scheduleId: req.params.id,
      });

      metrics.recordHttpRequestDuration('GET', '/api/scheduler/:id', duration / 1000);
      metrics.recordError('scheduler', 'get_failed');

      res.status(errorResponse.statusCode).json(errorResponse);
    }
  }

  /**
   * List schedules
   * GET /api/scheduler
   */
  async listSchedules(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const { status, startDate, endDate, limit, offset } = req.query;

      // Validate query parameters
      const validationResult = scheduleQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        throw new ValidationError('Invalid query parameters', validationResult.error.errors);
      }

      const query: ScheduleQuery = {
        status: status as string,
        startDate: startDate as string,
        endDate: endDate as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      };

      // List schedules
      const schedules = await this.schedulerService.listSchedules(query);

      const duration = Date.now() - startTime;
      metrics.recordHttpRequestDuration('GET', '/api/scheduler', duration / 1000);

      res.status(200).json({
        success: true,
        data: {
          schedules,
          count: schedules.length,
        },
        message: 'Schedules retrieved successfully',
        timestamp: new Date(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResponse = formatErrorResponse(error);
      
      logger.error('List schedules failed', {
        error: errorResponse.message,
        duration,
      });

      metrics.recordHttpRequestDuration('GET', '/api/scheduler', duration / 1000);
      metrics.recordError('scheduler', 'list_failed');

      res.status(errorResponse.statusCode).json(errorResponse);
    }
  }

  /**
   * Update a schedule
   * PUT /api/scheduler/:id
   */
  async updateSchedule(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const { id } = req.params;
      const updates = req.body;

      if (!id) {
        throw new ValidationError('Schedule ID is required');
      }

      if (!updates || typeof updates !== 'object') {
        throw new ValidationError('Updates are required and must be an object');
      }

      // Update schedule
      const updatedSchedule = await this.schedulerService.updateSchedule(id, updates);

      const duration = Date.now() - startTime;
      metrics.recordHttpRequestDuration('PUT', '/api/scheduler/:id', duration / 1000);

      res.status(200).json({
        success: true,
        data: updatedSchedule,
        message: 'Schedule updated successfully',
        timestamp: new Date(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResponse = formatErrorResponse(error);
      
      logger.error('Update schedule failed', {
        error: errorResponse.message,
        duration,
        scheduleId: req.params.id,
      });

      metrics.recordHttpRequestDuration('PUT', '/api/scheduler/:id', duration / 1000);
      metrics.recordError('scheduler', 'update_failed');

      res.status(errorResponse.statusCode).json(errorResponse);
    }
  }

  /**
   * Cancel a schedule
   * DELETE /api/scheduler/:id
   */
  async cancelSchedule(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError('Schedule ID is required');
      }

      // Cancel schedule
      const cancelled = await this.schedulerService.cancelSchedule(id);

      const duration = Date.now() - startTime;
      metrics.recordHttpRequestDuration('DELETE', '/api/scheduler/:id', duration / 1000);

      res.status(200).json({
        success: true,
        data: { cancelled },
        message: cancelled ? 'Schedule cancelled successfully' : 'Schedule not found or already cancelled',
        timestamp: new Date(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResponse = formatErrorResponse(error);
      
      logger.error('Cancel schedule failed', {
        error: errorResponse.message,
        duration,
        scheduleId: req.params.id,
      });

      metrics.recordHttpRequestDuration('DELETE', '/api/scheduler/:id', duration / 1000);
      metrics.recordError('scheduler', 'cancel_failed');

      res.status(errorResponse.statusCode).json(errorResponse);
    }
  }

  /**
   * Get scheduled notifications for a user
   * GET /api/scheduler/user/:userId
   */
  async getUserScheduledNotifications(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const { userId } = req.params;

      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      // Get scheduled notifications for user
      const scheduledNotifications = await this.schedulerService.getScheduledNotifications(userId);

      const duration = Date.now() - startTime;
      metrics.recordHttpRequestDuration('GET', '/api/scheduler/user/:userId', duration / 1000);

      res.status(200).json({
        success: true,
        data: {
          scheduledNotifications,
          count: scheduledNotifications.length,
          userId,
        },
        message: 'User scheduled notifications retrieved successfully',
        timestamp: new Date(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResponse = formatErrorResponse(error);
      
      logger.error('Get user scheduled notifications failed', {
        error: errorResponse.message,
        duration,
        userId: req.params.userId,
      });

      metrics.recordHttpRequestDuration('GET', '/api/scheduler/user/:userId', duration / 1000);
      metrics.recordError('scheduler', 'get_user_scheduled_failed');

      res.status(errorResponse.statusCode).json(errorResponse);
    }
  }

  /**
   * Get schedule statistics
   * GET /api/scheduler/stats
   */
  async getScheduleStats(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      // Get schedule statistics
      const stats = await this.schedulerService.getScheduleStats();

      const duration = Date.now() - startTime;
      metrics.recordHttpRequestDuration('GET', '/api/scheduler/stats', duration / 1000);

      res.status(200).json({
        success: true,
        data: stats,
        message: 'Schedule statistics retrieved successfully',
        timestamp: new Date(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResponse = formatErrorResponse(error);
      
      logger.error('Get schedule stats failed', {
        error: errorResponse.message,
        duration,
      });

      metrics.recordHttpRequestDuration('GET', '/api/scheduler/stats', duration / 1000);
      metrics.recordError('scheduler', 'get_stats_failed');

      res.status(errorResponse.statusCode).json(errorResponse);
    }
  }
}
