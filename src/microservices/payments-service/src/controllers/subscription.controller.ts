import { Request, Response } from 'express';
import { SubscriptionService } from '../services';
import { 
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  CancelSubscriptionRequest
} from '../types';
import { 
  logger, 
  metrics, 
  formatErrorResponse, 
  handleError,
  hasPermission,
  extractUserFromToken
} from '../utils';

export class SubscriptionController {
  private subscriptionService = new SubscriptionService();

  async createSubscription(req: Request, res: Response): Promise<void> {
    try {
      // Check permissions
      const user = extractUserFromToken(req);
      if (!hasPermission(user, 'subscriptions:create')) {
        res.status(403).json(formatErrorResponse('Insufficient permissions'));
        return;
      }

      const request: CreateSubscriptionRequest = {
        userId: req.body.userId || user.id,
        customerId: req.body.customerId,
        planId: req.body.planId,
        amount: req.body.amount,
        currency: req.body.currency,
        interval: req.body.interval,
        intervalCount: req.body.intervalCount,
        trialDays: req.body.trialDays,
        quantity: req.body.quantity,
        metadata: req.body.metadata,
        provider: req.body.provider,
        isTest: req.body.isTest || false,
      };

      const subscription = await this.subscriptionService.createSubscription(request);

      // Record metrics
      metrics.httpRequestsTotal.inc({ method: 'POST', endpoint: '/subscriptions', status: '200' });

      res.status(201).json({
        success: true,
        data: subscription,
      });
    } catch (error) {
      handleError(error, res, 'createSubscription');
    }
  }

  async getSubscription(req: Request, res: Response): Promise<void> {
    try {
      // Check permissions
      const user = extractUserFromToken(req);
      if (!hasPermission(user, 'subscriptions:read')) {
        res.status(403).json(formatErrorResponse('Insufficient permissions'));
        return;
      }

      const subscriptionId = req.params.subscriptionId;
      const subscription = await this.subscriptionService.getSubscription(subscriptionId);

      // Check if user can access this subscription
      if (subscription.userId !== user.id && !hasPermission(user, 'subscriptions:read:all')) {
        res.status(403).json(formatErrorResponse('Access denied'));
        return;
      }

      // Record metrics
      metrics.httpRequestsTotal.inc({ method: 'GET', endpoint: '/subscriptions/:id', status: '200' });

      res.status(200).json({
        success: true,
        data: subscription,
      });
    } catch (error) {
      handleError(error, res, 'getSubscription');
    }
  }

  async getUserSubscription(req: Request, res: Response): Promise<void> {
    try {
      // Check permissions
      const user = extractUserFromToken(req);
      if (!hasPermission(user, 'subscriptions:read')) {
        res.status(403).json(formatErrorResponse('Insufficient permissions'));
        return;
      }

      const userId = req.params.userId || user.id;

      // Check if user can access other users' subscriptions
      if (userId !== user.id && !hasPermission(user, 'subscriptions:read:all')) {
        res.status(403).json(formatErrorResponse('Access denied'));
        return;
      }

      const subscription = await this.subscriptionService.getSubscriptionByUser(userId);

      // Record metrics
      metrics.httpRequestsTotal.inc({ method: 'GET', endpoint: '/subscriptions/user/:userId', status: '200' });

      res.status(200).json({
        success: true,
        data: subscription,
      });
    } catch (error) {
      handleError(error, res, 'getUserSubscription');
    }
  }

  async updateSubscription(req: Request, res: Response): Promise<void> {
    try {
      // Check permissions
      const user = extractUserFromToken(req);
      if (!hasPermission(user, 'subscriptions:update')) {
        res.status(403).json(formatErrorResponse('Insufficient permissions'));
        return;
      }

      const request: UpdateSubscriptionRequest = {
        subscriptionId: req.params.subscriptionId,
        quantity: req.body.quantity,
        amount: req.body.amount,
        metadata: req.body.metadata,
      };

      const subscription = await this.subscriptionService.updateSubscription(request);

      // Check if user can access this subscription
      if (subscription.userId !== user.id && !hasPermission(user, 'subscriptions:update:all')) {
        res.status(403).json(formatErrorResponse('Access denied'));
        return;
      }

      // Record metrics
      metrics.httpRequestsTotal.inc({ method: 'PUT', endpoint: '/subscriptions/:id', status: '200' });

      res.status(200).json({
        success: true,
        data: subscription,
      });
    } catch (error) {
      handleError(error, res, 'updateSubscription');
    }
  }

  async cancelSubscription(req: Request, res: Response): Promise<void> {
    try {
      // Check permissions
      const user = extractUserFromToken(req);
      if (!hasPermission(user, 'subscriptions:cancel')) {
        res.status(403).json(formatErrorResponse('Insufficient permissions'));
        return;
      }

      const request: CancelSubscriptionRequest = {
        subscriptionId: req.params.subscriptionId,
        cancelAtPeriodEnd: req.body.cancelAtPeriodEnd || false,
        reason: req.body.reason,
      };

      const subscription = await this.subscriptionService.cancelSubscription(request);

      // Check if user can access this subscription
      if (subscription.userId !== user.id && !hasPermission(user, 'subscriptions:cancel:all')) {
        res.status(403).json(formatErrorResponse('Access denied'));
        return;
      }

      // Record metrics
      metrics.httpRequestsTotal.inc({ method: 'POST', endpoint: '/subscriptions/:id/cancel', status: '200' });

      res.status(200).json({
        success: true,
        data: subscription,
      });
    } catch (error) {
      handleError(error, res, 'cancelSubscription');
    }
  }

  async getSubscriptionAnalytics(req: Request, res: Response): Promise<void> {
    try {
      // Check permissions
      const user = extractUserFromToken(req);
      if (!hasPermission(user, 'subscriptions:analytics')) {
        res.status(403).json(formatErrorResponse('Insufficient permissions'));
        return;
      }

      const userId = req.query.userId as string || user.id;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      // Check if user can access other users' analytics
      if (userId !== user.id && !hasPermission(user, 'subscriptions:analytics:all')) {
        res.status(403).json(formatErrorResponse('Access denied'));
        return;
      }

      const analytics = await this.subscriptionService.getSubscriptionAnalytics(userId, startDate, endDate);

      // Record metrics
      metrics.httpRequestsTotal.inc({ method: 'GET', endpoint: '/subscriptions/analytics', status: '200' });

      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      handleError(error, res, 'getSubscriptionAnalytics');
    }
  }
}
