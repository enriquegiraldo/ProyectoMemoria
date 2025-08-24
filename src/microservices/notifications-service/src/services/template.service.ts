import Handlebars from 'handlebars';
import mjml2html from 'mjml';
import { 
  Template, 
  EmailNotification, 
  PushNotification, 
  SMSNotification, 
  WebhookNotification,
  TemplateRenderResult 
} from '../types';
import { logger, metrics } from '../utils';
import { TemplateError, TemplateNotFoundError, TemplateRenderError } from '../utils/errors';

// Register custom Handlebars helpers
Handlebars.registerHelper('formatDate', function(date: Date, format: string) {
  if (!date) return '';
  
  const d = new Date(date);
  switch (format) {
    case 'short':
      return d.toLocaleDateString();
    case 'long':
      return d.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    case 'time':
      return d.toLocaleTimeString();
    case 'datetime':
      return d.toLocaleString();
    default:
      return d.toISOString();
  }
});

Handlebars.registerHelper('formatCurrency', function(amount: number, currency: string = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
});

Handlebars.registerHelper('formatNumber', function(num: number, decimals: number = 2) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
});

Handlebars.registerHelper('uppercase', function(str: string) {
  return str ? str.toUpperCase() : '';
});

Handlebars.registerHelper('lowercase', function(str: string) {
  return str ? str.toLowerCase() : '';
});

Handlebars.registerHelper('capitalize', function(str: string) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
});

Handlebars.registerHelper('truncate', function(str: string, length: number) {
  if (!str || str.length <= length) return str;
  return str.substring(0, length) + '...';
});

