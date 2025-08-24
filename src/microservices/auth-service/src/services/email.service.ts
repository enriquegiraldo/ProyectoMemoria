import nodemailer from 'nodemailer';
import { config } from '../config';
import { logger } from '../utils/logger';
import { CustomError, EmailError } from '../utils/errors';

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface WelcomeEmailData {
  email: string;
  firstName: string;
  lastName: string;
}

export interface VerificationEmailData {
  email: string;
  firstName: string;
  verificationToken: string;
}

export interface PasswordResetEmailData {
  email: string;
  firstName: string;
  resetToken: string;
}

export interface PasswordChangeNotificationData {
  email: string;
  firstName: string;
  ip: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = this.createTransporter();
  }

  /**
   * Create email transporter
   */
  private createTransporter(): nodemailer.Transporter {
    // For development, use a test account
    if (config.nodeEnv === 'development') {
      return nodemailer.createTransporter({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: 'test@example.com',
          pass: 'testpass',
        },
      });
    }

    // For production, use configured email service
    if (config.email.sendgrid?.apiKey) {
      // Use SendGrid
      return nodemailer.createTransporter({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: config.email.sendgrid.apiKey,
        },
      });
    } else if (config.email.mailgun?.apiKey) {
      // Use Mailgun
      return nodemailer.createTransporter({
        host: 'smtp.mailgun.org',
        port: 587,
        secure: false,
        auth: {
          user: config.email.mailgun.domain,
          pass: config.email.mailgun.apiKey,
        },
      });
    }

    // Fallback to console logging
    return nodemailer.createTransporter({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });
  }

  /**
   * Send email
   */
  async sendEmail(data: EmailData): Promise<void> {
    try {
      const mailOptions = {
        from: config.email.from || 'noreply@memoriaeterna.com',
        to: data.to,
        subject: data.subject,
        html: data.html,
        text: data.text || this.htmlToText(data.html),
      };

      const info = await this.transporter.sendMail(mailOptions);

      if (config.nodeEnv === 'development') {
        logger.info('Email sent (development mode)', {
          messageId: info.messageId,
          previewUrl: nodemailer.getTestMessageUrl(info),
        });
      } else {
        logger.info('Email sent successfully', {
          messageId: info.messageId,
          to: data.to,
          subject: data.subject,
        });
      }
    } catch (error) {
      logger.error('Failed to send email', {
        error: error instanceof Error ? error.message : error,
        to: data.to,
        subject: data.subject,
      });
      throw new EmailError('Failed to send email');
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
    const subject = '¡Bienvenido a Memoria Eterna!';
    const html = this.generateWelcomeEmail(data);

    await this.sendEmail({
      to: data.email,
      subject,
      html,
    });
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(data: VerificationEmailData): Promise<void> {
    const subject = 'Verifica tu cuenta de Memoria Eterna';
    const html = this.generateVerificationEmail(data);

    await this.sendEmail({
      to: data.email,
      subject,
      html,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(data: PasswordResetEmailData): Promise<void> {
    const subject = 'Restablece tu contraseña - Memoria Eterna';
    const html = this.generatePasswordResetEmail(data);

    await this.sendEmail({
      to: data.email,
      subject,
      html,
    });
  }

  /**
   * Send password change notification
   */
  async sendPasswordChangeNotification(data: PasswordChangeNotificationData): Promise<void> {
    const subject = 'Tu contraseña ha sido cambiada - Memoria Eterna';
    const html = this.generatePasswordChangeNotification(data);

    await this.sendEmail({
      to: data.email,
      subject,
      html,
    });
  }

  /**
   * Generate welcome email HTML
   */
  private generateWelcomeEmail(data: WelcomeEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>¡Bienvenido a Memoria Eterna!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Bienvenido a Memoria Eterna!</h1>
            <p>Preserva y comparte tus recuerdos más preciados</p>
          </div>
          <div class="content">
            <h2>Hola ${data.firstName} ${data.lastName},</h2>
            <p>¡Nos complace darte la bienvenida a Memoria Eterna! Tu cuenta ha sido creada exitosamente.</p>
            
            <p>Con Memoria Eterna podrás:</p>
            <ul>
              <li>📸 Subir y organizar fotos y videos</li>
              <li>📝 Escribir historias y anécdotas</li>
              <li>👥 Compartir recuerdos con familiares y amigos</li>
              <li>🔒 Mantener tus recuerdos seguros y privados</li>
              <li>📱 Acceder desde cualquier dispositivo</li>
            </ul>
            
            <p>Para comenzar a usar tu cuenta, necesitas verificar tu dirección de email. Te hemos enviado un email de verificación.</p>
            
            <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.</p>
            
            <p>Saludos,<br>El equipo de Memoria Eterna</p>
          </div>
          <div class="footer">
            <p>© 2024 Memoria Eterna. Todos los derechos reservados.</p>
            <p>Este email fue enviado a ${data.email}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate verification email HTML
   */
  private generateVerificationEmail(data: VerificationEmailData): string {
    const verificationUrl = `${config.frontendUrl}/verify-email?token=${data.verificationToken}`;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verifica tu cuenta - Memoria Eterna</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Verifica tu cuenta</h1>
            <p>Memoria Eterna</p>
          </div>
          <div class="content">
            <h2>Hola ${data.firstName},</h2>
            <p>Gracias por registrarte en Memoria Eterna. Para completar tu registro, necesitas verificar tu dirección de email.</p>
            
            <p>Haz clic en el botón de abajo para verificar tu cuenta:</p>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verificar mi cuenta</a>
            </div>
            
            <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
            
            <p>Este enlace expirará en 24 horas por razones de seguridad.</p>
            
            <p>Si no creaste esta cuenta, puedes ignorar este email.</p>
            
            <p>Saludos,<br>El equipo de Memoria Eterna</p>
          </div>
          <div class="footer">
            <p>© 2024 Memoria Eterna. Todos los derechos reservados.</p>
            <p>Este email fue enviado a ${data.email}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate password reset email HTML
   */
  private generatePasswordResetEmail(data: PasswordResetEmailData): string {
    const resetUrl = `${config.frontendUrl}/reset-password?token=${data.resetToken}`;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Restablece tu contraseña - Memoria Eterna</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Restablece tu contraseña</h1>
            <p>Memoria Eterna</p>
          </div>
          <div class="content">
            <h2>Hola ${data.firstName},</h2>
            <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta de Memoria Eterna.</p>
            
            <p>Haz clic en el botón de abajo para crear una nueva contraseña:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Restablecer contraseña</a>
            </div>
            
            <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
            
            <p>Este enlace expirará en 1 hora por razones de seguridad.</p>
            
            <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este email. Tu contraseña actual permanecerá sin cambios.</p>
            
            <p>Saludos,<br>El equipo de Memoria Eterna</p>
          </div>
          <div class="footer">
            <p>© 2024 Memoria Eterna. Todos los derechos reservados.</p>
            <p>Este email fue enviado a ${data.email}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate password change notification HTML
   */
  private generatePasswordChangeNotification(data: PasswordChangeNotificationData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Contraseña cambiada - Memoria Eterna</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .alert { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Contraseña cambiada</h1>
            <p>Memoria Eterna</p>
          </div>
          <div class="content">
            <h2>Hola ${data.firstName},</h2>
            <p>Tu contraseña de Memoria Eterna ha sido cambiada exitosamente.</p>
            
            <div class="alert">
              <strong>Detalles del cambio:</strong><br>
              📅 Fecha: ${new Date().toLocaleDateString()}<br>
              🕒 Hora: ${new Date().toLocaleTimeString()}<br>
              🌐 IP: ${data.ip}
            </div>
            
            <p>Si realizaste este cambio, no necesitas hacer nada más.</p>
            
            <p>Si no cambiaste tu contraseña, por favor:</p>
            <ol>
              <li>Cambia tu contraseña inmediatamente</li>
              <li>Revisa la actividad de tu cuenta</li>
              <li>Contacta nuestro equipo de soporte</li>
            </ol>
            
            <p>Saludos,<br>El equipo de Memoria Eterna</p>
          </div>
          <div class="footer">
            <p>© 2024 Memoria Eterna. Todos los derechos reservados.</p>
            <p>Este email fue enviado a ${data.email}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Convert HTML to plain text
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }
}

