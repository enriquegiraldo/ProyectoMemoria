// src/integrations/email/sendgrid.ts
import sgMail from '@sendgrid/mail';

export interface SendGridEmail {
  to: string | string[];
  from: string;
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
  attachments?: Array<{
    content: string;
    filename: string;
    type: string;
    disposition?: string;
  }>;
}

export interface SendGridTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  plain_content: string;
  active: number;
}

export interface SendGridContact {
  email: string;
  first_name?: string;
  last_name?: string;
  custom_fields?: Record<string, any>;
}

export interface SendGridList {
  id: string;
  name: string;
  contact_count: number;
}

export class SendGridIntegration {
  private apiKey: string;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY || '';
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@memoriaeterna.com';
    this.fromName = process.env.EMAIL_FROM_NAME || 'Memoria Eterna';
    
    if (!this.apiKey) {
      throw new Error('SendGrid API key not configured');
    }

    sgMail.setApiKey(this.apiKey);
  }

  /**
   * Send a simple email
   */
  async sendEmail(emailData: SendGridEmail): Promise<boolean> {
    try {
      const msg = {
        to: emailData.to,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html,
        templateId: emailData.templateId,
        dynamicTemplateData: emailData.dynamicTemplateData,
        attachments: emailData.attachments,
      };

      await sgMail.send(msg);
      return true;
    } catch (error) {
      console.error('SendGrid send email error:', error);
      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send a welcome email
   */
  async sendWelcomeEmail(
    to: string,
    userName: string,
    templateId?: string
  ): Promise<boolean> {
    const emailData: SendGridEmail = {
      to,
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
      templateId,
      dynamicTemplateData: {
        userName,
        appName: 'Memoria Eterna',
        appUrl: process.env.NEXT_PUBLIC_APP_URL,
      },
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
    templateId?: string
  ): Promise<boolean> {
    const emailData: SendGridEmail = {
      to,
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
      templateId,
      dynamicTemplateData: {
        userName,
        memoryTitle,
        memoryDate,
        memoryUrl,
        appName: 'Memoria Eterna',
      },
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
    templateId?: string
  ): Promise<boolean> {
    const emailData: SendGridEmail = {
      to,
      subject,
      html: content,
      templateId,
      dynamicTemplateData: {
        content,
        appName: 'Memoria Eterna',
        appUrl: process.env.NEXT_PUBLIC_APP_URL,
      },
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
    templateId?: string
  ): Promise<boolean> {
    const emailData: SendGridEmail = {
      to,
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
      templateId,
      dynamicTemplateData: {
        userName,
        resetUrl,
        appName: 'Memoria Eterna',
      },
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
    templateId?: string
  ): Promise<boolean> {
    const emailData: SendGridEmail = {
      to,
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
      templateId,
      dynamicTemplateData: {
        userName,
        verificationUrl,
        appName: 'Memoria Eterna',
      },
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
    templateId?: string
  ): Promise<boolean> {
    const emailData: SendGridEmail = {
      to,
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
      templateId,
      dynamicTemplateData: {
        userName,
        planName,
        amount,
        appName: 'Memoria Eterna',
      },
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
    templateId?: string
  ): Promise<boolean> {
    const emailData: SendGridEmail = {
      to,
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
      templateId,
      dynamicTemplateData: {
        userName,
        sharedBy,
        memoryTitle,
        memoryUrl,
        appName: 'Memoria Eterna',
      },
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
    templateId?: string
  ): Promise<boolean> {
    try {
      const messages = recipients.map(recipient => ({
        to: recipient.email,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject,
        html: content,
        templateId,
        dynamicTemplateData: {
          ...recipient.customData,
          userName: recipient.name,
          appName: 'Memoria Eterna',
          appUrl: process.env.NEXT_PUBLIC_APP_URL,
        },
      }));

      await sgMail.send(messages);
      return true;
    } catch (error) {
      console.error('SendGrid bulk email error:', error);
      throw new Error(`Failed to send bulk email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get email templates from SendGrid
   */
  async getTemplates(): Promise<SendGridTemplate[]> {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/templates', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get templates: ${response.statusText}`);
      }

      const data = await response.json();
      return data.templates || [];
    } catch (error) {
      console.error('SendGrid get templates error:', error);
      throw new Error(`Failed to get templates: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add contact to a list
   */
  async addContactToList(
    contact: SendGridContact,
    listId: string
  ): Promise<boolean> {
    try {
      const response = await fetch(`https://api.sendgrid.com/v3/marketing/contacts`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contacts: [contact],
          list_ids: [listId],
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to add contact: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('SendGrid add contact error:', error);
      throw new Error(`Failed to add contact: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get lists from SendGrid
   */
  async getLists(): Promise<SendGridList[]> {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/marketing/lists', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get lists: ${response.statusText}`);
      }

      const data = await response.json();
      return data.result || [];
    } catch (error) {
      console.error('SendGrid get lists error:', error);
      throw new Error(`Failed to get lists: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const sendGridIntegration = new SendGridIntegration();
