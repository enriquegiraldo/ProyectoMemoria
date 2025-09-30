// src/microservices/notifications-service/src/services/scheduler.service.ts
import { v4 as uuidv4 } from 'uuid';
import cron from 'node-cron';
import Queue from 'bull';
import { 
  Schedule,
  Notification,
  ScheduledNotification,
  ScheduleStatus,
  ScheduleQuery,
  ScheduleResult
} from '../types';
import { NotificationService } from './notification.service';
import { logger, metrics, logAudit } from '../utils';
import { 
  ScheduleError, 
  ValidationError,
  InvalidScheduleError 
} from '../utils/errors';
import {config}  from '../config';

export class SchedulerService {
  private schedules: Map<string, Schedule> = new Map();
  private scheduledJobs: Map<string, cron.ScheduledTask> = new Map();
  private notificationQueue: Queue.Queue;
  private notificationService: NotificationService;

  constructor(notificationService: NotificationService) {
    this.notificationService = notificationService;
    this.notificationQueue = new Queue('notifications', {
      redis: {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
      },
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });

    this.setupQueueHandlers();
    this.loadSchedules();
  }

  private setupQueueHandlers() {
    // Process notification jobs
    this.notificationQueue.process(async (job) => {
      const { notification, options } = job.data;
      
      try {
        const result = await this.notificationService.sendNotification(notification, options);
        
        logger.info('Scheduled notification sent successfully', {
          jobId: job.id,
          notificationId: notification.id,
          type: notification.type,
        });

        return result;
      } catch (error) {
        logger.error('Scheduled notification failed', {
          jobId: job.id,
          notificationId: notification.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        throw error;
      }
    });

    // Handle job completion
    this.notificationQueue.on('completed', (job, result) => {
      logger.info('Notification job completed', {
        jobId: job.id,
        notificationId: job.data.notification.id,
        result,
      });
    });

    // Handle job failure
    this.notificationQueue.on('failed', (job, err) => {
      logger.error('Notification job failed', {
        jobId: job.id,
        notificationId: job.data.notification.id,
        error: err.message,
      });
    });
  }

  private async loadSchedules() {
    // This would typically load from a database
    // For now, we'll just log that schedules are loaded
    logger.info('Loading scheduled notifications');
  }

  async scheduleNotification(
    notification: Notification,
    schedule: Partial<Schedule>,
    options: any = {}
  ): Promise<ScheduleResult> {
    const startTime = Date.now();

    try {
      // Validate schedule
      this.validateSchedule(schedule);

      // Create schedule record
      const scheduleId = schedule.id || uuidv4();
      const newSchedule: Schedule = {
        id: scheduleId,
        notificationId: notification.id || uuidv4(),
        cronExpression: schedule.cronExpression,
        scheduledAt: schedule.scheduledAt || new Date(),
        timezone: schedule.timezone || 'UTC',
        repeat: schedule.repeat,
        status: 'pending',
        metadata: schedule.metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Store schedule
      this.schedules.set(scheduleId, newSchedule);

      // Schedule the notification
      await this.createScheduledJob(newSchedule, notification, options);

      const duration = Date.now() - startTime;

      logger.info('Notification scheduled successfully', {
        scheduleId,
        notificationId: newSchedule.notificationId,
        scheduledAt: newSchedule.scheduledAt,
        duration,
      });

      logAudit('schedule:create', notification.userId, `schedule:${scheduleId}`, {
        scheduleId,
        notificationId: newSchedule.notificationId,
        scheduledAt: newSchedule.scheduledAt,
      });

      return {
        success: true,
        scheduleId,
        notificationId: newSchedule.notificationId,
        scheduledAt: newSchedule.scheduledAt,
        timestamp: new Date(),
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('Notification scheduling failed', {
        notificationId: notification.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      });

      throw error;
    }
  }

  async scheduleRecurringNotification(
    notification: Notification,
    cronExpression: string,
    options: any = {}
  ): Promise<ScheduleResult> {
    return this.scheduleNotification(notification, {
      cronExpression,
      repeat: {
        enabled: true,
        interval: 'custom',
      },
    }, options);
  }

  async scheduleDelayedNotification(
    notification: Notification,
    delayMs: number,
    options: any = {}
  ): Promise<ScheduleResult> {
    const scheduledAt = new Date(Date.now() + delayMs);
    
    return this.scheduleNotification(notification, {
      scheduledAt,
    }, options);
  }

  async updateSchedule(scheduleId: string, updates: Partial<Schedule>): Promise<Schedule> {
    const startTime = Date.now();

    try {
      const schedule = this.schedules.get(scheduleId);
      if (!schedule) {
        throw new ScheduleError(`Schedule ${scheduleId} not found`);
      }

      // Validate updates
      this.validateScheduleUpdates(updates);

      // Cancel existing job if schedule changed
      if (updates.cronExpression || updates.scheduledAt) {
        this.cancelScheduledJob(scheduleId);
      }

      // Update schedule
      const updatedSchedule: Schedule = {
        ...schedule,
        ...updates,
        id: scheduleId, // Ensure ID doesn't change
        updatedAt: new Date(),
      };

      this.schedules.set(scheduleId, updatedSchedule);

      // Recreate job if schedule changed
      if (updates.cronExpression || updates.scheduledAt) {
        // Note: We would need the original notification here
        // In a real implementation, you'd store the notification with the schedule
        logger.warn('Schedule updated but job recreation requires original notification');
      }

      const duration = Date.now() - startTime;

      logger.info('Schedule updated successfully', {
        scheduleId,
        duration,
      });

      logAudit('schedule:update', 'system', `schedule:${scheduleId}`, {
        scheduleId,
        updates: Object.keys(updates),
      });

      return updatedSchedule;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('Schedule update failed', {
        scheduleId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      });

      throw error;
    }
  }

  async cancelSchedule(scheduleId: string): Promise<boolean> {
    const startTime = Date.now();

    try {
      const schedule = this.schedules.get(scheduleId);
      if (!schedule) {
        throw new ScheduleError(`Schedule ${scheduleId} not found`);
      }

      // Cancel the scheduled job
      this.cancelScheduledJob(scheduleId);

      // Update schedule status
      schedule.status = 'cancelled';
      schedule.updatedAt = new Date();
      this.schedules.set(scheduleId, schedule);

      const duration = Date.now() - startTime;

      logger.info('Schedule cancelled successfully', {
        scheduleId,
        duration,
      });

      logAudit('schedule:cancel', 'system', `schedule:${scheduleId}`, {
        scheduleId,
      });

      return true;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('Schedule cancellation failed', {
        scheduleId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      });

      throw error;
    }
  }

  async getSchedule(scheduleId: string): Promise<Schedule | null> {
    return this.schedules.get(scheduleId) || null;
  }

  async listSchedules(query?: ScheduleQuery): Promise<Schedule[]> {
    let schedules = Array.from(this.schedules.values());

    // Apply filters
    if (query?.status) {
      schedules = schedules.filter(s => s.status === query.status);
    }

    if (query?.startDate) {
      schedules = schedules.filter(s => s.scheduledAt >= new Date(query.startDate));
    }

    if (query?.endDate) {
      schedules = schedules.filter(s => s.scheduledAt <= new Date(query.endDate));
    }

    // Apply pagination
    const limit = query?.limit || 20;
    const offset = query?.offset || 0;
    schedules = schedules.slice(offset, offset + limit);

    return schedules;
  }

  async getScheduledNotifications(userId: string): Promise<ScheduledNotification[]> {
    const userSchedules = Array.from(this.schedules.values())
      .filter(s => s.metadata?.userId === userId);

    return userSchedules.map(schedule => ({
      scheduleId: schedule.id,
      notificationId: schedule.notificationId,
      scheduledAt: schedule.scheduledAt,
      status: schedule.status,
      type: schedule.metadata?.type || 'unknown',
    }));
  }

  async getScheduleStats(): Promise<{
    total: number;
    pending: number;
    executed: number;
    cancelled: number;
    failed: number;
  }> {
    const schedules = Array.from(this.schedules.values());
    
    return {
      total: schedules.length,
      pending: schedules.filter(s => s.status === 'pending').length,
      executed: schedules.filter(s => s.status === 'executed').length,
      cancelled: schedules.filter(s => s.status === 'cancelled').length,
      failed: schedules.filter(s => s.status === 'failed').length,
    };
  }

  private async createScheduledJob(
    schedule: Schedule,
    notification: Notification,
    options: any
  ): Promise<void> {
    if (schedule.cronExpression) {
      // Recurring job with cron expression
      const job = cron.schedule(schedule.cronExpression, async () => {
        await this.executeScheduledNotification(schedule, notification, options);
      }, {
        scheduled: false,
        timezone: schedule.timezone,
      });

      this.scheduledJobs.set(schedule.id, job);
      job.start();

    } else if (schedule.scheduledAt) {
      // One-time scheduled job
      const delay = schedule.scheduledAt.getTime() - Date.now();
      
      if (delay > 0) {
        // Add to Bull queue for delayed execution
        await this.notificationQueue.add(
          'scheduled',
          { notification, options },
          {
            delay,
            jobId: schedule.id,
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000,
            },
          }
        );
      } else {
        // Execute immediately if already past scheduled time
        await this.executeScheduledNotification(schedule, notification, options);
      }
    }
  }

  private async executeScheduledNotification(
    schedule: Schedule,
    notification: Notification,
    options: any
  ): Promise<void> {
    try {
      // Update schedule status
      schedule.status = 'executed';
      schedule.updatedAt = new Date();
      this.schedules.set(schedule.id, schedule);

      // Send notification
      await this.notificationService.sendNotification(notification, options);

      logger.info('Scheduled notification executed successfully', {
        scheduleId: schedule.id,
        notificationId: schedule.notificationId,
      });

      // Handle recurring notifications
      if (schedule.repeat?.enabled && schedule.repeat.interval !== 'custom') {
        await this.scheduleNextRecurrence(schedule, notification, options);
      }

    } catch (error) {
      // Update schedule status
      schedule.status = 'failed';
      schedule.updatedAt = new Date();
      this.schedules.set(schedule.id, schedule);

      logger.error('Scheduled notification execution failed', {
        scheduleId: schedule.id,
        notificationId: schedule.notificationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async scheduleNextRecurrence(
    schedule: Schedule,
    notification: Notification,
    options: any
  ): Promise<void> {
    const now = new Date();
    let nextScheduledAt: Date;

    switch (schedule.repeat?.interval) {
      case 'daily':
        nextScheduledAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        nextScheduledAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        nextScheduledAt = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
        break;
      case 'yearly':
        nextScheduledAt = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
        break;
      default:
        return; // No recurrence
    }

    // Check if we've exceeded the end date or max occurrences
    if (schedule.repeat?.endDate && nextScheduledAt > schedule.repeat.endDate) {
      return;
    }

    // Create new schedule for next occurrence
    const nextSchedule: Schedule = {
      ...schedule,
      id: uuidv4(),
      scheduledAt: nextScheduledAt,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.schedules.set(nextSchedule.id, nextSchedule);
    await this.createScheduledJob(nextSchedule, notification, options);
  }

  private cancelScheduledJob(scheduleId: string): void {
    const job = this.scheduledJobs.get(scheduleId);
    if (job) {
      job.stop();
      this.scheduledJobs.delete(scheduleId);
    }

    // Also remove from Bull queue if it exists
    this.notificationQueue.removeJobs(scheduleId);
  }

  private validateSchedule(schedule: Partial<Schedule>): void {
    if (!schedule.cronExpression && !schedule.scheduledAt) {
      throw new ValidationError('Either cron expression or scheduled date is required');
    }

    if (schedule.cronExpression && !this.isValidCronExpression(schedule.cronExpression)) {
      throw new InvalidScheduleError('Invalid cron expression');
    }

    if (schedule.scheduledAt && schedule.scheduledAt <= new Date()) {
      throw new InvalidScheduleError('Scheduled date must be in the future');
    }

    if (schedule.repeat?.enabled) {
      if (schedule.repeat.endDate && schedule.repeat.endDate <= new Date()) {
        throw new InvalidScheduleError('Repeat end date must be in the future');
      }

      if (schedule.repeat.maxOccurrences && schedule.repeat.maxOccurrences <= 0) {
        throw new InvalidScheduleError('Max occurrences must be greater than 0');
      }
    }
  }

  private validateScheduleUpdates(updates: Partial<Schedule>): void {
    if (updates.cronExpression && !this.isValidCronExpression(updates.cronExpression)) {
      throw new InvalidScheduleError('Invalid cron expression');
    }

    if (updates.scheduledAt && updates.scheduledAt <= new Date()) {
      throw new InvalidScheduleError('Scheduled date must be in the future');
    }
  }

  private isValidCronExpression(expression: string): boolean {
    try {
      return cron.validate(expression);
    } catch {
      return false;
    }
  }

  async cleanup(): Promise<void> {
    // Stop all scheduled jobs
    for (const [scheduleId, job] of this.scheduledJobs) {
      job.stop();
    }
    this.scheduledJobs.clear();

    // Close Bull queue
    await this.notificationQueue.close();

    logger.info('Scheduler service cleaned up');
  }
}
