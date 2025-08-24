import sgMail from '@sendgrid/mail';
import formData from 'form-data';
import Mailgun from 'mailgun.js';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import nodemailer from 'nodemailer';
import { 
  EmailNotification, 
  EmailResult, 
  EmailProvider as IEmailProvider 
} from '../types';
import { logger } from '../utils/logger';
import { metrics } from '../utils/metrics';
import { config } from '../config';

export class SendGridProvider implements IEmailProvider {
  name = 'sendgrid';
  enabled = config.email.sendgrid.enabled;

  constructor() {
    if (this.enabled && config.email.sendgrid.apiKey) {
      sgMail.setApiKey(config.email.sendgrid.apiKey);
    }
  }

  async send(notification: EmailNotification): Promise<EmailResult> {
    const startTime = Date.now();

    try {
      if (!this.enabled) {
        throw new Error('SendGrid provider is not enabled');
      }

      const msg = {
        to: notification.to,
        from: notification.from || config.email.sendgrid.fromEmail || 'noreply@memoriaeterna.com',
        subject: notification.subject,
        text: notification.text,
        html: notification.html,
        cc: notification.cc,
        bcc: notification.bcc,
        replyTo: notification.replyTo,
        attachments: notification.attachments?.map(att => ({
          filename: att.filename,
          content: att.content.toString('base64'),
          type: att.contentType,
          disposition: 'attachment',
          contentId: att.cid,
        })),
      };

      const response = await sgMail.send(msg);
      const duration = Date.now() - startTime;

      logger.info('SendGrid email sent successfully', {
        to: notification.to,
        subject: notification.subject,
        messageId: response[0]?.headers['x-message-id'],
        duration,
      });

      metrics.recordEmailSent('sendgrid', 'success', duration / 1000);

      return {
        success: true,
        messageId: response[0]?.headers['x-message-id'],
        provider: this.name,
        timestamp: new Date(),
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('SendGrid email failed', {
        to: notification.to,
        subject: notification.subject,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      });

      metrics.recordEmailSent('sendgrid', 'failed', duration / 1000);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: this.name,
        timestamp: new Date(),
      };
    }
  }
}

export class MailgunProvider implements IEmailProvider {
  name = 'mailgun';
  enabled = config.email.mailgun.enabled;
  private mailgun: any;

  constructor() {
    if (this.enabled && config.email.mailgun.apiKey && config.email.mailgun.domain) {
      this.mailgun = new Mailgun(formData).client({
        username: 'api',
        key: config.email.mailgun.apiKey,
      });
    }
  }

  async send(notification: EmailNotification): Promise<EmailResult> {
    const startTime = Date.now();

    try {
      if (!this.enabled) {
        throw new Error('Mailgun provider is not enabled');
      }

      const messageData = {
        from: notification.from || `${config.email.mailgun.fromEmail}@${config.email.mailgun.domain}`,
        to: Array.isArray(notification.to) ? notification.to.join(',') : notification.to,
        subject: notification.subject,
        text: notification.text,
        html: notification.html,
        cc: notification.cc ? (Array.isArray(notification.cc) ? notification.cc.join(',') : notification.cc) : undefined,
        bcc: notification.bcc ? (Array.isArray(notification.bcc) ? notification.bcc.join(',') : notification.bcc) : undefined,
        'h:Reply-To': notification.replyTo,
      };

      const response = await this.mailgun.messages.create(config.email.mailgun.domain!, messageData);
      const duration = Date.now() - startTime;

      logger.info('Mailgun email sent successfully', {
        to: notification.to,
        subject: notification.subject,
        messageId: response.id,
        duration,
      });

      metrics.recordEmailSent('mailgun', 'success', duration / 1000);

      return {
        success: true,
        messageId: response.id,
        provider: this.name,
        timestamp: new Date(),
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('Mailgun email failed', {
        to: notification.to,
        subject: notification.subject,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      });

      metrics.recordEmailSent('mailgun', 'failed', duration / 1000);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: this.name,
        timestamp: new Date(),
      };
    }
  }
}

export class SESProvider implements IEmailProvider {
  name = 'ses';
  enabled = config.email.ses.enabled;
  private sesClient: SESClient;

