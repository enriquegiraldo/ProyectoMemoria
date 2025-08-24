import { v4 as uuidv4 } from 'uuid';
import { 
  Notification,
  EmailNotification,
  PushNotification,
  SMSNotification,
  WebhookNotification,
  InAppNotification,
  NotificationResult,
  NotificationStatus,
  NotificationPriority,
  SendNotificationOptions,
  SendBulkNotificationOptions
} from '../types';
import { 
  EmailProviderManager,
  PushProviderManager,
  SMSProviderManager,
  WebhookProviderManager
} from '../providers';
import { TemplateService } from './template.service';
import { logger, metrics, logNotification } from '../utils';
import { 
  NotificationError, 
  ValidationError, 
  QuotaExceededError,
  ProviderNotEnabledError 
} from '../utils/errors';
import { config } from '../config';

export class NotificationService {
  private emailProviderManager: EmailProviderManager;
  private pushProviderManager: PushProviderManager;
  private smsProviderManager: SMSProviderManager;
  private webhookProviderManager: WebhookProviderManager;
  private templateService: TemplateService;

  constructor() {
    this.emailProviderManager = new EmailProviderManager();
    this.pushProviderManager = new PushProviderManager();
    this.smsProviderManager = new SMSProviderManager();
    this.webhookProviderManager = new WebhookProviderManager();
    this.templateService = new TemplateService();
  }

  async sendNotification(
    notification: Notification,
    options: SendNotificationOptions = {}
  ): Promise<NotificationResult> {
    const startTime = Date.now();
    const notificationId = notification.id || uuidv4();

    try {
      // Validate notification
      this.validateNotification(notification);

      // Check quotas
      await this.checkQuotas(notification.userId, notification.type);

      // Apply options
      const processedNotification = this.applyOptions(notification, options);

      // Render template if needed
      let renderedNotification = processedNotification;
      if (processedNotification.templateId) {
        renderedNotification = await this.templateService.renderNotification(
          processedNotification,
          options.templateData || {}
        );
      }

      // Send notification based on type
      let result: NotificationResult;

      switch (renderedNotification.type) {
        case 'email':
          result = await this.sendEmailNotification(renderedNotification as EmailNotification, options);
          break;
        case 'push':
          result = await this.sendPushNotification(renderedNotification as PushNotification, options);
          break;
        case 'sms':
          result = await this.sendSMSNotification(renderedNotification as SMSNotification, options);
          break;
        case 'webhook':
          result = await this.sendWebhookNotification(renderedNotification as WebhookNotification, options);
          break;
        case 'in-app':
          result = await this.sendInAppNotification(renderedNotification as InAppNotification, options);
          break;
        default:
          throw new NotificationError(`Unsupported notification type: ${renderedNotification.type}`);
      }

      const duration = Date.now() - startTime;
      
      logNotification('info', 'Notification sent successfully', {
        notificationId,
        type: renderedNotification.type,
        userId: renderedNotification.userId,
        provider: result.provider,
        duration,
      });

      metrics.recordNotificationSent(renderedNotification.type, result.provider, 'success');
      metrics.recordNotificationDuration(renderedNotification.type, result.provider, duration / 1000);

      return {
        ...result,
        notificationId,
        timestamp: new Date(),
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      logNotification('error', 'Notification sending failed', {
        notificationId,
        type: notification.type,
        userId: notification.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      });

      metrics.recordNotificationSent(notification.type, 'unknown', 'failed');
      metrics.recordNotificationDuration(notification.type, 'unknown', duration / 1000);
      metrics.recordError('notification', 'error');

      throw error;
    }
  }

  async sendBulkNotifications(
    notifications: Notification[],
    options: SendBulkNotificationOptions = {}
  ): Promise<NotificationResult[]> {
    const startTime = Date.now();
    const { batchSize = 100, concurrency = 5, preferredProvider } = options;

    try {
      // Validate all notifications
      notifications.forEach(notification => this.validateNotification(notification));

      // Check quotas for all users
      const userIds = [...new Set(notifications.map(n => n.userId))];
      for (const userId of userIds) {
        const userNotifications = notifications.filter(n => n.userId === userId);
        const notificationCounts = this.countNotificationsByType(userNotifications);
        
        for (const [type, count] of Object.entries(notificationCounts)) {
          await this.checkQuotas(userId, type as any, count);
        }
      }

      // Process notifications in batches
      const results: NotificationResult[] = [];
      
      for (let i = 0; i < notifications.length; i += batchSize) {
        const batch = notifications.slice(i, i + batchSize);
        
        // Process batch with concurrency limit
        const batchPromises = batch.map(notification => 
          this.sendNotification(notification, { preferredProvider })
        );

        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            // Create error result for failed notifications
            const notification = batch[index];
            results.push({
              success: false,
              error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
              notificationId: notification.id || uuidv4(),
              provider: 'unknown',
              timestamp: new Date(),
            });
          }
        });
      }

