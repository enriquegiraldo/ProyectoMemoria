import { Request, Response } from 'express';
import { PaymentService } from '../services';
import { 
  CreatePaymentIntentRequest,
  ConfirmPaymentRequest,
  RefundRequest,
  PaymentQuery
} from '../types';
import { 
  logger, 
  metrics, 
  formatErrorResponse, 
  handleError,
  hasPermission,
  extractUserFromToken,
  validateApiKey
} from '../utils';

export class PaymentController {
  private paymentService = new PaymentService();

  async createPaymentIntent(req: Request, res: Response): Promise<void> {
    try {
      // Check permissions
      const user = extractUserFromToken(req);
      if (!hasPermission(user, 'payments:create')) {
        res.status(403).json(formatErrorResponse('Insufficient permissions'));
        return;
      }

      const request: CreatePaymentIntentRequest = {
        userId: req.body.userId || user.id,
        customerId: req.body.customerId,
        subscriptionId: req.body.subscriptionId,
        invoiceId: req.body.invoiceId,
        amount: req.body.amount,
        currency: req.body.currency,
        paymentMethod: req.body.paymentMethod,
        provider: req.body.provider,
        description: req.body.description,
        metadata: req.body.metadata,
        isTest: req.body.isTest || false,
      };

      const paymentIntent = await this.paymentService.createPaymentIntent(request);

      // Record metrics
      metrics.httpRequestsTotal.inc({ method: 'POST', endpoint: '/payments/intents', status: '200' });

      res.status(201).json({
        success: true,
        data: paymentIntent,
      });
    } catch (error) {
      handleError(error, res, 'createPaymentIntent');
    }
  }

  async confirmPayment(req: Request, res: Response): Promise<void> {
    try {
      // Check permissions
      const user = extractUserFromToken(req);
      if (!hasPermission(user, 'payments:confirm')) {
        res.status(403).json(formatErrorResponse('Insufficient permissions'));
        return;
      }

      const request: ConfirmPaymentRequest = {
        paymentId: req.params.paymentId,
        provider: req.body.provider,
        paymentMethodData: req.body.paymentMethodData,
      };

      const payment = await this.paymentService.confirmPayment(request);

      // Record metrics
      metrics.httpRequestsTotal.inc({ method: 'POST', endpoint: '/payments/:id/confirm', status: '200' });

      res.status(200).json({
        success: true,
        data: payment,
      });
    } catch (error) {
      handleError(error, res, 'confirmPayment');
    }
  }

  async getPayment(req: Request, res: Response): Promise<void> {
    try {
      // Check permissions
      const user = extractUserFromToken(req);
      if (!hasPermission(user, 'payments:read')) {
        res.status(403).json(formatErrorResponse('Insufficient permissions'));
        return;
      }

      const paymentId = req.params.paymentId;
      const payment = await this.paymentService.getPayment(paymentId);

      // Check if user can access this payment
      if (payment.userId !== user.id && !hasPermission(user, 'payments:read:all')) {
        res.status(403).json(formatErrorResponse('Access denied'));
        return;
      }

      // Record metrics
      metrics.httpRequestsTotal.inc({ method: 'GET', endpoint: '/payments/:id', status: '200' });

      res.status(200).json({
        success: true,
        data: payment,
      });
    } catch (error) {
      handleError(error, res, 'getPayment');
    }
  }

  async getPayments(req: Request, res: Response): Promise<void> {
    try {
      // Check permissions
      const user = extractUserFromToken(req);
      if (!hasPermission(user, 'payments:read')) {
        res.status(403).json(formatErrorResponse('Insufficient permissions'));
        return;
      }

      const query: PaymentQuery = {
        userId: req.query.userId as string || user.id,
        status: req.query.status as any,
        provider: req.query.provider as any,
        paymentMethod: req.query.paymentMethod as any,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        limit: parseInt(req.query.limit as string) || 20,
        offset: parseInt(req.query.offset as string) || 0,
      };

      // Check if user can access other users' payments
      if (query.userId !== user.id && !hasPermission(user, 'payments:read:all')) {
        res.status(403).json(formatErrorResponse('Access denied'));
        return;
      }

      const payments = await this.paymentService.getPaymentsByUser(
        query.userId,
        query.limit,
        query.offset
      );

      // Record metrics
      metrics.httpRequestsTotal.inc({ method: 'GET', endpoint: '/payments', status: '200' });

      res.status(200).json({
        success: true,
        data: payments,
        pagination: {
          limit: query.limit,
          offset: query.offset,
          total: payments.length,
        },
      });
    } catch (error) {
      handleError(error, res, 'getPayments');
    }
  }

  async refundPayment(req: Request, res: Response): Promise<void> {
    try {
      // Check permissions
      const user = extractUserFromToken(req);
      if (!hasPermission(user, 'payments:refund')) {
        res.status(403).json(formatErrorResponse('Insufficient permissions'));
        return;
      }

      const request: RefundRequest = {
        paymentId: req.params.paymentId,
        amount: req.body.amount,
        reason: req.body.reason,
      };

      const payment = await this.paymentService.refundPayment(request);

      // Record metrics
      metrics.httpRequestsTotal.inc({ method: 'POST', endpoint: '/payments/:id/refund', status: '200' });

      res.status(200).json({
        success: true,
        data: payment,
      });
    } catch (error) {
      handleError(error, res, 'refundPayment');
    }
  }

  async getPaymentAnalytics(req: Request, res: Response): Promise<void> {
    try {
      // Check permissions
      const user = extractUserFromToken(req);
      if (!hasPermission(user, 'payments:analytics')) {
        res.status(403).json(formatErrorResponse('Insufficient permissions'));
        return;
      }

      const userId = req.query.userId as string || user.id;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      // Check if user can access other users' analytics
      if (userId !== user.id && !hasPermission(user, 'payments:analytics:all')) {
        res.status(403).json(formatErrorResponse('Access denied'));
        return;
      }

      const analytics = await this.paymentService.getPaymentAnalytics(userId, startDate, endDate);

      // Record metrics
      metrics.httpRequestsTotal.inc({ method: 'GET', endpoint: '/payments/analytics', status: '200' });

      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      handleError(error, res, 'getPaymentAnalytics');
    }
  }

  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      // Record metrics
      metrics.httpRequestsTotal.inc({ method: 'GET', endpoint: '/health', status: '200' });

      res.status(200).json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'payments-service',
      });
    } catch (error) {
      handleError(error, res, 'healthCheck');
    }
  }
}