  constructor() {
    if (this.enabled && config.email.ses.region) {
      this.sesClient = new SESClient({
        region: config.email.ses.region,
        credentials: {
          accessKeyId: config.email.ses.accessKeyId!,
          secretAccessKey: config.email.ses.secretAccessKey!,
        },
      });
    }
  }

  async send(notification: EmailNotification): Promise<EmailResult> {
    const startTime = Date.now();

    try {
      if (!this.enabled) {
        throw new Error('AWS SES provider is not enabled');
      }

      const command = new SendEmailCommand({
        Source: notification.from || config.email.ses.fromEmail,
        Destination: {
          ToAddresses: Array.isArray(notification.to) ? notification.to : [notification.to],
          CcAddresses: notification.cc ? (Array.isArray(notification.cc) ? notification.cc : [notification.cc]) : undefined,
          BccAddresses: notification.bcc ? (Array.isArray(notification.bcc) ? notification.bcc : [notification.bcc]) : undefined,
        },
        Message: {
          Subject: {
            Data: notification.subject,
            Charset: 'UTF-8',
          },
          Body: {
            Text: notification.text ? {
              Data: notification.text,
              Charset: 'UTF-8',
            } : undefined,
            Html: notification.html ? {
              Data: notification.html,
              Charset: 'UTF-8',
            } : undefined,
          },
        },
        ReplyToAddresses: notification.replyTo ? [notification.replyTo] : undefined,
      });

      const response = await this.sesClient.send(command);
      const duration = Date.now() - startTime;

      logger.info('AWS SES email sent successfully', {
        to: notification.to,
        subject: notification.subject,
        messageId: response.MessageId,
        duration,
      });

      metrics.recordEmailSent('ses', 'success', duration / 1000);

      return {
        success: true,
        messageId: response.MessageId,
        provider: this.name,
        timestamp: new Date(),
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('AWS SES email failed', {
        to: notification.to,
        subject: notification.subject,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      });

      metrics.recordEmailSent('ses', 'failed', duration / 1000);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: this.name,
        timestamp: new Date(),
      };
    }
  }
}

export class SMTPProvider implements IEmailProvider {
  name = 'smtp';
  enabled = config.email.smtp.enabled;
  private transporter: nodemailer.Transporter;

  constructor() {
    if (this.enabled && config.email.smtp.host) {
      this.transporter = nodemailer.createTransporter({
        host: config.email.smtp.host,
        port: config.email.smtp.port,
        secure: config.email.smtp.secure,
        auth: config.email.smtp.auth,
      });
    }
  }

  async send(notification: EmailNotification): Promise<EmailResult> {
    const startTime = Date.now();

    try {
      if (!this.enabled) {
        throw new Error('SMTP provider is not enabled');
      }

      const mailOptions = {
        from: notification.from || config.email.smtp.auth?.user,
        to: notification.to,
        cc: notification.cc,
        bcc: notification.bcc,
        subject: notification.subject,
        text: notification.text,
        html: notification.html,
        replyTo: notification.replyTo,
        attachments: notification.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType,
          cid: att.cid,
        })),
      };

      const info = await this.transporter.sendMail(mailOptions);
      const duration = Date.now() - startTime;

      logger.info('SMTP email sent successfully', {
        to: notification.to,
        subject: notification.subject,
        messageId: info.messageId,
        duration,
      });

      metrics.recordEmailSent('smtp', 'success', duration / 1000);

      return {
        success: true,
        messageId: info.messageId,
        provider: this.name,
        timestamp: new Date(),
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('SMTP email failed', {
        to: notification.to,
        subject: notification.subject,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      });

      metrics.recordEmailSent('smtp', 'failed', duration / 1000);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: this.name,
        timestamp: new Date(),
      };
    }
  }
}

export class EmailProviderManager {
  private providers: IEmailProvider[];

  constructor() {
    this.providers = [
      new SendGridProvider(),
      new MailgunProvider(),
      new SESProvider(),
      new SMTPProvider(),
    ].filter(provider => provider.enabled);
  }

  async send(notification: EmailNotification, preferredProvider?: string): Promise<EmailResult> {
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
      error: 'All email providers failed',
      provider: 'unknown',
      timestamp: new Date(),
    };
  }

  getProviders(): IEmailProvider[] {
    return this.providers;
  }

  isProviderEnabled(providerName: string): boolean {
    return this.providers.some(p => p.name === providerName);
  }
}
