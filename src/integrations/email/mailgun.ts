// src/integrations/email/mailgun.ts
import formData from 'form-data';
import Mailgun from 'mailgun.js';

export interface MailgunEmail {
  to: string | string[];
  from?: string;
  subject: string;
  text?: string;
  html?: string;
  template?: string;
  'h:X-Mailgun-Variables'?: string;
  attachments?: Array<{
    data: Buffer;
    filename: string;
    contentType?: string;
  }>;
}

export interface MailgunTemplate {
  name: string;
  description: string;
  version: {
    tag: string;
    template: string;
    engine: string;
    mjml: string;
  };
}

export interface MailgunDomain {
  name: string;
  web_scheme: string;
  sending_dns_records: Array<{
    record_type: string;
    valid: string;
    name: string;
    value: string;
  }>;
  receiving_dns_records: Array<{
    record_type: string;
    valid: string;
    name: string;
    value: string;
  }>;
  require_tls: boolean;
  skip_verification: boolean;
  state: string;
  wildcard: boolean;
  spam_action: string;
  created_at: string;
  smtp_password: string;
  smtp_login: string;
  type: string;
}

export interface MailgunEvent {
  event: string;
  timestamp: number;
  message: {
    headers: {
      from: string;
      to: string;
      subject: string;
      'message-id': string;
    };
    attachments: any[];
    size: number;
  };
  recipient: string;
  domain: string;
  ip: string;
  country: string;
  region: string;
  city: string;
  user_agent: string;
  device_type: string;
  client_type: string;
  client_name: string;
  client_os: string;
  user_agent_parsed: {
    client_type: string;
    client_name: string;
    client_os: string;
    device_type: string;
    user_agent_family: string;
  };
}

export class MailgunIntegration {
  private apiKey: string;
  private domain: string;
  private fromEmail: string;
  private fromName: string;
  private mailgun: Mailgun;
  private client: any;

  constructor() {
    this.apiKey = process.env.MAILGUN_API_KEY || '';
    this.domain = process.env.MAILGUN_DOMAIN || '';
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@memoriaeterna.com';
    this.fromName = process.env.EMAIL_FROM_NAME || 'Memoria Eterna';
    
    if (!this.apiKey || !this.domain) {
      throw new Error('Mailgun credentials not configured');
    }

    this.mailgun = new Mailgun(formData);
    this.client = this.mailgun.client({ username: 'api', key: this.apiKey });
  }

