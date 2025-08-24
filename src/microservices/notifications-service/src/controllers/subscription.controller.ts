import { Request, Response } from 'express';
import { 
  Subscription,
  NotificationPreferences,
  SubscriptionQuery,
  SubscriptionStatus
} from '../types';
import { SubscriptionService } from '../services';
import { logger, metrics } from '../utils';
import { 
  ValidationError, 
  SubscriptionError,
  SubscriptionNotFoundError,
  formatErrorResponse 
} from '../utils/errors';
import { 
  createSubscriptionRequestSchema,
  updateSubscriptionRequestSchema,
  subscriptionQuerySchema 
} from '../utils/validation';

export class SubscriptionController {
  private subscriptionService: SubscriptionService;

  constructor(subscriptionService: SubscriptionService) {
    this.subscriptionService = subscriptionService;
  }

  /**
   * Create a new subscription
   * POST /api/subscriptions
   */
  async createSubscription(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      // Validate request body
      const validationResult = createSubscriptionRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ValidationError('Invalid request body', validationResult.error.errors);
      }

      const subscription = validationResult.data;

      // Create subscription
      const newSubscription = await this.subscriptionService.createSubscription(subscription);

      const duration = Date.now() - startTime;
      metrics.recordHttpRequestDuration('POST', '/api/subscriptions', duration / 1000);

