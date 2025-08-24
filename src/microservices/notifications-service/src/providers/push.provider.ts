import webpush from 'web-push';
import * as admin from 'firebase-admin';
import { 
  PushNotification, 
  PushSubscription, 
  PushResult, 
  PushProvider as IPushProvider 
} from '../types';
import { logger } from '../utils/logger';
import { metrics } from '../utils/metrics';
import { config } from '../config';

export class WebPushProvider implements IPushProvider {
  name = 'web-push';
  enabled = config.push.webPush.enabled;

  constructor() {
    if (this.enabled && config.push.webPush.vapidPublicKey && config.push.webPush.vapidPrivateKey) {
      webpush.setVapidDetails(
        config.push.webPush.subject || 'mailto:noreply@memoriaeterna.com',
        config.push.webPush.vapidPublicKey,
        config.push.webPush.vapidPrivateKey
      );
    }
  }

  async send(subscription: PushSubscription, notification: PushNotification): Promise<PushResult> {
    const startTime = Date.now();

    try {
      if (!this.enabled) {
        throw new Error('Web Push provider is not enabled');
      }

      const payload = JSON.stringify({
        title: notification.title,
        body: notification.body,
        icon: notification.icon,
        badge: notification.badge,
        image: notification.image,
        tag: notification.tag,
        data: notification.data,
        actions: notification.actions,
        requireInteraction: notification.requireInteraction,
        silent: notification.silent,
        timestamp: notification.timestamp || Date.now(),
        url: notification.url,
      });

      const result = await webpush.sendNotification(subscription, payload);
      const duration = Date.now() - startTime;

      logger.info('Web Push notification sent successfully', {
        endpoint: subscription.endpoint,
        title: notification.title,
        statusCode: result.statusCode,
        duration,
      });

      metrics.recordPushSent('web-push', 'success', duration / 1000);

      return {
        success: true,
        messageId: result.headers['etag'] || undefined,
        provider: this.name,
        timestamp: new Date(),
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('Web Push notification failed', {
        endpoint: subscription.endpoint,
        title: notification.title,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      });

      metrics.recordPushSent('web-push', 'failed', duration / 1000);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: this.name,
        timestamp: new Date(),
      };
    }
  }

  async sendToMultiple(subscriptions: PushSubscription[], notification: PushNotification): Promise<PushResult[]> {
    const promises = subscriptions.map(subscription => this.send(subscription, notification));
    return Promise.all(promises);
  }
}

export class FirebaseProvider implements IPushProvider {
  name = 'firebase';
  enabled = config.push.firebase.enabled;
  private app: admin.app.App;

