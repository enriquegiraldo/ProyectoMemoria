import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { logger } from '../utils';

export interface NotificationRequest {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  channels?: string[];
  scheduledAt?: Date;
}

export interface NotificationResponse {
  id: string;
  status: 'sent' | 'pending' | 'failed';
  message?: string;
}

export interface NotificationsServiceConfig {
  baseURL: string;
  timeout: number;
  retries: number;
}

export class NotificationsIntegrationService {
  private notificationsClient: AxiosInstance;
  private config: NotificationsServiceConfig;

  constructor() {
    this.config = {
      baseURL: process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:3004',
      timeout: 10000,
      retries: 3
    };

    this.notificationsClient = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'payments-service/1.0.0'
      }
    });

    // Add request interceptor for logging
    this.notificationsClient.interceptors.request.use(
      (config) => {
        logger.debug('Notifications Service Request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          service: 'notifications-integration'
        });
        return config;
      },
      (error) => {
        logger.error('Notifications Service Request Error', {
          error: error.message,
          service: 'notifications-integration'
        });
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.notificationsClient.interceptors.response.use(
      (response) => {
        logger.debug('Notifications Service Response', {
          status: response.status,
          url: response.config.url,
          service: 'notifications-integration'
        });
        return response;
      },
      (error) => {
        logger.error('Notifications Service Response Error', {
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
          url: error.config?.url,
          service: 'notifications-integration'
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Send payment success notification
   */
  async sendPaymentSuccessNotification(
    userId: string,
    paymentData: {
      amount: number;
      currency: string;
      paymentMethod: string;
      provider: string;
      transactionId: string;
    }
  ): Promise<NotificationResponse | null> {
    const notification: NotificationRequest = {
      userId,
      type: 'payment_success',
      title: 'Pago Exitoso',
      message: `Tu pago de ${paymentData.amount} ${paymentData.currency} ha sido procesado exitosamente.`,
      data: {
        amount: paymentData.amount,
        currency: paymentData.currency,
        paymentMethod: paymentData.paymentMethod,
        provider: paymentData.provider,
        transactionId: paymentData.transactionId,
        timestamp: new Date().toISOString()
      },
      priority: 'normal',
      channels: ['email', 'push', 'sms']
    };

    return this.sendNotification(notification);
  }

  /**
   * Send payment failure notification
   */
  async sendPaymentFailureNotification(
    userId: string,
    paymentData: {
      amount: number;
      currency: string;
      paymentMethod: string;
      provider: string;
      reason: string;
    }
  ): Promise<NotificationResponse | null> {
    const notification: NotificationRequest = {
      userId,
      type: 'payment_failure',
      title: 'Pago Fallido',
      message: `Tu pago de ${paymentData.amount} ${paymentData.currency} no pudo ser procesado.`,
      data: {
        amount: paymentData.amount,
        currency: paymentData.currency,
        paymentMethod: paymentData.paymentMethod,
        provider: paymentData.provider,
        reason: paymentData.reason,
        timestamp: new Date().toISOString()
      },
      priority: 'high',
      channels: ['email', 'push']
    };

    return this.sendNotification(notification);
  }

  /**
   * Send subscription created notification
   */
  async sendSubscriptionCreatedNotification(
    userId: string,
    subscriptionData: {
      planName: string;
      amount: number;
      currency: string;
      interval: string;
      nextBillingDate: Date;
    }
  ): Promise<NotificationResponse | null> {
    const notification: NotificationRequest = {
      userId,
      type: 'subscription_created',
      title: 'Suscripción Creada',
      message: `Tu suscripción ${subscriptionData.planName} ha sido activada exitosamente.`,
      data: {
        planName: subscriptionData.planName,
        amount: subscriptionData.amount,
        currency: subscriptionData.currency,
        interval: subscriptionData.interval,
        nextBillingDate: subscriptionData.nextBillingDate.toISOString(),
        timestamp: new Date().toISOString()
      },
      priority: 'normal',
      channels: ['email', 'push']
    };

    return this.sendNotification(notification);
  }

  /**
   * Send subscription renewal notification
   */
  async sendSubscriptionRenewalNotification(
    userId: string,
    subscriptionData: {
      planName: string;
      amount: number;
      currency: string;
      nextBillingDate: Date;
    }
  ): Promise<NotificationResponse | null> {
    const notification: NotificationRequest = {
      userId,
      type: 'subscription_renewal',
      title: 'Renovación de Suscripción',
      message: `Tu suscripción ${subscriptionData.planName} será renovada el ${subscriptionData.nextBillingDate.toLocaleDateString()}.`,
      data: {
        planName: subscriptionData.planName,
        amount: subscriptionData.amount,
        currency: subscriptionData.currency,
        nextBillingDate: subscriptionData.nextBillingDate.toISOString(),
        timestamp: new Date().toISOString()
      },
      priority: 'normal',
      channels: ['email', 'push']
    };

    return this.sendNotification(notification);
  }

  /**
   * Send subscription cancellation notification
   */
  async sendSubscriptionCancellationNotification(
    userId: string,
    subscriptionData: {
      planName: string;
      endDate: Date;
      reason?: string;
    }
  ): Promise<NotificationResponse | null> {
    const notification: NotificationRequest = {
      userId,
      type: 'subscription_cancelled',
      title: 'Suscripción Cancelada',
      message: `Tu suscripción ${subscriptionData.planName} ha sido cancelada.`,
      data: {
        planName: subscriptionData.planName,
        endDate: subscriptionData.endDate.toISOString(),
        reason: subscriptionData.reason,
        timestamp: new Date().toISOString()
      },
      priority: 'normal',
      channels: ['email', 'push']
    };

    return this.sendNotification(notification);
  }

  /**
   * Send refund notification
   */
  async sendRefundNotification(
    userId: string,
    refundData: {
      amount: number;
      currency: string;
      originalTransactionId: string;
      refundId: string;
      reason?: string;
    }
  ): Promise<NotificationResponse | null> {
    const notification: NotificationRequest = {
      userId,
      type: 'refund_processed',
      title: 'Reembolso Procesado',
      message: `Tu reembolso de ${refundData.amount} ${refundData.currency} ha sido procesado.`,
      data: {
        amount: refundData.amount,
        currency: refundData.currency,
        originalTransactionId: refundData.originalTransactionId,
        refundId: refundData.refundId,
        reason: refundData.reason,
        timestamp: new Date().toISOString()
      },
      priority: 'normal',
      channels: ['email', 'push']
    };

    return this.sendNotification(notification);
  }

  /**
   * Send payment reminder notification
   */
  async sendPaymentReminderNotification(
    userId: string,
    reminderData: {
      amount: number;
      currency: string;
      dueDate: Date;
      subscriptionName?: string;
    }
  ): Promise<NotificationResponse | null> {
    const notification: NotificationRequest = {
      userId,
      type: 'payment_reminder',
      title: 'Recordatorio de Pago',
      message: `Recordatorio: Tu pago de ${reminderData.amount} ${reminderData.currency} vence el ${reminderData.dueDate.toLocaleDateString()}.`,
      data: {
        amount: reminderData.amount,
        currency: reminderData.currency,
        dueDate: reminderData.dueDate.toISOString(),
        subscriptionName: reminderData.subscriptionName,
        timestamp: new Date().toISOString()
      },
      priority: 'high',
      channels: ['email', 'push', 'sms']
    };

    return this.sendNotification(notification);
  }

  /**
   * Send custom notification
   */
  async sendCustomNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    data?: Record<string, any>,
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal',
    channels?: string[]
  ): Promise<NotificationResponse | null> {
    const notification: NotificationRequest = {
      userId,
      type,
      title,
      message,
      data,
      priority,
      channels: channels || ['email', 'push']
    };

    return this.sendNotification(notification);
  }

  /**
   * Send notification to Notifications Service
   */
  private async sendNotification(notification: NotificationRequest): Promise<NotificationResponse | null> {
    try {
      const response: AxiosResponse<NotificationResponse> = await this.notificationsClient.post(
        '/api/notifications/send',
        notification,
        {
          headers: {
            'X-Service-Name': 'payments-service',
            'X-Service-Version': '1.0.0'
          }
        }
      );

      logger.info('Notification sent successfully', {
        userId: notification.userId,
        type: notification.type,
        notificationId: response.data.id,
        service: 'notifications-integration'
      });

      return response.data;
    } catch (error: any) {
      logger.error('Failed to send notification', {
        userId: notification.userId,
        type: notification.type,
        error: error.message,
        status: error.response?.status,
        service: 'notifications-integration'
      });

      return null;
    }
  }

  /**
   * Health check for Notifications Service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.notificationsClient.get('/health', {
        timeout: 3000
      });

      return response.status === 200;
    } catch (error: any) {
      logger.error('Notifications Service health check failed', {
        error: error.message,
        service: 'notifications-integration'
      });

      return false;
    }
  }

  /**
   * Get service configuration
   */
  getConfig(): NotificationsServiceConfig {
    return this.config;
  }
}

// Export singleton instance
export const notificationsIntegrationService = new NotificationsIntegrationService();