  /**
   * Send a simple email
   */
  async sendEmail(emailData: MailgunEmail): Promise<boolean> {
    try {
      const messageData = {
        from: `${this.fromName} <${this.fromEmail}>`,
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html,
        template: emailData.template,
        'h:X-Mailgun-Variables': emailData['h:X-Mailgun-Variables'],
      };

      const response = await this.client.messages.create(this.domain, messageData);
      return response.status === 200;
    } catch (error) {
      console.error('Mailgun send email error:', error);
      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send a welcome email
   */
  async sendWelcomeEmail(
    to: string,
    userName: string,
    template?: string
  ): Promise<boolean> {
    const emailData: MailgunEmail = {
      to,
      from: `${this.fromName} <${this.fromEmail}>`,
      subject: '¡Bienvenido a Memoria Eterna!',
      text: `Hola ${userName},\n\n¡Bienvenido a Memoria Eterna! Estamos emocionados de que te unas a nuestra comunidad para preservar y compartir recuerdos especiales.\n\nComienza creando tu primera memoria hoy mismo.\n\nSaludos,\nEl equipo de Memoria Eterna`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">¡Bienvenido a Memoria Eterna!</h2>
          <p>Hola <strong>${userName}</strong>,</p>
          <p>¡Bienvenido a Memoria Eterna! Estamos emocionados de que te unas a nuestra comunidad para preservar y compartir recuerdos especiales.</p>
          <p>Comienza creando tu primera memoria hoy mismo.</p>
          <p>Saludos,<br>El equipo de Memoria Eterna</p>
        </div>
      `,
      template,
      'h:X-Mailgun-Variables': JSON.stringify({
        userName,
        appName: 'Memoria Eterna',
        appUrl: process.env.NEXT_PUBLIC_APP_URL,
      }),
    };

    return this.sendEmail(emailData);
  }

  /**
   * Send a memory reminder email
   */
  async sendMemoryReminder(
    to: string,
    userName: string,
    memoryTitle: string,
    memoryDate: string,
    memoryUrl: string,
    template?: string
  ): Promise<boolean> {
    const emailData: MailgunEmail = {
      to,
      from: `${this.fromName} <${this.fromEmail}>`,
      subject: `Recordatorio: ${memoryTitle}`,
      text: `Hola ${userName},\n\nTe recordamos que hoy es el aniversario de "${memoryTitle}" (${memoryDate}).\n\nVisita tu memoria para recordar este momento especial: ${memoryUrl}\n\nSaludos,\nEl equipo de Memoria Eterna`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Recordatorio de Memoria</h2>
          <p>Hola <strong>${userName}</strong>,</p>
          <p>Te recordamos que hoy es el aniversario de <strong>"${memoryTitle}"</strong> (${memoryDate}).</p>
          <p><a href="${memoryUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Ver Memoria</a></p>
          <p>Saludos,<br>El equipo de Memoria Eterna</p>
        </div>
      `,
      template,
      'h:X-Mailgun-Variables': JSON.stringify({
        userName,
        memoryTitle,
        memoryDate,
        memoryUrl,
        appName: 'Memoria Eterna',
      }),
    };

    return this.sendEmail(emailData);
  }

  /**
   * Send a newsletter email
   */
  async sendNewsletter(
    to: string[],
    subject: string,
    content: string,
    template?: string
  ): Promise<boolean> {
    const emailData: MailgunEmail = {
      to,
      from: `${this.fromName} <${this.fromEmail}>`,
      subject,
      html: content,
      template,
      'h:X-Mailgun-Variables': JSON.stringify({
        content,
        appName: 'Memoria Eterna',
        appUrl: process.env.NEXT_PUBLIC_APP_URL,
      }),
    };

    return this.sendEmail(emailData);
  }

  /**
   * Send a password reset email
   */
  async sendPasswordReset(
    to: string,
    userName: string,
    resetUrl: string,
    template?: string
  ): Promise<boolean> {
    const emailData: MailgunEmail = {
      to,
      from: `${this.fromName} <${this.fromEmail}>`,
      subject: 'Restablecer Contraseña - Memoria Eterna',
      text: `Hola ${userName},\n\nHas solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para continuar:\n\n${resetUrl}\n\nEste enlace expirará en 1 hora.\n\nSi no solicitaste este cambio, puedes ignorar este email.\n\nSaludos,\nEl equipo de Memoria Eterna`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Restablecer Contraseña</h2>
          <p>Hola <strong>${userName}</strong>,</p>
          <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente botón para continuar:</p>
          <p><a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Restablecer Contraseña</a></p>
          <p><small>Este enlace expirará en 1 hora.</small></p>
          <p>Si no solicitaste este cambio, puedes ignorar este email.</p>
          <p>Saludos,<br>El equipo de Memoria Eterna</p>
        </div>
      `,
      template,
      'h:X-Mailgun-Variables': JSON.stringify({
        userName,
        resetUrl,
        appName: 'Memoria Eterna',
      }),
    };

    return this.sendEmail(emailData);
  }

  /**
   * Send an email verification
   */
  async sendEmailVerification(
    to: string,
    userName: string,
    verificationUrl: string,
    template?: string
  ): Promise<boolean> {
    const emailData: MailgunEmail = {
      to,
      from: `${this.fromName} <${this.fromEmail}>`,
      subject: 'Verificar Email - Memoria Eterna',
      text: `Hola ${userName},\n\nGracias por registrarte en Memoria Eterna. Por favor, verifica tu dirección de email haciendo clic en el siguiente enlace:\n\n${verificationUrl}\n\nSaludos,\nEl equipo de Memoria Eterna`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Verificar Email</h2>
          <p>Hola <strong>${userName}</strong>,</p>
          <p>Gracias por registrarte en Memoria Eterna. Por favor, verifica tu dirección de email haciendo clic en el siguiente botón:</p>
          <p><a href="${verificationUrl}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verificar Email</a></p>
          <p>Saludos,<br>El equipo de Memoria Eterna</p>
        </div>
      `,
      template,
      'h:X-Mailgun-Variables': JSON.stringify({
        userName,
        verificationUrl,
        appName: 'Memoria Eterna',
      }),
    };

    return this.sendEmail(emailData);
  }

  /**
   * Send a subscription confirmation email
   */
  async sendSubscriptionConfirmation(
    to: string,
    userName: string,
    planName: string,
    amount: string,
    template?: string
  ): Promise<boolean> {
    const emailData: MailgunEmail = {
      to,
      from: `${this.fromName} <${this.fromEmail}>`,
      subject: 'Confirmación de Suscripción - Memoria Eterna',
      text: `Hola ${userName},\n\nGracias por suscribirte al plan ${planName} de Memoria Eterna.\n\nDetalles de la suscripción:\n- Plan: ${planName}\n- Monto: ${amount}\n\nYa puedes disfrutar de todas las funcionalidades premium.\n\nSaludos,\nEl equipo de Memoria Eterna`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Confirmación de Suscripción</h2>
          <p>Hola <strong>${userName}</strong>,</p>
          <p>Gracias por suscribirte al plan <strong>${planName}</strong> de Memoria Eterna.</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>Detalles de la suscripción:</h3>
            <p><strong>Plan:</strong> ${planName}</p>
            <p><strong>Monto:</strong> ${amount}</p>
          </div>
          <p>Ya puedes disfrutar de todas las funcionalidades premium.</p>
          <p>Saludos,<br>El equipo de Memoria Eterna</p>
        </div>
      `,
      template,
      'h:X-Mailgun-Variables': JSON.stringify({
        userName,
        planName,
        amount,
        appName: 'Memoria Eterna',
      }),
    };

    return this.sendEmail(emailData);
  }

  /**
   * Send a memory shared notification
   */
  async sendMemorySharedNotification(
    to: string,
    userName: string,
    sharedBy: string,
    memoryTitle: string,
    memoryUrl: string,
    template?: string
  ): Promise<boolean> {
    const emailData: MailgunEmail = {
      to,
      from: `${this.fromName} <${this.fromEmail}>`,
      subject: `${sharedBy} ha compartido una memoria contigo`,
      text: `Hola ${userName},\n\n${sharedBy} ha compartido la memoria "${memoryTitle}" contigo en Memoria Eterna.\n\nPuedes verla aquí: ${memoryUrl}\n\nSaludos,\nEl equipo de Memoria Eterna`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Memoria Compartida</h2>
          <p>Hola <strong>${userName}</strong>,</p>
          <p><strong>${sharedBy}</strong> ha compartido la memoria <strong>"${memoryTitle}"</strong> contigo en Memoria Eterna.</p>
          <p><a href="${memoryUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Ver Memoria</a></p>
          <p>Saludos,<br>El equipo de Memoria Eterna</p>
        </div>
      `,
      template,
      'h:X-Mailgun-Variables': JSON.stringify({
        userName,
        sharedBy,
        memoryTitle,
        memoryUrl,
        appName: 'Memoria Eterna',
      }),
    };

    return this.sendEmail(emailData);
  }

  /**
   * Send a bulk email to multiple recipients
   */
  async sendBulkEmail(
    recipients: Array<{ email: string; name?: string; customData?: Record<string, any> }>,
    subject: string,
    content: string,
    template?: string
  ): Promise<boolean> {
    try {
      const to = recipients.map(r => r.email).join(',');
      const variables = recipients.reduce((acc, recipient, index) => {
        acc[recipient.email] = {
          ...recipient.customData,
          userName: recipient.name,
          appName: 'Memoria Eterna',
          appUrl: process.env.NEXT_PUBLIC_APP_URL,
        };
        return acc;
      }, {} as Record<string, any>);

      const emailData: MailgunEmail = {
        to,
        from: `${this.fromName} <${this.fromEmail}>`,
        subject,
        html: content,
        template,
        'h:X-Mailgun-Variables': JSON.stringify(variables),
      };

      return this.sendEmail(emailData);
    } catch (error) {
      console.error('Mailgun bulk email error:', error);
      throw new Error(`Failed to send bulk email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get email templates from Mailgun
   */
  async getTemplates(): Promise<MailgunTemplate[]> {
    try {
      const response = await this.client.templates.get(this.domain);
      return response.templates || [];
    } catch (error) {
      console.error('Mailgun get templates error:', error);
      throw new Error(`Failed to get templates: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new email template
   */
  async createTemplate(
    name: string,
    description: string,
    template: string
  ): Promise<boolean> {
    try {
      const templateData = {
        name,
        description,
        template,
      };

      await this.client.templates.create(this.domain, templateData);
      return true;
    } catch (error) {
      console.error('Mailgun create template error:', error);
      throw new Error(`Failed to create template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update an existing email template
   */
  async updateTemplate(
    name: string,
    description: string,
    template: string
  ): Promise<boolean> {
    try {
      const templateData = {
        description,
        template,
      };

      await this.client.templates.update(this.domain, name, templateData);
      return true;
    } catch (error) {
      console.error('Mailgun update template error:', error);
      throw new Error(`Failed to update template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete an email template
   */
  async deleteTemplate(name: string): Promise<boolean> {
    try {
      await this.client.templates.destroy(this.domain, name);
      return true;
    } catch (error) {
      console.error('Mailgun delete template error:', error);
      throw new Error(`Failed to delete template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get domain information
   */
  async getDomain(): Promise<MailgunDomain> {
    try {
      const response = await this.client.domains.get(this.domain);
      return response.domain;
    } catch (error) {
      console.error('Mailgun get domain error:', error);
      throw new Error(`Failed to get domain: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get email events
   */
  async getEvents(
    event?: string,
    limit: number = 100,
    page?: string
  ): Promise<MailgunEvent[]> {
    try {
      const queryParams: any = {
        limit,
      };

      if (event) {
        queryParams.event = event;
      }

      if (page) {
        queryParams.page = page;
      }

      const response = await this.client.events.get(this.domain, queryParams);
      return response.items || [];
    } catch (error) {
      console.error('Mailgun get events error:', error);
      throw new Error(`Failed to get events: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get email statistics
   */
  async getStats(
    event?: string,
    startDate?: string,
    endDate?: string,
    resolution?: string
  ): Promise<any> {
    try {
      const queryParams: any = {};

      if (event) {
        queryParams.event = event;
      }

      if (startDate) {
        queryParams.start = startDate;
      }

      if (endDate) {
        queryParams.end = endDate;
      }

      if (resolution) {
        queryParams.resolution = resolution;
      }

      const response = await this.client.stats.get(this.domain, queryParams);
      return response.stats || [];
    } catch (error) {
      console.error('Mailgun get stats error:', error);
      throw new Error(`Failed to get stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate an email address
   */
  async validateEmail(email: string): Promise<boolean> {
    try {
      const response = await this.client.validation.get(email);
      return response.is_valid;
    } catch (error) {
      console.error('Mailgun validate email error:', error);
      return false;
    }
  }
}

export const mailgunIntegration = new MailgunIntegration();