      res.status(201).json({
        success: true,
        data: newSubscription,
        message: 'Subscription created successfully',
        timestamp: new Date(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResponse = formatErrorResponse(error);
      
      logger.error('Create subscription failed', {
        error: errorResponse.message,
        duration,
        userId: req.body?.userId,
        type: req.body?.type,
      });

      metrics.recordHttpRequestDuration('POST', '/api/subscriptions', duration / 1000);
      metrics.recordError('subscription', 'create_failed');

      res.status(errorResponse.statusCode).json(errorResponse);
    }
  }

  /**
   * Get a subscription by ID
   * GET /api/subscriptions/:id
   */
  async getSubscription(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError('Subscription ID is required');
      }

      // Get subscription
      const subscription = await this.subscriptionService.getSubscription(id);

      if (!subscription) {
        throw new SubscriptionNotFoundError(id);
      }

      const duration = Date.now() - startTime;
      metrics.recordHttpRequestDuration('GET', '/api/subscriptions/:id', duration / 1000);

      res.status(200).json({
        success: true,
        data: subscription,
        message: 'Subscription retrieved successfully',
        timestamp: new Date(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResponse = formatErrorResponse(error);
      
      logger.error('Get subscription failed', {
        error: errorResponse.message,
        duration,
        subscriptionId: req.params.id,
      });

      metrics.recordHttpRequestDuration('GET', '/api/subscriptions/:id', duration / 1000);
      metrics.recordError('subscription', 'get_failed');

      res.status(errorResponse.statusCode).json(errorResponse);
    }
  }

  /**
   * List user subscriptions
   * GET /api/subscriptions
   */
  async listSubscriptions(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const { userId, type, enabled, limit, offset } = req.query;

      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      // Validate query parameters
      const validationResult = subscriptionQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        throw new ValidationError('Invalid query parameters', validationResult.error.errors);
      }

      const query: SubscriptionQuery = {
        type: type as string,
        enabled: enabled === 'true' ? true : enabled === 'false' ? false : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      };

      // List subscriptions
      const subscriptions = await this.subscriptionService.getUserSubscriptions(userId as string, query);

      const duration = Date.now() - startTime;
      metrics.recordHttpRequestDuration('GET', '/api/subscriptions', duration / 1000);

      res.status(200).json({
        success: true,
        data: {
          subscriptions,
          count: subscriptions.length,
          userId,
        },
        message: 'Subscriptions retrieved successfully',
        timestamp: new Date(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResponse = formatErrorResponse(error);
      
      logger.error('List subscriptions failed', {
        error: errorResponse.message,
        duration,
        userId: req.query.userId,
      });

      metrics.recordHttpRequestDuration('GET', '/api/subscriptions', duration / 1000);
      metrics.recordError('subscription', 'list_failed');

      res.status(errorResponse.statusCode).json(errorResponse);
    }
  }

  /**
   * Update a subscription
   * PUT /api/subscriptions/:id
   */
  async updateSubscription(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError('Subscription ID is required');
      }

      // Validate request body
      const validationResult = updateSubscriptionRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ValidationError('Invalid request body', validationResult.error.errors);
      }

      const updates = validationResult.data;

      // Update subscription
      const updatedSubscription = await this.subscriptionService.updateSubscription(id, updates);

      const duration = Date.now() - startTime;
      metrics.recordHttpRequestDuration('PUT', '/api/subscriptions/:id', duration / 1000);

      res.status(200).json({
        success: true,
        data: updatedSubscription,
        message: 'Subscription updated successfully',
        timestamp: new Date(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResponse = formatErrorResponse(error);
      
      logger.error('Update subscription failed', {
        error: errorResponse.message,
        duration,
        subscriptionId: req.params.id,
      });

      metrics.recordHttpRequestDuration('PUT', '/api/subscriptions/:id', duration / 1000);
      metrics.recordError('subscription', 'update_failed');

      res.status(errorResponse.statusCode).json(errorResponse);
    }
  }

  /**
   * Delete a subscription
   * DELETE /api/subscriptions/:id
   */
  async deleteSubscription(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError('Subscription ID is required');
      }

      // Delete subscription
      await this.subscriptionService.deleteSubscription(id);

      const duration = Date.now() - startTime;
      metrics.recordHttpRequestDuration('DELETE', '/api/subscriptions/:id', duration / 1000);

      res.status(200).json({
        success: true,
        message: 'Subscription deleted successfully',
        timestamp: new Date(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResponse = formatErrorResponse(error);
      
      logger.error('Delete subscription failed', {
        error: errorResponse.message,
        duration,
        subscriptionId: req.params.id,
      });

      metrics.recordHttpRequestDuration('DELETE', '/api/subscriptions/:id', duration / 1000);
      metrics.recordError('subscription', 'delete_failed');

      res.status(errorResponse.statusCode).json(errorResponse);
    }
  }

  /**
   * Update user preferences
   * PUT /api/subscriptions/preferences
   */
  async updatePreferences(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const { userId, type, preferences } = req.body;

      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      if (!type) {
        throw new ValidationError('Notification type is required');
      }

      if (!preferences || typeof preferences !== 'object') {
        throw new ValidationError('Preferences are required and must be an object');
      }

      // Update preferences
      const updatedSubscriptions = await this.subscriptionService.updatePreferences(
        userId,
        type,
        preferences
      );

      const duration = Date.now() - startTime;
      metrics.recordHttpRequestDuration('PUT', '/api/subscriptions/preferences', duration / 1000);

      res.status(200).json({
        success: true,
        data: {
          updatedSubscriptions,
          count: updatedSubscriptions.length,
        },
        message: 'Preferences updated successfully',
        timestamp: new Date(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResponse = formatErrorResponse(error);
      
      logger.error('Update preferences failed', {
        error: errorResponse.message,
        duration,
        userId: req.body?.userId,
        type: req.body?.type,
      });

      metrics.recordHttpRequestDuration('PUT', '/api/subscriptions/preferences', duration / 1000);
      metrics.recordError('subscription', 'update_preferences_failed');

      res.status(errorResponse.statusCode).json(errorResponse);
    }
  }

  /**
   * Get user preferences
   * GET /api/subscriptions/preferences
   */
  async getPreferences(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const { userId, type } = req.query;

      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      // Get preferences
      const preferences = await this.subscriptionService.getPreferences(
        userId as string,
        type as string
      );

      const duration = Date.now() - startTime;
      metrics.recordHttpRequestDuration('GET', '/api/subscriptions/preferences', duration / 1000);

      res.status(200).json({
        success: true,
        data: {
          preferences,
          count: preferences.length,
          userId,
          type,
        },
        message: 'Preferences retrieved successfully',
        timestamp: new Date(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResponse = formatErrorResponse(error);
      
      logger.error('Get preferences failed', {
        error: errorResponse.message,
        duration,
        userId: req.query.userId,
        type: req.query.type,
      });

      metrics.recordHttpRequestDuration('GET', '/api/subscriptions/preferences', duration / 1000);
      metrics.recordError('subscription', 'get_preferences_failed');

      res.status(errorResponse.statusCode).json(errorResponse);
    }
  }

  /**
   * Enable a subscription
   * POST /api/subscriptions/:id/enable
   */
  async enableSubscription(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError('Subscription ID is required');
      }

      // Enable subscription
      const subscription = await this.subscriptionService.enableSubscription(id);

      const duration = Date.now() - startTime;
      metrics.recordHttpRequestDuration('POST', '/api/subscriptions/:id/enable', duration / 1000);

      res.status(200).json({
        success: true,
        data: subscription,
        message: 'Subscription enabled successfully',
        timestamp: new Date(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResponse = formatErrorResponse(error);
      
      logger.error('Enable subscription failed', {
        error: errorResponse.message,
        duration,
        subscriptionId: req.params.id,
      });

      metrics.recordHttpRequestDuration('POST', '/api/subscriptions/:id/enable', duration / 1000);
      metrics.recordError('subscription', 'enable_failed');

      res.status(errorResponse.statusCode).json(errorResponse);
    }
  }

  /**
   * Disable a subscription
   * POST /api/subscriptions/:id/disable
   */
  async disableSubscription(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError('Subscription ID is required');
      }

      // Disable subscription
      const subscription = await this.subscriptionService.disableSubscription(id);

      const duration = Date.now() - startTime;
      metrics.recordHttpRequestDuration('POST', '/api/subscriptions/:id/disable', duration / 1000);

      res.status(200).json({
        success: true,
        data: subscription,
        message: 'Subscription disabled successfully',
        timestamp: new Date(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResponse = formatErrorResponse(error);
      
      logger.error('Disable subscription failed', {
        error: errorResponse.message,
        duration,
        subscriptionId: req.params.id,
      });

      metrics.recordHttpRequestDuration('POST', '/api/subscriptions/:id/disable', duration / 1000);
      metrics.recordError('subscription', 'disable_failed');

      res.status(errorResponse.statusCode).json(errorResponse);
    }
  }

  /**
   * Get subscription status
   * GET /api/subscriptions/:id/status
   */
  async getSubscriptionStatus(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError('Subscription ID is required');
      }

      // Get subscription status
      const status = await this.subscriptionService.getSubscriptionStatus(id);

      const duration = Date.now() - startTime;
      metrics.recordHttpRequestDuration('GET', '/api/subscriptions/:id/status', duration / 1000);

      res.status(200).json({
        success: true,
        data: status,
        message: 'Subscription status retrieved successfully',
        timestamp: new Date(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResponse = formatErrorResponse(error);
      
      logger.error('Get subscription status failed', {
        error: errorResponse.message,
        duration,
        subscriptionId: req.params.id,
      });

      metrics.recordHttpRequestDuration('GET', '/api/subscriptions/:id/status', duration / 1000);
      metrics.recordError('subscription', 'get_status_failed');

      res.status(errorResponse.statusCode).json(errorResponse);
    }
  }

  /**
   * Get subscription statistics
   * GET /api/subscriptions/stats
   */
  async getSubscriptionStats(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const { userId } = req.query;

      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      // Get subscription statistics
      const stats = await this.subscriptionService.getSubscriptionStats(userId as string);

      const duration = Date.now() - startTime;
      metrics.recordHttpRequestDuration('GET', '/api/subscriptions/stats', duration / 1000);

      res.status(200).json({
        success: true,
        data: stats,
        message: 'Subscription statistics retrieved successfully',
        timestamp: new Date(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResponse = formatErrorResponse(error);
      
      logger.error('Get subscription stats failed', {
        error: errorResponse.message,
        duration,
        userId: req.query.userId,
      });

      metrics.recordHttpRequestDuration('GET', '/api/subscriptions/stats', duration / 1000);
      metrics.recordError('subscription', 'get_stats_failed');

      res.status(errorResponse.statusCode).json(errorResponse);
    }
  }

  /**
   * Validate a subscription
   * POST /api/subscriptions/:id/validate
   */
  async validateSubscription(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError('Subscription ID is required');
      }

      // Validate subscription
      const isValid = await this.subscriptionService.validateSubscription(id);

      const duration = Date.now() - startTime;
      metrics.recordHttpRequestDuration('POST', '/api/subscriptions/:id/validate', duration / 1000);

      res.status(200).json({
        success: true,
        data: { isValid },
        message: isValid ? 'Subscription is valid' : 'Subscription is invalid',
        timestamp: new Date(),
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResponse = formatErrorResponse(error);
      
      logger.error('Validate subscription failed', {
        error: errorResponse.message,
        duration,
        subscriptionId: req.params.id,
      });

      metrics.recordHttpRequestDuration('POST', '/api/subscriptions/:id/validate', duration / 1000);
      metrics.recordError('subscription', 'validate_failed');

      res.status(errorResponse.statusCode).json(errorResponse);
    }
  }
}