Handlebars.registerHelper('ifEquals', function(arg1: any, arg2: any, options: any) {
  return arg1 === arg2 ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('ifNotEquals', function(arg1: any, arg2: any, options: any) {
  return arg1 !== arg2 ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('eachLimit', function(array: any[], limit: number, options: any) {
  if (!array || !Array.isArray(array)) return '';
  
  const limitedArray = array.slice(0, limit);
  let result = '';
  
  for (let i = 0; i < limitedArray.length; i++) {
    result += options.fn(limitedArray[i], { data: { index: i, first: i === 0, last: i === limitedArray.length - 1 } });
  }
  
  return result;
});

export class TemplateService {
  private templates: Map<string, HandlebarsTemplateDelegate> = new Map();
  private compiledTemplates: Map<string, any> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates() {
    // Default email templates
    this.registerDefaultTemplate('welcome-email', 'email', {
      subject: 'Welcome to Memoria Eterna, {{userName}}!',
      content: `
        <mjml>
          <mj-head>
            <mj-title>Welcome to Memoria Eterna</mj-title>
          </mj-head>
          <mj-body>
            <mj-section>
              <mj-column>
                <mj-text font-size="24px" color="#333" font-weight="bold">
                  Welcome, {{userName}}!
                </mj-text>
                <mj-text font-size="16px" color="#666" line-height="24px">
                  Thank you for joining Memoria Eterna. We're excited to help you preserve your precious memories.
                </mj-text>
                <mj-button href="{{activationUrl}}" background-color="#4CAF50" color="white">
                  Activate Your Account
                </mj-button>
              </mj-column>
            </mj-section>
          </mj-body>
        </mjml>
      `
    });

    this.registerDefaultTemplate('password-reset', 'email', {
      subject: 'Reset Your Password - Memoria Eterna',
      content: `
        <mjml>
          <mj-head>
            <mj-title>Password Reset</mj-title>
          </mj-head>
          <mj-body>
            <mj-section>
              <mj-column>
                <mj-text font-size="24px" color="#333" font-weight="bold">
                  Password Reset Request
                </mj-text>
                <mj-text font-size="16px" color="#666" line-height="24px">
                  You requested a password reset. Click the button below to create a new password.
                </mj-text>
                <mj-button href="{{resetUrl}}" background-color="#FF5722" color="white">
                  Reset Password
                </mj-button>
                <mj-text font-size="14px" color="#999">
                  This link will expire in {{expiryTime}}.
                </mj-text>
              </mj-column>
            </mj-section>
          </mj-body>
        </mjml>
      `
    });

    this.registerDefaultTemplate('memory-shared', 'email', {
      subject: '{{senderName}} shared a memory with you',
      content: `
        <mjml>
          <mj-head>
            <mj-title>Memory Shared</mj-title>
          </mj-head>
          <mj-body>
            <mj-section>
              <mj-column>
                <mj-text font-size="24px" color="#333" font-weight="bold">
                  {{senderName}} shared a memory with you
                </mj-text>
                <mj-text font-size="16px" color="#666" line-height="24px">
                  {{message}}
                </mj-text>
                <mj-button href="{{memoryUrl}}" background-color="#2196F3" color="white">
                  View Memory
                </mj-button>
              </mj-column>
            </mj-section>
          </mj-body>
        </mjml>
      `
    });

    // Default push templates
    this.registerDefaultTemplate('new-memory', 'push', {
      title: 'New Memory Added',
      body: '{{userName}} added a new memory: {{memoryTitle}}'
    });

    this.registerDefaultTemplate('memory-comment', 'push', {
      title: 'New Comment',
      body: '{{commenterName}} commented on your memory: {{commentText}}'
    });

    // Default SMS templates
    this.registerDefaultTemplate('verification-sms', 'sms', {
      body: 'Your Memoria Eterna verification code is: {{code}}. Valid for {{expiryTime}}.'
    });

    this.registerDefaultTemplate('alert-sms', 'sms', {
      body: 'Alert: {{alertMessage}}. Visit {{url}} for details.'
    });
  }

  private registerDefaultTemplate(name: string, type: string, template: any) {
    const templateId = `default-${name}`;
    const templateData: Template = {
      id: templateId,
      name: name,
      type: type as any,
      subject: template.subject,
      content: template.content,
      variables: this.extractVariables(template.content),
      metadata: {
        isDefault: true,
        category: 'system'
      }
    };

    this.compiledTemplates.set(templateId, templateData);
  }

  private extractVariables(content: string): any[] {
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const variables = new Set<string>();
    let match;

    while ((match = variableRegex.exec(content)) !== null) {
      const varName = match[1].trim();
      if (!varName.includes(' ')) { // Simple variable names only
        variables.add(varName);
      }
    }

    return Array.from(variables).map(name => ({
      name,
      type: 'string',
      required: false,
      description: `Variable: ${name}`
    }));
  }

  async registerTemplate(template: Template): Promise<void> {
    const startTime = Date.now();

    try {
      // Validate template
      if (!template.content) {
        throw new TemplateError('Template content is required');
      }

      // Compile Handlebars template
      const compiledTemplate = Handlebars.compile(template.content);
      this.templates.set(template.id!, compiledTemplate);
      this.compiledTemplates.set(template.id!, template);

      const duration = Date.now() - startTime;
      logger.info('Template registered successfully', {
        templateId: template.id,
        name: template.name,
        type: template.type,
        duration,
      });

      metrics.recordTemplateRender('register', 'success', duration / 1000);

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Template registration failed', {
        templateId: template.id,
        name: template.name,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      });

      metrics.recordTemplateRender('register', 'failed', duration / 1000);
      throw new TemplateRenderError(template.id!, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async renderTemplate(
    templateId: string, 
    data: Record<string, any>, 
    type: 'email' | 'push' | 'sms' | 'webhook'
  ): Promise<TemplateRenderResult> {
    const startTime = Date.now();

    try {
      const template = this.compiledTemplates.get(templateId);
      if (!template) {
        throw new TemplateNotFoundError(templateId);
      }

      if (template.type !== type) {
        throw new TemplateError(`Template type mismatch. Expected ${type}, got ${template.type}`);
      }

      const compiledTemplate = this.templates.get(templateId);
      if (!compiledTemplate) {
        throw new TemplateError('Template not compiled');
      }

      // Render the template
      let renderedContent = compiledTemplate(data);

      // Process based on template type
      let result: TemplateRenderResult = {
        success: true,
        content: renderedContent,
        subject: template.subject ? Handlebars.compile(template.subject)(data) : undefined,
        timestamp: new Date(),
      };

      // For email templates, convert MJML to HTML if needed
      if (type === 'email' && template.content.includes('<mjml>')) {
        const mjmlResult = mjml2html(renderedContent);
        if (mjmlResult.errors && mjmlResult.errors.length > 0) {
          logger.warn('MJML conversion warnings', {
            templateId,
            errors: mjmlResult.errors,
          });
        }
        result.content = mjmlResult.html;
      }

      const duration = Date.now() - startTime;
      logger.info('Template rendered successfully', {
        templateId,
        type,
        duration,
      });

      metrics.recordTemplateRender('render', 'success', duration / 1000);

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Template rendering failed', {
        templateId,
        type,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      });

      metrics.recordTemplateRender('render', 'failed', duration / 1000);
      throw new TemplateRenderError(templateId, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async renderNotification(
    notification: EmailNotification | PushNotification | SMSNotification | WebhookNotification,
    templateData: Record<string, any>
  ): Promise<EmailNotification | PushNotification | SMSNotification | WebhookNotification> {
    const startTime = Date.now();

    try {
      if (!notification.templateId) {
        throw new TemplateError('Notification does not have a template ID');
      }

      const result = await this.renderTemplate(
        notification.templateId,
        { ...templateData, ...notification.templateData },
        notification.type
      );

      // Apply rendered content to notification
      const renderedNotification = { ...notification };

      switch (notification.type) {
        case 'email':
          if (result.subject) {
            (renderedNotification as EmailNotification).subject = result.subject;
          }
          if (result.content) {
            (renderedNotification as EmailNotification).html = result.content;
          }
          break;

        case 'push':
          if (result.content) {
            const pushData = JSON.parse(result.content);
            (renderedNotification as PushNotification).title = pushData.title;
            (renderedNotification as PushNotification).body = pushData.body;
            if (pushData.data) {
              (renderedNotification as PushNotification).data = pushData.data;
            }
          }
          break;

        case 'sms':
          if (result.content) {
            (renderedNotification as SMSNotification).body = result.content;
          }
          break;

        case 'webhook':
          if (result.content) {
            (renderedNotification as WebhookNotification).payload = JSON.parse(result.content);
          }
          break;
      }

      const duration = Date.now() - startTime;
      logger.info('Notification template rendered successfully', {
        notificationId: notification.id,
        templateId: notification.templateId,
        type: notification.type,
        duration,
      });

      metrics.recordTemplateRender('notification', 'success', duration / 1000);

      return renderedNotification;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Notification template rendering failed', {
        notificationId: notification.id,
        templateId: notification.templateId,
        type: notification.type,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      });

      metrics.recordTemplateRender('notification', 'failed', duration / 1000);
      throw error;
    }
  }

  async getTemplate(templateId: string): Promise<Template | null> {
    return this.compiledTemplates.get(templateId) || null;
  }

  async listTemplates(type?: string): Promise<Template[]> {
    const templates = Array.from(this.compiledTemplates.values());
    return type ? templates.filter(t => t.type === type) : templates;
  }

  async deleteTemplate(templateId: string): Promise<void> {
    const template = this.compiledTemplates.get(templateId);
    if (!template) {
      throw new TemplateNotFoundError(templateId);
    }

    if (template.metadata?.isDefault) {
      throw new TemplateError('Cannot delete default templates');
    }

    this.templates.delete(templateId);
    this.compiledTemplates.delete(templateId);

    logger.info('Template deleted successfully', { templateId });
  }

  async updateTemplate(templateId: string, updates: Partial<Template>): Promise<Template> {
    const template = this.compiledTemplates.get(templateId);
    if (!template) {
      throw new TemplateNotFoundError(templateId);
    }

    if (template.metadata?.isDefault) {
      throw new TemplateError('Cannot update default templates');
    }

    const updatedTemplate = { ...template, ...updates, id: templateId };
    
    // Recompile if content changed
    if (updates.content) {
      const compiledTemplate = Handlebars.compile(updates.content);
      this.templates.set(templateId, compiledTemplate);
    }

    this.compiledTemplates.set(templateId, updatedTemplate);

    logger.info('Template updated successfully', { templateId });
    return updatedTemplate;
  }

  async validateTemplate(content: string, variables: any[]): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Try to compile the template
      Handlebars.compile(content);
    } catch (error) {
      errors.push(`Template compilation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Check for undefined variables
    const variableNames = variables.map(v => v.name);
    const contentVariables = this.extractVariables(content).map(v => v.name);
    
    const undefinedVariables = contentVariables.filter(v => !variableNames.includes(v));
    if (undefinedVariables.length > 0) {
      errors.push(`Undefined variables: ${undefinedVariables.join(', ')}`);
    }

    // Check for required variables
    const requiredVariables = variables.filter(v => v.required).map(v => v.name);
    const missingRequired = requiredVariables.filter(v => !contentVariables.includes(v));
    if (missingRequired.length > 0) {
      errors.push(`Missing required variables: ${missingRequired.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async previewTemplate(
    templateId: string, 
    data: Record<string, any>
  ): Promise<{ html?: string; text?: string; subject?: string }> {
    const template = this.compiledTemplates.get(templateId);
    if (!template) {
      throw new TemplateNotFoundError(templateId);
    }

    const result = await this.renderTemplate(templateId, data, template.type);

    if (template.type === 'email') {
      return {
        html: result.content,
        text: this.htmlToText(result.content),
        subject: result.subject
      };
    }

    return {
      text: result.content,
      subject: result.subject
    };
  }

  private htmlToText(html: string): string {
    // Simple HTML to text conversion
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&amp;/g, '&') // Replace &amp; with &
      .replace(/&lt;/g, '<') // Replace &lt; with <
      .replace(/&gt;/g, '>') // Replace &gt; with >
      .replace(/&quot;/g, '"') // Replace &quot; with "
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  }
}