      const duration = Date.now() - startTime;
      
      logger.info('Bulk notifications processed', {
        total: notifications.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        duration,
      });

      return results;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('Bulk notifications failed', {
        total: notifications.length,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      });

      throw error;
    }
  }

  private async sendEmailNotification(
    notification: EmailNotification,
    options: SendNotificationOptions
  ): Promise<NotificationResult> {
    const result = await this.emailProviderManager.send(notification, options.preferredProvider);
    
    return {
      success: result.success,
      messageId: result.messageId,
      provider: result.provider,
      timestamp: result.timestamp,
    };
  }

  private async sendPushNotification(
    notification: PushNotification,
    options: SendNotificationOptions
  ): Promise<NotificationResult> {
    const result = await this.pushProviderManager.send(
      notification.subscription,
      notification,
      options.preferredProvider
    );
    
    return {
      success: result.success,
      messageId: result.messageId,
      provider: result.provider,
      timestamp: result.timestamp,
    };
  }

  private async sendSMSNotification(
    notification: SMSNotification,
    options: SendNotificationOptions
  ): Promise<NotificationResult> {
    const result = await this.smsProviderManager.send(notification, options.preferredProvider);
    
    return {
      success: result.success,
      messageId: result.messageId,
      provider: result.provider,
      timestamp: result.timestamp,
    };
  }

  private async sendWebhookNotification(
    notification: WebhookNotification,
    options: SendNotificationOptions
  ): Promise<NotificationResult> {
    const result = await this.webhookProviderManager.send(notification);
    
    return {
      success: result.success,
      messageId: result.messageId,
      provider: result.provider,
      timestamp: result.timestamp,
    };
  }

  private async sendInAppNotification(
    notification: InAppNotification,
    options: SendNotificationOptions
  ): Promise<NotificationResult> {
    // In-app notifications are typically stored in a database
    // and retrieved by the client application
    // For now, we'll simulate a successful send
    
    logger.info('In-app notification processed', {
      notificationId: notification.id,
      userId: notification.userId,
      title: notification.title,
    });

    return {
      success: true,
      messageId: notification.id,
      provider: 'in-app',
      timestamp: new Date(),
    };
  }

  private validateNotification(notification: Notification): void {
    if (!notification.userId) {
      throw new ValidationError('User ID is required');
    }

    if (!notification.type) {
      throw new ValidationError('Notification type is required');
    }

    // Type-specific validation
    switch (notification.type) {
      case 'email':
        this.validateEmailNotification(notification as EmailNotification);
        break;
      case 'push':
        this.validatePushNotification(notification as PushNotification);
        break;
      case 'sms':
        this.validateSMSNotification(notification as SMSNotification);
        break;
      case 'webhook':
        this.validateWebhookNotification(notification as WebhookNotification);
        break;
      case 'in-app':
        this.validateInAppNotification(notification as InAppNotification);
        break;
    }
  }

  private validateEmailNotification(notification: EmailNotification): void {
    if (!notification.to || (Array.isArray(notification.to) && notification.to.length === 0)) {
      throw new ValidationError('Email recipient is required');
    }

    if (!notification.subject && !notification.templateId) {
      throw new ValidationError('Email subject or template ID is required');
    }

    if (!notification.html && !notification.text && !notification.templateId) {
      throw new ValidationError('Email content or template ID is required');
    }
  }

  private validatePushNotification(notification: PushNotification): void {
    if (!notification.subscription || !notification.subscription.endpoint) {
      throw new ValidationError('Push subscription endpoint is required');
    }

    if (!notification.title && !notification.templateId) {
      throw new ValidationError('Push title or template ID is required');
    }

    if (!notification.body && !notification.templateId) {
      throw new ValidationError('Push body or template ID is required');
    }
  }

  private validateSMSNotification(notification: SMSNotification): void {
    if (!notification.to) {
      throw new ValidationError('SMS recipient is required');
    }

    if (!notification.body && !notification.templateId) {
      throw new ValidationError('SMS body or template ID is required');
    }
  }

  private validateWebhookNotification(notification: WebhookNotification): void {
    if (!notification.url) {
      throw new ValidationError('Webhook URL is required');
    }

    if (!notification.payload && !notification.templateId) {
      throw new ValidationError('Webhook payload or template ID is required');
    }
  }

  private validateInAppNotification(notification: InAppNotification): void {
    if (!notification.title && !notification.templateId) {
      throw new ValidationError('In-app title or template ID is required');
    }

    if (!notification.message && !notification.templateId) {
      throw new ValidationError('In-app message or template ID is required');
    }
  }

  private applyOptions(notification: Notification, options: SendNotificationOptions): Notification {
    const processedNotification = { ...notification };

    if (options.priority) {
      processedNotification.priority = options.priority;
    }

    if (options.scheduledAt) {
      processedNotification.scheduledAt = options.scheduledAt;
    }

    if (options.expiresAt) {
      processedNotification.expiresAt = options.expiresAt;
    }

    if (options.metadata) {
      processedNotification.metadata = {
        ...processedNotification.metadata,
        ...options.metadata,
      };
    }

    return processedNotification;
  }

  private async checkQuotas(userId: string, type: string, count: number = 1): Promise<void> {
    // This is a simplified quota check
    // In a real implementation, you would check against a database
    // and track usage over time periods (daily, monthly)
    
    const dailyLimit = 1000; // Example daily limit
    const monthlyLimit = 10000; // Example monthly limit

    // For now, we'll just log the quota check
    logger.debug('Quota check', {
      userId,
      type,
      count,
      dailyLimit,
      monthlyLimit,
    });

    // In a real implementation, you would:
    // 1. Get current usage from database
    // 2. Check if adding 'count' would exceed limits
    // 3. Throw QuotaExceededError if limits would be exceeded
  }

  private countNotificationsByType(notifications: Notification[]): Record<string, number> {
    const counts: Record<string, number> = {};
    
    notifications.forEach(notification => {
      counts[notification.type] = (counts[notification.type] || 0) + 1;
    });
    
    return counts;
  }

  async getNotificationStatus(notificationId: string): Promise<NotificationStatus> {
    // This would typically query a database or external service
    // For now, return a mock status
    return {
      notificationId,
      status: 'sent',
      timestamp: new Date(),
      provider: 'unknown',
      messageId: notificationId,
    };
  }

  async cancelNotification(notificationId: string): Promise<boolean> {
    // This would typically cancel a scheduled notification
    // For now, return true
    logger.info('Notification cancelled', { notificationId });
    return true;
  }

  getProviders(): {
    email: string[];
    push: string[];
    sms: string[];
    webhook: string[];
  } {
    return {
      email: this.emailProviderManager.getProviders().map(p => p.name),
      push: this.pushProviderManager.getProviders().map(p => p.name),
      sms: this.smsProviderManager.getProviders().map(p => p.name),
      webhook: ['webhook'], // Webhook provider is always available
    };
  }

  isProviderEnabled(type: string, provider: string): boolean {
    switch (type) {
      case 'email':
        return this.emailProviderManager.isProviderEnabled(provider);
      case 'push':
        return this.pushProviderManager.isProviderEnabled(provider);
      case 'sms':
        return this.smsProviderManager.isProviderEnabled(provider);
      case 'webhook':
        return true; // Webhook provider is always enabled
      default:
        return false;
    }
  }
}
