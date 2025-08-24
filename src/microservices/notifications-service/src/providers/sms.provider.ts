import twilio from 'twilio';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { 
  SMSNotification, 
  SMSResult, 
  SMSProvider as ISMSProvider 
} from '../types';
import { logger } from '../utils/logger';
import { metrics } from '../utils/metrics';
import { config } from '../config';

export class TwilioProvider implements ISMSProvider {
  name = 'twilio';
  enabled = config.sms.twilio.enabled;
  private client: twilio.Twilio;

  constructor() {
    if (this.enabled && config.sms.twilio.accountSid && config.sms.twilio.authToken) {
      this.client = twilio(config.sms.twilio.accountSid, config.sms.twilio.authToken);
    }
  }

  async send(notification: SMSNotification): Promise<SMSResult> {
    const startTime = Date.now();

    try {
      if (!this.enabled) {
        throw new Error('Twilio provider is not enabled');
      }

      const message = await this.client.messages.create({
        body: notification.body,
        from: notification.from || config.sms.twilio.fromNumber,
        to: notification.to,
        mediaUrl: notification.mediaUrl,
        statusCallback: notification.webhookUrl,
        maxPrice: notification.maxPrice,
        provideFeedback: notification.provideFeedback,
      });

      const duration = Date.now() - startTime;

      logger.info('Twilio SMS sent successfully', {
        to: notification.to,
        messageId: message.sid,
        status: message.status,
        duration,
      });

      metrics.recordSMSSent('twilio', 'success', duration / 1000);

      return {
        success: true,
        messageId: message.sid,
        provider: this.name,
        status: message.status,
        timestamp: new Date(),
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('Twilio SMS failed', {
        to: notification.to,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      });

      metrics.recordSMSSent('twilio', 'failed', duration / 1000);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: this.name,
        timestamp: new Date(),
      };
    }
  }

  async sendBulk(notifications: SMSNotification[]): Promise<SMSResult[]> {
    const promises = notifications.map(notification => this.send(notification));
    return Promise.all(promises);
  }

  async getMessageStatus(messageId: string): Promise<any> {
    try {
      if (!this.enabled) {
        throw new Error('Twilio provider is not enabled');
      }

      const message = await this.client.messages(messageId).fetch();
      return {
        sid: message.sid,
        status: message.status,
        direction: message.direction,
        from: message.from,
        to: message.to,
        body: message.body,
        dateCreated: message.dateCreated,
        dateUpdated: message.dateUpdated,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage,
      };
    } catch (error) {
      logger.error('Failed to get Twilio message status', {
        messageId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

export class SNSProvider implements ISMSProvider {
  name = 'sns';
  enabled = config.sms.sns.enabled;
  private snsClient: SNSClient;

  constructor() {
    if (this.enabled && config.sms.sns.region) {
      this.snsClient = new SNSClient({
        region: config.sms.sns.region,
        credentials: {
          accessKeyId: config.sms.sns.accessKeyId!,
          secretAccessKey: config.sms.sns.secretAccessKey!,
        },
      });
    }
  }

  async send(notification: SMSNotification): Promise<SMSResult> {
    const startTime = Date.now();

    try {
      if (!this.enabled) {
        throw new Error('AWS SNS provider is not enabled');
      }

      const command = new PublishCommand({
        Message: notification.body,
        PhoneNumber: notification.to,
        MessageAttributes: {
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: notification.smsType || 'Transactional',
          },
          'AWS.SNS.SMS.SenderID': {
            DataType: 'String',
            StringValue: notification.senderId || 'MemoriaEterna',
          },
          'AWS.SNS.SMS.MaxPrice': {
            DataType: 'String',
            StringValue: notification.maxPrice?.toString() || '0.50',
          },
        },
      });

      const response = await this.snsClient.send(command);
      const duration = Date.now() - startTime;

      logger.info('AWS SNS SMS sent successfully', {
        to: notification.to,
        messageId: response.MessageId,
        duration,
      });

      metrics.recordSMSSent('sns', 'success', duration / 1000);

      return {
        success: true,
        messageId: response.MessageId,
        provider: this.name,
        timestamp: new Date(),
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('AWS SNS SMS failed', {
        to: notification.to,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      });

      metrics.recordSMSSent('sns', 'failed', duration / 1000);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: this.name,
        timestamp: new Date(),
      };
    }
  }

  async sendBulk(notifications: SMSNotification[]): Promise<SMSResult[]> {
    const promises = notifications.map(notification => this.send(notification));
    return Promise.all(promises);
  }

  async sendToTopic(topicArn: string, notification: SMSNotification): Promise<SMSResult> {
    const startTime = Date.now();

    try {
      if (!this.enabled) {
        throw new Error('AWS SNS provider is not enabled');
      }

      const command = new PublishCommand({
        Message: notification.body,
        TopicArn: topicArn,
        MessageAttributes: {
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: notification.smsType || 'Transactional',
          },
          'AWS.SNS.SMS.SenderID': {
            DataType: 'String',
            StringValue: notification.senderId || 'MemoriaEterna',
          },
          'AWS.SNS.SMS.MaxPrice': {
            DataType: 'String',
            StringValue: notification.maxPrice?.toString() || '0.50',
          },
        },
      });

      const response = await this.snsClient.send(command);
      const duration = Date.now() - startTime;

      logger.info('AWS SNS topic SMS sent successfully', {
        topicArn,
        messageId: response.MessageId,
        duration,
      });

      metrics.recordSMSSent('sns', 'success', duration / 1000);

      return {
        success: true,
        messageId: response.MessageId,
        provider: this.name,
        timestamp: new Date(),
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('AWS SNS topic SMS failed', {
        topicArn,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      });

      metrics.recordSMSSent('sns', 'failed', duration / 1000);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: this.name,
        timestamp: new Date(),
      };
    }
  }
}

export class SMSProviderManager {
  private providers: ISMSProvider[];

  constructor() {
    this.providers = [
      new TwilioProvider(),
      new SNSProvider(),
    ].filter(provider => provider.enabled);
  }

  async send(notification: SMSNotification, preferredProvider?: string): Promise<SMSResult> {
    // Try preferred provider first
    if (preferredProvider) {
      const provider = this.providers.find(p => p.name === preferredProvider);
      if (provider) {
        const result = await provider.send(notification);
        if (result.success) {
          return result;
        }
      }
    }

    // Try all providers in order
    for (const provider of this.providers) {
      try {
        const result = await provider.send(notification);
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
      error: 'All SMS providers failed',
      provider: 'unknown',
      timestamp: new Date(),
    };
  }

  async sendBulk(notifications: SMSNotification[], preferredProvider?: string): Promise<SMSResult[]> {
    const promises = notifications.map(notification => 
      this.send(notification, preferredProvider)
    );
    return Promise.all(promises);
  }

  getProviders(): ISMSProvider[] {
    return this.providers;
  }

  isProviderEnabled(providerName: string): boolean {
    return this.providers.some(p => p.name === providerName);
  }

  getTwilioProvider(): TwilioProvider | null {
    const provider = this.providers.find(p => p.name === 'twilio') as TwilioProvider;
    return provider || null;
  }

  getSNSProvider(): SNSProvider | null {
    const provider = this.providers.find(p => p.name === 'sns') as SNSProvider;
    return provider || null;
  }
}
