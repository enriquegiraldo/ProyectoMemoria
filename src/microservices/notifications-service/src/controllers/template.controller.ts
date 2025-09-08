import { Request, Response } from 'express';
import { Template, TemplateRenderResult } from '../types';
import { TemplateService } from '../services';
import { logger, metrics } from '../utils';
import { 
  ValidationError, 
  TemplateError,
  TemplateNotFoundError,
  formatErrorResponse 
} from '../utils/errors';
import { 
  createTemplateRequestSchema,
  updateTemplateRequestSchema,
  templateQuerySchema 
} from '../utils/validation';

export class TemplateController {
  private templateService: TemplateService;

  constructor(templateService: TemplateService) {
    this.templateService = templateService;
  }

  /**
   * Create a new template
   * POST /api/templates
   */
  async createTemplate(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      // Validate request body
      const validationResult = createTemplateRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ValidationError('Invalid request body', validationResult.error.errors);
      }

      const template = validationResult.data;

      // Register template
      await this.templateService.registerTemplate(template);

      const duration = Date.now() - startTime;
      metrics.recordHttpRequest('POST', '/api/templates', duration / 1000);

      res.status(201).json({
        success: true,
        data: template,
        message: 'Template created successfully',
        timestamp: new Date(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResponse = formatErrorResponse(error);
      
      logger.error('Create template failed', {
        error: errorResponse.message,
        duration,
        templateName: req.body?.name,
        templateType: req.body?.type,
      });

      metrics.recordHttpRequest('POST', '/api/templates', duration / 1000);
      metrics.recordError('template', 'create_failed');

      res.status(errorResponse.statusCode).json(errorResponse);
    }
  }

  /**
   * Get a template by ID
   * GET /api/templates/:id
   */
  async getTemplate(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError('Template ID is required');
      }

      // Get template
      const template = await this.templateService.getTemplate(id);

      if (!template) {
        throw new TemplateNotFoundError(id);
      }

      const duration = Date.now() - startTime;
      metrics.recordHttpRequest('GET', '/api/templates/:id', duration / 1000);

      res.status(200).json({
        success: true,
        data: template,
        message: 'Template retrieved successfully',
        timestamp: new Date(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResponse = formatErrorResponse(error);
      
      logger.error('Get template failed', {
        error: errorResponse.message,
        duration,
        templateId: req.params.id,
      });

      metrics.recordHttpRequest('GET', '/api/templates/:id', duration / 1000);
      metrics.recordError('template', 'get_failed');

      res.status(errorResponse.statusCode).json(errorResponse);
    }
  }

  /**
   * List templates
   * GET /api/templates
   */
  async listTemplates(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const { type } = req.query;

      // Validate query parameters
      const validationResult = templateQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        throw new ValidationError('Invalid query parameters', validationResult.error.errors);
      }

      // List templates
      const templates = await this.templateService.listTemplates(type as string);

      const duration = Date.now() - startTime;
      metrics.recordHttpRequest('GET', '/api/templates', duration / 1000);

      res.status(200).json({
        success: true,
        data: {
          templates,
          count: templates.length,
        },
        message: 'Templates retrieved successfully',
        timestamp: new Date(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResponse = formatErrorResponse(error);
      
      logger.error('List templates failed', {
        error: errorResponse.message,
        duration,
        type: req.query.type,
      });

      metrics.recordHttpRequest('GET', '/api/templates', duration / 1000);
      metrics.recordError('template', 'list_failed');

      res.status(errorResponse.statusCode).json(errorResponse);
    }
  }

  /**
   * Update a template
   * PUT /api/templates/:id
   */
  async updateTemplate(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError('Template ID is required');
      }

      // Validate request body
      const validationResult = updateTemplateRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ValidationError('Invalid request body', validationResult.error.errors);
      }

      const updates = validationResult.data;

      // Update template
      const updatedTemplate = await this.templateService.updateTemplate(id, updates);

      const duration = Date.now() - startTime;
      metrics.recordHttpRequest('PUT', '/api/templates/:id', duration / 1000);

      res.status(200).json({
        success: true,
        data: updatedTemplate,
        message: 'Template updated successfully',
        timestamp: new Date(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResponse = formatErrorResponse(error);
      
      logger.error('Update template failed', {
        error: errorResponse.message,
        duration,
        templateId: req.params.id,
      });

      metrics.recordHttpRequest('PUT', '/api/templates/:id', duration / 1000);
      metrics.recordError('template', 'update_failed');

      res.status(errorResponse.statusCode).json(errorResponse);
    }
  }

  /**
   * Delete a template
   * DELETE /api/templates/:id
   */
  async deleteTemplate(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError('Template ID is required');
      }

      // Delete template
      await this.templateService.deleteTemplate(id);

      const duration = Date.now() - startTime;
      metrics.recordHttpRequest('DELETE', '/api/templates/:id', duration / 1000);

      res.status(200).json({
        success: true,
        message: 'Template deleted successfully',
        timestamp: new Date(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResponse = formatErrorResponse(error);
      
      logger.error('Delete template failed', {
        error: errorResponse.message,
        duration,
        templateId: req.params.id,
      });

      metrics.recordHttpRequest('DELETE', '/api/templates/:id', duration / 1000);
      metrics.recordError('template', 'delete_failed');

      res.status(errorResponse.statusCode).json(errorResponse);
    }
  }

  /**
   * Render a template
   * POST /api/templates/:id/render
   */
  async renderTemplate(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const { id } = req.params;
      const { data } = req.body;

      if (!id) {
        throw new ValidationError('Template ID is required');
      }

      if (!data || typeof data !== 'object') {
        throw new ValidationError('Template data is required and must be an object');
      }

      // Get template to determine type
      const template = await this.templateService.getTemplate(id);
      if (!template) {
        throw new TemplateNotFoundError(id);
      }

      // Render template
      const result = await this.templateService.renderTemplate(id, data, template.type);

      const duration = Date.now() - startTime;
      metrics.recordHttpRequest('POST', '/api/templates/:id/render', duration / 1000);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Template rendered successfully',
        timestamp: new Date(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResponse = formatErrorResponse(error);
      
      logger.error('Render template failed', {
        error: errorResponse.message,
        duration,
        templateId: req.params.id,
      });

      metrics.recordHttpRequest('POST', '/api/templates/:id/render', duration / 1000);
      metrics.recordError('template', 'render_failed');

      res.status(errorResponse.statusCode).json(errorResponse);
    }
  }

  /**
   * Preview a template
   * POST /api/templates/:id/preview
   */
  async previewTemplate(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const { id } = req.params;
      const { data } = req.body;

      if (!id) {
        throw new ValidationError('Template ID is required');
      }

      if (!data || typeof data !== 'object') {
        throw new ValidationError('Template data is required and must be an object');
      }

      // Preview template
      const preview = await this.templateService.previewTemplate(id, data);

      const duration = Date.now() - startTime;
      metrics.recordHttpRequest('POST', '/api/templates/:id/preview', duration / 1000);

      res.status(200).json({
        success: true,
        data: preview,
        message: 'Template preview generated successfully',
        timestamp: new Date(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResponse = formatErrorResponse(error);
      
      logger.error('Preview template failed', {
        error: errorResponse.message,
        duration,
        templateId: req.params.id,
      });

      metrics.recordHttpRequest('POST', '/api/templates/:id/preview', duration / 1000);
      metrics.recordError('template', 'preview_failed');

      res.status(errorResponse.statusCode).json(errorResponse);
    }
  }

  /**
   * Validate a template
   * POST /api/templates/validate
   */
  async validateTemplate(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const { content, variables } = req.body;

      if (!content || typeof content !== 'string') {
        throw new ValidationError('Template content is required and must be a string');
      }

      if (!variables || !Array.isArray(variables)) {
        throw new ValidationError('Template variables are required and must be an array');
      }

      // Validate template
      const validation = await this.templateService.validateTemplate(content, variables);

      const duration = Date.now() - startTime;
      metrics.recordHttpRequest('POST', '/api/templates/validate', duration / 1000);

      res.status(200).json({
        success: true,
        data: validation,
        message: validation.valid ? 'Template is valid' : 'Template has validation errors',
        timestamp: new Date(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResponse = formatErrorResponse(error);
      
      logger.error('Validate template failed', {
        error: errorResponse.message,
        duration,
      });

      metrics.recordHttpRequest('POST', '/api/templates/validate', duration / 1000);
      metrics.recordError('template', 'validate_failed');

      res.status(errorResponse.statusCode).json(errorResponse);
    }
  }

  /**
   * Get template variables
   * GET /api/templates/:id/variables
   */
  async getTemplateVariables(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError('Template ID is required');
      }

      // Get template
      const template = await this.templateService.getTemplate(id);

      if (!template) {
        throw new TemplateNotFoundError(id);
      }

      const duration = Date.now() - startTime;
      metrics.recordHttpRequest('GET', '/api/templates/:id/variables', duration / 1000);

      res.status(200).json({
        success: true,
        data: {
          variables: template.variables || [],
          templateId: id,
          templateName: template.name,
        },
        message: 'Template variables retrieved successfully',
        timestamp: new Date(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResponse = formatErrorResponse(error);
      
      logger.error('Get template variables failed', {
        error: errorResponse.message,
        duration,
        templateId: req.params.id,
      });

      metrics.recordHttpRequest('GET', '/api/templates/:id/variables', duration / 1000);
      metrics.recordError('template', 'get_variables_failed');

      res.status(errorResponse.statusCode).json(errorResponse);
    }
  }
}
