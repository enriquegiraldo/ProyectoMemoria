import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { 
  WebhookNotification, 
  WebhookResult, 
  WebhookProvider as IWebhookProvider 
} from '../types';
import { logger } from '../utils/logger';
import { metrics } from '../utils/metrics';
import { config } from '../config';

export class WebhookProvider implements IWebhookProvider {
  name = 'webhook';
  enabled = true; // Webhooks are always enabled
  private httpClient: AxiosInstance;

  constructor() {
    this.httpClient = axios.create({
      timeout: config.webhook.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MemoriaEterna-Notifications/1.0',
      },
    });

    // Add request interceptor for logging
    this.httpClient.interceptors.request.use(
      (config) => {
        logger.debug('Webhook request', {
          method: config.method,
          url: config.url,
          headers: config.headers,
        });
        return config;
      },
      (error) => {
        logger.error('Webhook request error', { error: error.message });
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.httpClient.interceptors.response.use(
      (response) => {
        logger.debug('Webhook response', {
          status: response.status,
          statusText: response.statusText,
          url: response.config.url,
        });
        return response;
      },
      (error) => {
        logger.error('Webhook response error', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          error: error.message,
        });
        return Promise.reject(error);
      }
    );
  }

  async send(notification: WebhookNotification): Promise<WebhookResult> {
    const startTime = Date.now();

    try {
      const requestConfig: AxiosRequestConfig = {
        method: notification.method || 'POST',
        url: notification.url,
        headers: {
          ...notification.headers,
          'X-Notification-ID': notification.id,
          'X-Notification-Type': notification.type,
          'X-Notification-Timestamp': new Date().toISOString(),
        },
        data: notification.payload,
        timeout: notification.timeout || config.webhook.timeout || 10000,
        validateStatus: (status) => {
          // Consider 2xx and 3xx as success
          return status >= 200 && status < 400;
        },
      };

      // Add authentication if provided
      if (notification.auth) {
        if (notification.auth.type === 'basic') {
          requestConfig.auth = {
            username: notification.auth.username,
            password: notification.auth.password,
          };
        } else if (notification.auth.type === 'bearer') {
          requestConfig.headers = {
            ...requestConfig.headers,
            'Authorization': `Bearer ${notification.auth.token}`,
          };
        } else if (notification.auth.type === 'api-key') {
          requestConfig.headers = {
            ...requestConfig.headers,
            [notification.auth.headerName || 'X-API-Key']: notification.auth.apiKey,
          };
        }
      }

      const response = await this.httpClient.request(requestConfig);
      const duration = Date.now() - startTime;

      logger.info('Webhook notification sent successfully', {
        url: notification.url,
        method: notification.method || 'POST',
        status: response.status,
        duration,
      });

      metrics.recordWebhookSent('webhook', 'success', duration / 1000);

      return {
        success: true,
        statusCode: response.status,
        responseData: response.data,
        provider: this.name,
        timestamp: new Date(),
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('Webhook notification failed', {
        url: notification.url,
        method: notification.method || 'POST',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      });

      metrics.recordWebhookSent('webhook', 'failed', duration / 1000);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        statusCode: error.response?.status,
        responseData: error.response?.data,
        provider: this.name,
        timestamp: new Date(),
      };
    }
  }

  async sendBulk(notifications: WebhookNotification[]): Promise<WebhookResult[]> {
    const promises = notifications.map(notification => this.send(notification));
    return Promise.all(promises);
  }

  async sendWithRetry(notification: WebhookNotification, maxRetries: number = 3): Promise<WebhookResult> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.send(notification);
        if (result.success) {
          return result;
        }
        lastError = result.error;
      } catch (error) {
        lastError = error;
        logger.warn(`Webhook retry attempt ${attempt}/${maxRetries} failed`, {
          url: notification.url,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return {
      success: false,
      error: `All ${maxRetries} retry attempts failed. Last error: ${lastError}`,
      provider: this.name,
      timestamp: new Date(),
    };
  }

  async validateWebhook(url: string, method: string = 'POST', auth?: any): Promise<boolean> {
    try {
      const testNotification: WebhookNotification = {
        id: 'test-validation',
        type: 'test',
        url,
        method: method as any,
        payload: { test: true, timestamp: new Date().toISOString() },
        auth,
      };

      const result = await this.send(testNotification);
      return result.success;
    } catch (error) {
      logger.error('Webhook validation failed', {
        url,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }
}

export class WebhookProviderManager {
  private provider: WebhookProvider;

  constructor() {
    this.provider = new WebhookProvider();
  }

  async send(notification: WebhookNotification): Promise<WebhookResult> {
    return this.provider.send(notification);
  }

  async sendBulk(notifications: WebhookNotification[]): Promise<WebhookResult[]> {
    return this.provider.sendBulk(notifications);
  }

  async sendWithRetry(notification: WebhookNotification, maxRetries: number = 3): Promise<WebhookResult> {
    return this.provider.sendWithRetry(notification, maxRetries);
  }

  async validateWebhook(url: string, method: string = 'POST', auth?: any): Promise<boolean> {
    return this.provider.validateWebhook(url, method, auth);
  }

  getProvider(): WebhookProvider {
    return this.provider;
  }
}