  constructor() {
    if (this.enabled && config.push.firebase.projectId && config.push.firebase.privateKey && config.push.firebase.clientEmail) {
      this.app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: config.push.firebase.projectId,
          privateKey: config.push.firebase.privateKey.replace(/\\n/g, '\n'),
          clientEmail: config.push.firebase.clientEmail,
        }),
      });
    }
  }

  async send(subscription: PushSubscription, notification: PushNotification): Promise<PushResult> {
    const startTime = Date.now();

    try {
      if (!this.enabled) {
        throw new Error('Firebase provider is not enabled');
      }

      const message: admin.messaging.Message = {
        token: subscription.endpoint, // For FCM, the endpoint is the token
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.image,
        },
        data: notification.data,
        android: {
          notification: {
            icon: notification.icon,
            color: '#4CAF50',
            clickAction: notification.url,
            tag: notification.tag,
            priority: 'high',
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: notification.title,
                body: notification.body,
              },
              badge: 1,
              sound: 'default',
              'mutable-content': 1,
            },
          },
        },
        webpush: {
          notification: {
            title: notification.title,
            body: notification.body,
            icon: notification.icon,
            badge: notification.badge,
            image: notification.image,
            tag: notification.tag,
            requireInteraction: notification.requireInteraction,
            silent: notification.silent,
            data: notification.data,
            actions: notification.actions?.map(action => ({
              action: action.action,
              title: action.title,
              icon: action.icon,
            })),
          },
          fcmOptions: {
            link: notification.url,
          },
        },
      };

      const response = await admin.messaging(this.app).send(message);
      const duration = Date.now() - startTime;

      logger.info('Firebase notification sent successfully', {
        token: subscription.endpoint,
        title: notification.title,
        messageId: response,
        duration,
      });

      metrics.recordPushSent('firebase', 'success', duration / 1000);

      return {
        success: true,
        messageId: response,
        provider: this.name,
        timestamp: new Date(),
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('Firebase notification failed', {
        token: subscription.endpoint,
        title: notification.title,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      });

      metrics.recordPushSent('firebase', 'failed', duration / 1000);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: this.name,
        timestamp: new Date(),
      };
    }
  }

  async sendToTopic(topic: string, notification: PushNotification): Promise<PushResult> {
    const startTime = Date.now();

    try {
      if (!this.enabled) {
        throw new Error('Firebase provider is not enabled');
      }

      const message: admin.messaging.Message = {
        topic,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.image,
        },
        data: notification.data,
        android: {
          notification: {
            icon: notification.icon,
            color: '#4CAF50',
            clickAction: notification.url,
            tag: notification.tag,
            priority: 'high',
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: notification.title,
                body: notification.body,
              },
              badge: 1,
              sound: 'default',
              'mutable-content': 1,
            },
          },
        },
        webpush: {
          notification: {
            title: notification.title,
            body: notification.body,
            icon: notification.icon,
            badge: notification.badge,
            image: notification.image,
            tag: notification.tag,
            requireInteraction: notification.requireInteraction,
            silent: notification.silent,
            data: notification.data,
            actions: notification.actions?.map(action => ({
              action: action.action,
              title: action.title,
              icon: action.icon,
            })),
          },
          fcmOptions: {
            link: notification.url,
          },
        },
      };

      const response = await admin.messaging(this.app).send(message);
      const duration = Date.now() - startTime;

      logger.info('Firebase topic notification sent successfully', {
        topic,
        title: notification.title,
        messageId: response,
        duration,
      });

      metrics.recordPushSent('firebase', 'success', duration / 1000);

      return {
        success: true,
        messageId: response,
        provider: this.name,
        timestamp: new Date(),
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('Firebase topic notification failed', {
        topic,
        title: notification.title,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      });

      metrics.recordPushSent('firebase', 'failed', duration / 1000);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: this.name,
        timestamp: new Date(),
      };
    }
  }

  async subscribeToTopic(tokens: string[], topic: string): Promise<void> {
    try {
      if (!this.enabled) {
        throw new Error('Firebase provider is not enabled');
      }

      const response = await admin.messaging(this.app).subscribeToTopic(tokens, topic);
      
      logger.info('Firebase topic subscription successful', {
        topic,
        successCount: response.successCount,
        failureCount: response.failureCount,
      });

    } catch (error) {
      logger.error('Firebase topic subscription failed', {
        topic,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async unsubscribeFromTopic(tokens: string[], topic: string): Promise<void> {
    try {
      if (!this.enabled) {
        throw new Error('Firebase provider is not enabled');
      }

      const response = await admin.messaging(this.app).unsubscribeFromTopic(tokens, topic);
      
      logger.info('Firebase topic unsubscription successful', {
        topic,
        successCount: response.successCount,
        failureCount: response.failureCount,
      });

    } catch (error) {
      logger.error('Firebase topic unsubscription failed', {
        topic,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

export class PushProviderManager {
  private providers: IPushProvider[];

  constructor() {
    this.providers = [
      new WebPushProvider(),
      new FirebaseProvider(),
    ].filter(provider => provider.enabled);
  }

  async send(subscription: PushSubscription, notification: PushNotification, preferredProvider?: string): Promise<PushResult> {
    // Try preferred provider first
    if (preferredProvider) {
      const provider = this.providers.find(p => p.name === preferredProvider);
      if (provider) {
        const result = await provider.send(subscription, notification);
        if (result.success) {
          return result;
        }
      }
    }

    // Try all providers in order
    for (const provider of this.providers) {
      try {
        const result = await provider.send(subscription, notification);
        if (result.success) {
          return result;
        }
      } catch (error) {
        logger.warn(`Provider ${provider.name} failed, trying next`, {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // All providers failed
    return {
      success: false,
      error: 'All push providers failed',
      provider: 'unknown',
      timestamp: new Date(),
    };
  }

  async sendToMultiple(subscriptions: PushSubscription[], notification: PushNotification, preferredProvider?: string): Promise<PushResult[]> {
    const promises = subscriptions.map(subscription => 
      this.send(subscription, notification, preferredProvider)
    );
    return Promise.all(promises);
  }

  getProviders(): IPushProvider[] {
    return this.providers;
  }

  isProviderEnabled(providerName: string): boolean {
    return this.providers.some(p => p.name === providerName);
  }

  getFirebaseProvider(): FirebaseProvider | null {
    const provider = this.providers.find(p => p.name === 'firebase') as FirebaseProvider;
    return provider || null;
  }

  getWebPushProvider(): WebPushProvider | null {
    const provider = this.providers.find(p => p.name === 'web-push') as WebPushProvider;
    return provider || null;
  }
}
