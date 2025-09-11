// src/microservices/notifications-service/src/controllers/notification.controller.ts
import { Request, Response } from 'express';
import { 
  EmailNotification,
  PushNotification,
  SMSNotification,
  WebhookNotification,
  InAppNotification,
  SendNotificationOptions,
  SendBulkNotificationOptions,
  NotificationResult,
  NotificationStatus
} from '../types';
import { NotificationService } from '../services';
import { logger, metrics } from '../utils';
import { 
  ValidationError, 
  NotificationError,
  handleError,
  formatErrorResponse 
} from '../utils/errors';
import { 
  sendNotificationRequestSchema,
  sendBulkNotificationRequestSchema,
  notificationQuerySchema 
} from '../utils/validation';

export class NotificationController {
  private notificationService: NotificationService;

  constructor(notificationService: NotificationService) {
    this.notificationService = notificationService;
  }

  /**
   * Send a single notification
   * POST /api/notifications/send
   */
  async sendNotification(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      // Validate request body
      const validationResult = sendNotificationRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ValidationError('Invalid request body', validationResult.error.errors);
      }

      const { notification, options } = validationResult.data;

      // Send notification
      const result = await this.notificationService.sendNotification(notification, options);

      const duration = Date.now() - startTime;
      metrics.recordHttpRequest('POST', '/api/notifications/send', 200, duration / 1000);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Notification sent successfully',
        timestamp: new Date(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResponse = formatErrorResponse(error);
      
      logger.error('Send notification failed', {
        error: errorResponse.message,
        duration,
        userId: req.body?.notification?.userId,
        type: req.body?.notification?.type,
      });

      metrics.recordHttpRequest('POST', '/api/notifications/send', errorResponse.statusCode, duration / 1000);
      metrics.recordError('notification', 'send_failed');

      res.status(errorResponse.statusCode).json(errorResponse);
    }
  }

  /**
   * Send bulk notifications
   * POST /api/notifications/bulk
   */
  async sendBulkNotifications(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      // Validate request body
      const validationResult = sendBulkNotificationRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ValidationError('Invalid request body', validationResult.error.errors);
      }

      const { notifications, options } = validationResult.data;

      // Send bulk notifications
      const results = await this.notificationService.sendBulkNotifications(notifications, options);

      const duration = Date.now() - startTime;
      metrics.recordHttpRequest('POST', '/api/notifications/bulk', 200, duration / 1000);

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      res.status(200).json({
        success: true,
        data: {
          results,
          summary: {
            total: notifications.length,
            successful,
            failed,
          },
        },
        message: `Bulk notifications processed: ${successful} successful, ${failed} failed`,
        timestamp: new Date(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResponse = formatErrorResponse(error);
      
      logger.error('Send bulk notifications failed', {
        error: errorResponse.message,
        duration,
        count: req.body?.notifications?.length || 0,
      });

      metrics.recordHttpRequest('POST', '/api/notifications/bulk', errorResponse.statusCode, duration / 1000);
      metrics.recordError('notification', 'bulk_send_failed');

      res.status(errorResponse.statusCode).json(errorResponse);
    }
  }

  /**
   * Get notification status
   * GET /api/notifications/:id/status
   */
  async getNotificationStatus(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError('Notification ID is required');
      }

      // Get notification status
      const status = await this.notificationService.getNotificationStatus(id);

      const duration = Date.now() - startTime;
      metrics.recordHttpRequest('GET', '/api/notifications/:id/status', 200, duration / 1000);

      res.status(200).json({
        success: true,
        data: status,
        message: 'Notification status retrieved successfully',
        timestamp: new Date(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResponse = formatErrorResponse(error);
      
      logger.error('Get notification status failed', {
        error: errorResponse.message,
        duration,
        notificationId: req.params.id,
      });

      metrics.recordHttpRequest('GET', '/api/notifications/:id/status', errorResponse.statusCode, duration / 1000);
      metrics.recordError('notification', 'get_status_failed');

      res.status(errorResponse.statusCode).json(errorResponse);
    }
  }

  /**
   * Cancel a notification
   * DELETE /api/notifications/:id
   */
  async cancelNotification(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError('Notification ID is required');
      }

      // Cancel notification
      const cancelled = await this.notificationService.cancelNotification(id);

      const duration = Date.now() - startTime;
      metrics.recordHttpRequest('DELETE', '/api/notifications/:id', 200, duration / 1000);

      res.status(200).json({
        success: true,
        data: { cancelled },
        message: cancelled ? 'Notification cancelled successfully' : 'Notification not found or already cancelled',
        timestamp: new Date(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResponse = formatErrorResponse(error);
      
      logger.error('Cancel notification failed', {
        error: errorResponse.message,
        duration,
        notificationId: req.params.id,
      });

      metrics.recordHttpRequest('DELETE', '/api/notifications/:id', errorResponse.statusCode, duration / 1000);
      metrics.recordError('notification', 'cancel_failed');

      res.status(errorResponse.statusCode).json(errorResponse);
    }
  }

  /**
   * Get available providers
   * GET /api/notifications/providers
   */
  async getProviders(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      // Get available providers
      const providers = this.notificationService.getProviders();

      const duration = Date.now() - startTime;
      metrics.recordHttpRequest('GET', '/api/notifications/providers', 200, duration / 1000);

      res.status(200).json({
        success: true,
        data: providers,
        message: 'Providers retrieved successfully',
        timestamp: new Date(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResponse = formatErrorResponse(error);
      
      logger.error('Get providers failed', {
        error: errorResponse.message,
        duration,
      });

      metrics.recordHttpRequest('GET', '/api/notifications/providers', errorResponse.statusCode, duration / 1000);
      metrics.recordError('notification', 'get_providers_failed');

      res.status(errorResponse.statusCode).json(errorResponse);
    }
  }

  /**
   * Check if provider is enabled
   * GET /api/notifications/providers/:type/:provider/status
   */
  async getProviderStatus(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const { type, provider } = req.params;

      if (!type || !provider) {
        throw new ValidationError('Provider type and name are required');
      }

      // Check provider status
      const enabled = this.notificationService.isProviderEnabled(type, provider);

      const duration = Date.now() - startTime;
      metrics.recordHttpRequest('GET', '/api/notifications/providers/:type/:provider/status', 200, duration / 1000);

      res.status(200).json({
        success: true,
        data: { enabled },
        message: `Provider ${provider} for type ${type} is ${enabled ? 'enabled' : 'disabled'}`,
        timestamp: new Date(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResponse = formatErrorResponse(error);
      
      logger.error('Get provider status failed', {
        error: errorResponse.message,
        duration,
        type: req.params.type,
        provider: req.params.provider,
      });

      metrics.recordHttpRequest('GET', '/api/notifications/providers/:type/:provider/status', errorResponse.statusCode, duration / 1000);
      metrics.recordError('notification', 'get_provider_status_failed');

      res.status(errorResponse.statusCode).json(errorResponse);
    }
  }

  /**
   * Send email notification
   * POST /api/notifications/email
   */
  async sendEmailNotification(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      // Validate request body
      const validationResult = sendNotificationRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ValidationError('Invalid request body', validationResult.error.errors);
      }

      const { notification, options } = validationResult.data;

      // Ensure it's an email notification
      if (notification.type !== 'email') {
        throw new ValidationError('Notification type must be email');
      }

      // Send email notification
      const result = await this.notificationService.sendNotification(notification as EmailNotification, options);

      const duration = Date.now() - startTime;
      metrics.recordHttpRequest('POST', '/api/notifications/email', 200, duration / 1000);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Email notification sent successfully',
        timestamp: new Date(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResponse = formatErrorResponse(error);
      
      logger.error('Send email notification failed', {
        error: errorResponse.message,
        duration,
        userId: req.body?.notification?.userId,
      });

      metrics.recordHttpRequest('POST', '/api/notifications/email', errorResponse.statusCode, duration / 1000);
      metrics.recordError('notification', 'email_send_failed');

      res.status(errorResponse.statusCode).json(errorResponse);
    }
  }

  /**
   * Send push notification
   * POST /api/notifications/push
   */
  async sendPushNotification(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      // Validate request body
      const validationResult = sendNotificationRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ValidationError('Invalid request body', validationResult.error.errors);
      }

      const { notification, options } = validationResult.data;

      // Ensure it's a push notification
      if (notification.type !== 'push') {
        throw new ValidationError('Notification type must be push');
      }

      // Send push notification
      const result = await this.notificationService.sendNotification(notification as PushNotification, options);

      const duration = Date.now() - startTime;
      metrics.recordHttpRequest('POST', '/api/notifications/push', 200, duration / 1000);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Push notification sent successfully',
        timestamp: new Date(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResponse = formatErrorResponse(error);
      
      logger.error('Send push notification failed', {
        error: errorResponse.message,
        duration,
        userId: req.body?.notification?.userId,
      });

      metrics.recordHttpRequest('POST', '/api/notifications/push', errorResponse.statusCode, duration / 1000);
      metrics.recordError('notification', 'push_send_failed');

      res.status(errorResponse.statusCode).json(errorResponse);
    }
  }

  /**
   * Send SMS notification
   * POST /api/notifications/sms
   */
  async sendSMSNotification(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      // Validate request body
      const validationResult = sendNotificationRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ValidationError('Invalid request body', validationResult.error.errors);
      }

      const { notification, options } = validationResult.data;

      // Ensure it's an SMS notification
      if (notification.type !== 'sms') {
        throw new ValidationError('Notification type must be sms');
      }

      // Send SMS notification
      const result = await this.notificationService.sendNotification(notification as SMSNotification, options);

      const duration = Date.now() - startTime;
      metrics.recordHttpRequest('POST', '/api/notifications/sms', 200, duration / 1000);

      res.status(200).json({
        success: true,
        data: result,
        message: 'SMS notification sent successfully',
        timestamp: new Date(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResponse = formatErrorResponse(error);
      
      logger.error('Send SMS notification failed', {
        error: errorResponse.message,
        duration,
        userId: req.body?.notification?.userId,
      });

      metrics.recordHttpRequest('POST', '/api/notifications/sms', errorResponse.statusCode, duration / 1000);
      metrics.recordError('notification', 'sms_send_failed');

      res.status(errorResponse.statusCode).json(errorResponse);
    }
  }

  /**
   * Send webhook notification
   * POST /api/notifications/webhook
   */
  async sendWebhookNotification(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      // Validate request body
      const validationResult = sendNotificationRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ValidationError('Invalid request body', validationResult.error.errors);
      }

      const { notification, options } = validationResult.data;

      // Ensure it's a webhook notification
      if (notification.type !== 'webhook') {
        throw new ValidationError('Notification type must be webhook');
      }

      // Send webhook notification
      const result = await this.notificationService.sendNotification(notification as WebhookNotification, options);

      const duration = Date.now() - startTime;
      metrics.recordHttpRequest('POST', '/api/notifications/webhook', 200, duration / 1000);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Webhook notification sent successfully',
        timestamp: new Date(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResponse = formatErrorResponse(error);
      
      logger.error('Send webhook notification failed', {
        error: errorResponse.message,
        duration,
        userId: req.body?.notification?.userId,
      });

      metrics.recordHttpRequest('POST', '/api/notifications/webhook', errorResponse.statusCode, duration / 1000);
      metrics.recordError('notification', 'webhook_send_failed');

      res.status(errorResponse.statusCode).json(errorResponse);
    }
  }

  /**
   * Send in-app notification
   * POST /api/notifications/in-app
   */
  async sendInAppNotification(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      // Validate request body
      const validationResult = sendNotificationRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ValidationError('Invalid request body', validationResult.error.errors);
      }

      const { notification, options } = validationResult.data;

      // Ensure it's an in-app notification
      if (notification.type !== 'in-app') {
        throw new ValidationError('Notification type must be in-app');
      }

      // Send in-app notification
      const result = await this.notificationService.sendNotification(notification as InAppNotification, options);

      const duration = Date.now() - startTime;
      metrics.recordHttpRequest('POST', '/api/notifications/in-app', 200, duration / 1000);

      res.status(200).json({
        success: true,
        data: result,
        message: 'In-app notification sent successfully',
        timestamp: new Date(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResponse = formatErrorResponse(error);
      
      logger.error('Send in-app notification failed', {
        error: errorResponse.message,
        duration,
        userId: req.body?.notification?.userId,
      });

      metrics.recordHttpRequest('POST', '/api/notifications/in-app', errorResponse.statusCode, duration / 1000);
      metrics.recordError('notification', 'in_app_send_failed');

      res.status(errorResponse.statusCode).json(errorResponse);
    }
  }
}