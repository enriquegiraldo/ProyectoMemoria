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

      const { notification, options }: { notification: BaseNotification; options?: SendNotificationOptions } = validationResult.data;

      // Send notification
      const result: NotificationResult = await this.notificationService.sendNotification(notification, options);

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
      const errorResponse = formatErrorResponse(handleError(error)); // ✅ Usar handleError para convertir a CustomError
      
      logger.error('Send notification failed', {
        error: errorResponse.error.message, // ✅ Acceder a error.message
        duration,
        userId: req.body?.notification?.userId,
        type: req.body?.notification?.type,
      });

      metrics.recordHttpRequest('POST', '/api/notifications/send', errorResponse.error.statusCode, duration / 1000);
      metrics.recordError('notification', 'send_failed');

      res.status(errorResponse.error.statusCode).json(errorResponse); // ✅ Acceder a error.statusCode
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

      const { notifications, options }: { notifications: BaseNotification[]; options?: SendBulkNotificationOptions } = validationResult.data;

      // Send bulk notifications
      const results: NotificationResult[] = await this.notificationService.sendBulkNotifications(notifications, options);

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
      const errorResponse = formatErrorResponse(handleError(error)); // ✅ Usar handleError
      
      logger.error('Send bulk notifications failed', {
        error: errorResponse.error.message, // ✅ Acceder a error.message
        duration,
        count: req.body?.notifications?.length || 0,
      });

      metrics.recordHttpRequest('POST', '/api/notifications/bulk', errorResponse.error.statusCode, duration / 1000);
      metrics.recordError('notification', 'bulk_send_failed');

      res.status(errorResponse.error.statusCode).json(errorResponse); // ✅ Acceder a error.statusCode
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
      const status: NotificationStatus = await this.notificationService.getNotificationStatus(id);

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
      const errorResponse = formatErrorResponse(handleError(error)); // ✅ Usar handleError
      
      logger.error('Get notification status failed', {
        error: errorResponse.error.message, // ✅ Acceder a error.message
        duration,
        notificationId: req.params.id,
      });

      metrics.recordHttpRequest('GET', '/api/notifications/:id/status', errorResponse.error.statusCode, duration / 1000);
      metrics.recordError('notification', 'get_status_failed');

      res.status(errorResponse.error.statusCode).json(errorResponse); // ✅ Acceder a error.statusCode
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
      const cancelled: boolean = await this.notificationService.cancelNotification(id);

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
      const errorResponse = formatErrorResponse(handleError(error)); // ✅ Usar handleError
      
      logger.error('Cancel notification failed', {
        error: errorResponse.error.message, // ✅ Acceder a error.message
        duration,
        notificationId: req.params.id,
      });

      metrics.recordHttpRequest('DELETE', '/api/notifications/:id', errorResponse.error.statusCode, duration / 1000);
      metrics.recordError('notification', 'cancel_failed');

      res.status(errorResponse.error.statusCode).json(errorResponse); // ✅ Acceder a error.statusCode
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
      const errorResponse = formatErrorResponse(handleError(error)); // ✅ Usar handleError
      
      logger.error('Get providers failed', {
        error: errorResponse.error.message, // ✅ Acceder a error.message
        duration,
      });

      metrics.recordHttpRequest('GET', '/api/notifications/providers', errorResponse.error.statusCode, duration / 1000);
      metrics.recordError('notification', 'get_providers_failed');

      res.status(errorResponse.error.statusCode).json(errorResponse); // ✅ Acceder a error.statusCode
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
      const enabled: boolean = this.notificationService.isProviderEnabled(type, provider);

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
      const errorResponse = formatErrorResponse(handleError(error)); // ✅ Usar handleError
      
      logger.error('Get provider status failed', {
        error: errorResponse.error.message, // ✅ Acceder a error.message
        duration,
        type: req.params.type,
        provider: req.params['provider'],
      });

      metrics.recordHttpRequest('GET', '/api/notifications/providers/:type/:provider/status', errorResponse.error.statusCode, duration / 1000);
      metrics.recordError('notification', 'get_provider_status_failed');

      res.status(errorResponse.error.statusCode).json(errorResponse); // ✅ Acceder a error.statusCode
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

      const { notification, options }: { notification: EmailNotification; options?: SendNotificationOptions } = validationResult.data;

      // Send email notification
      const result: NotificationResult = await this.notificationService.sendNotification(notification, options);

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
      const errorResponse = formatErrorResponse(handleError(error)); // ✅ Usar handleError
      
      logger.error('Send email notification failed', {
        error: errorResponse.error.message, // ✅ Acceder a error.message
        duration,
        userId: req.body?.notification?.userId,
      });

      metrics.recordHttpRequest('POST', '/api/notifications/email', errorResponse.error.statusCode, duration / 1000);
      metrics.recordError('notification', 'email_send_failed');

      res.status(errorResponse.error.statusCode).json(errorResponse); // ✅ Acceder a error.statusCode
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

      const { notification, options }: { notification: PushNotification; options?: SendNotificationOptions } = validationResult.data;

      // Send push notification
      const result: NotificationResult = await this.notificationService.sendNotification(notification, options);

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
      const errorResponse = formatErrorResponse(handleError(error)); // ✅ Usar handleError
      
      logger.error('Send push notification failed', {
        error: errorResponse.error.message, // ✅ Acceder a error.message
        duration,
        userId: req.body?.notification?.userId,
      });

      metrics.recordHttpRequest('POST', '/api/notifications/push', errorResponse.error.statusCode, duration / 1000);
      metrics.recordError('notification', 'push_send_failed');

      res.status(errorResponse.error.statusCode).json(errorResponse); // ✅ Acceder a error.statusCode
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

      const { notification, options }: { notification: SMSNotification; options?: SendNotificationOptions } = validationResult.data;

      // Send SMS notification
      const result: NotificationResult = await this.notificationService.sendNotification(notification, options);

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
      const errorResponse = formatErrorResponse(handleError(error)); // ✅ Usar handleError
      
      logger.error('Send SMS notification failed', {
        error: errorResponse.error.message, // ✅ Acceder a error.message
        duration,
        userId: req.body?.notification?.userId,
      });

      metrics.recordHttpRequest('POST', '/api/notifications/sms', errorResponse.error.statusCode, duration / 1000);
      metrics.recordError('notification', 'sms_send_failed');

      res.status(errorResponse.error.statusCode).json(errorResponse); // ✅ Acceder a error.statusCode
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

      const { notification, options }: { notification: WebhookNotification; options?: SendNotificationOptions } = validationResult.data;

      // Send webhook notification
      const result: NotificationResult = await this.notificationService.sendNotification(notification, options);

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
      const errorResponse = formatErrorResponse(handleError(error)); // ✅ Usar handleError
      
      logger.error('Send webhook notification failed', {
        error: errorResponse.error.message, // ✅ Acceder a error.message
        duration,
        userId: req.body?.notification?.userId,
      });

      metrics.recordHttpRequest('POST', '/api/notifications/webhook', errorResponse.error.statusCode, duration / 1000);
      metrics.recordError('notification', 'webhook_send_failed');

      res.status(errorResponse.error.statusCode).json(errorResponse); // ✅ Acceder a error.statusCode
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

      const { notification, options }: { notification: InAppNotification; options?: SendNotificationOptions } = validationResult.data;

      // Send in-app notification (lógica hipotética: guardar en BD para mostrar en UI)
      const result: NotificationResult = await this.notificationService.sendNotification(notification, options);

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
      const errorResponse = formatErrorResponse(handleError(error)); // ✅ Usar handleError
      
      logger.error('Send in-app notification failed', {
        error: errorResponse.error.message, // ✅ Acceder a error.message
        duration,
        userId: req.body?.notification?.userId,
      });

      metrics.recordHttpRequest('POST', '/api/notifications/in-app', errorResponse.error.statusCode, duration / 1000);
      metrics.recordError('notification', 'in_app_send_failed');

      res.status(errorResponse.error.statusCode).json(errorResponse); // ✅ Acceder a error.statusCode
    }
  }
}














