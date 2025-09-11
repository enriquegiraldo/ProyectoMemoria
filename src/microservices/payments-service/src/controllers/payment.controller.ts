import { Request, Response } from 'express';
import { PaymentService } from '../services';
import {
  CreatePaymentIntentRequest,
  ConfirmPaymentRequest,
  RefundRequest,
  PaymentQuery,
} from '../types';
import { logger, metrics, formatErrorResponse, handleError, hasPermission } from '../utils';

export class PaymentController {
  private paymentService = new PaymentService();

  async createPaymentIntent(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as { id: string; email: string; role: string; permissions: string[] };
      if (!user) {
        logger.warn('Authentication required for createPaymentIntent');
        res.status(401).json(formatErrorResponse(new Error('Authentication required')));
        return;
      }
      if (!hasPermission(user.permissions, 'payments:create')) {
        logger.warn('Insufficient permissions for createPaymentIntent', { userId: user.id });
        res.status(403).json(formatErrorResponse(new Error('Insufficient permissions')));
        return;
      }

      const request: CreatePaymentIntentRequest = {
        userId: req.body.userId || user.id,
        customerId: req.body.customerId,
        subscriptionId: req.body.subscriptionId,
        invoiceId: req.body.invoiceId,
        amount: req.body.amount,
        currency: req.body.currency,
        paymentMethod: req.body.paymentMethodId,
        provider: req.body.provider,
        description: req.body.description,
        metadata: req.body.metadata,
        isTest: req.body.isTest || false,
      };

      logger.info('Creating payment intent', { userId: user.id, provider: request.provider });
      const paymentIntent = await this.paymentService.createPaymentIntent(request);

      metrics.httpRequestTotal.inc({ method: 'POST', route: '/payments/intents', status_code: '201' });

      res.status(201).json({
        success: true,
        data: paymentIntent,
      });
    } catch (error) {
      logger.error('Error in createPaymentIntent', { error });
      handleError(error as Error, res);
    }
  }

  async confirmPayment(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as { id: string; email: string; role: string; permissions: string[] };
      if (!user) {
        logger.warn('Authentication required for confirmPayment');
        res.status(401).json(formatErrorResponse(new Error('Authentication required')));
        return;
      }
      if (!hasPermission(user.permissions, 'payments:confirm')) {
        logger.warn('Insufficient permissions for confirmPayment', { userId: user.id });
        res.status(403).json(formatErrorResponse(new Error('Insufficient permissions')));
        return;
      }

      const paymentIntentId = req.params["paymentId"];
      if (!paymentIntentId) {
        logger.warn('Missing paymentIntentId for confirmPayment');
        res.status(400).json(formatErrorResponse(new Error('Missing paymentIntentId')));
        return;
      }

      const request: ConfirmPaymentRequest = {
        paymentIntentId,
        provider: req.body.provider,
        paymentMethodId: req.body.paymentMethodId,
      };

      logger.info('Confirming payment', { paymentIntentId, provider: request.provider });
      const payment = await this.paymentService.confirmPayment(request);

      metrics.httpRequestTotal.inc({ method: 'POST', route: '/payments/:id/confirm', status_code: '200' });

      res.status(200).json({
        success: true,
        data: payment,
      });
    } catch (error) {
      logger.error('Error in confirmPayment', { error });
      handleError(error as Error, res);
    }
  }

  async getPayment(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as { id: string; email: string; role: string; permissions: string[] };
      if (!user) {
        logger.warn('Authentication required for getPayment');
        res.status(401).json(formatErrorResponse(new Error('Authentication required')));
        return;
      }
      if (!hasPermission(user.permissions, 'payments:read')) {
        logger.warn('Insufficient permissions for getPayment', { userId: user.id });
        res.status(403).json(formatErrorResponse(new Error('Insufficient permissions')));
        return;
      }

      const paymentId = req.params["paymentId"];
      if (!paymentId) {
        logger.warn('Missing paymentId for getPayment');
        res.status(400).json(formatErrorResponse(new Error('Missing paymentId')));
        return;
      }

      logger.info('Fetching payment', { paymentId, userId: user.id });
      const payment = await this.paymentService.getPayment(paymentId);

      metrics.httpRequestTotal.inc({ method: 'GET', route: '/payments/:id', status_code: '200' });

      res.status(200).json({
        success: true,
        data: payment,
      });
    } catch (error) {
      logger.error('Error in getPayment', { error });
      handleError(error as Error, res);
    }
  }

  async getPayments(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as { id: string; email: string; role: string; permissions: string[] };
      if (!user) {
        logger.warn('Authentication required for getPayments');
        res.status(401).json(formatErrorResponse(new Error('Authentication required')));
        return;
      }
      if (!hasPermission(user.permissions, 'payments:read')) {
        logger.warn('Insufficient permissions for getPayments', { userId: user.id });
        res.status(403).json(formatErrorResponse(new Error('Insufficient permissions')));
        return;
      }

      const query: PaymentQuery = {
        userId: user.id,
        page: parseInt(req.query["page"] as string) || 1,
        limit: parseInt(req.query["limit"] as string) || 10,
      };

      logger.info('Fetching payments', { query, userId: user.id });
      const payments = await this.paymentService.getPayments(query);

      metrics.httpRequestTotal.inc({ method: 'GET', route: '/payments', status_code: '200' });

      res.status(200).json({
        success: true,
        data: payments,
      });
    } catch (error) {
      logger.error('Error in getPayments', { error });
      handleError(error as Error, res);
    }
  }

  async refundPayment(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as { id: string; email: string; role: string; permissions: string[] };
      if (!user) {
        logger.warn('Authentication required for refundPayment');
        res.status(401).json(formatErrorResponse(new Error('Authentication required')));
        return;
      }
      if (!hasPermission(user.permissions, 'payments:refund')) {
        logger.warn('Insufficient permissions for refundPayment', { userId: user.id });
        res.status(403).json(formatErrorResponse(new Error('Insufficient permissions')));
        return;
      }

      const paymentIntentId = req.params["paymentId"];
      if (!paymentIntentId) {
        logger.warn('Missing paymentIntentId for refundPayment');
        res.status(400).json(formatErrorResponse(new Error('Missing paymentIntentId')));
        return;
      }

      const request: RefundRequest = {
        paymentId: paymentIntentId,
        amount: req.body.amount,
        reason: req.body.reason,
      };

      logger.info('Creating refund', { paymentIntentId, userId: user.id });
      const refund = await this.paymentService.createRefund(request);

      metrics.httpRequestTotal.inc({ method: 'POST', route: '/payments/:id/refund', status_code: '200' });

      res.status(200).json({
        success: true,
        data: refund,
      });
    } catch (error) {
      logger.error('Error in refundPayment', { error });
      handleError(error as Error, res);
    }
  }

  async getPaymentAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as { id: string; email: string; role: string; permissions: string[] };
      if (!user) {
        logger.warn('Authentication required for getPaymentAnalytics');
        res.status(401).json(formatErrorResponse(new Error('Authentication required')));
        return;
      }
      if (!hasPermission(user.permissions, 'payments:analytics')) {
        logger.warn('Insufficient permissions for getPaymentAnalytics', { userId: user.id });
        res.status(403).json(formatErrorResponse(new Error('Insufficient permissions')));
        return;
      }

      logger.info('Fetching payment analytics', { userId: user.id });
      const analytics = await this.paymentService.getPaymentAnalytics(user.id);

      metrics.httpRequestTotal.inc({ method: 'GET', route: '/payments/analytics', status_code: '200' });

      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      logger.error('Error in getPaymentAnalytics', { error });
      handleError(error as Error, res);
    }
  }

  async healthCheck(_req: Request, res: Response): Promise<void> {
    try {
      logger.info('Health check requested');
      metrics.httpRequestTotal.inc({ method: 'GET', route: '/health', status_code: '200' });

      res.status(200).json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'payments-service',
      });
    } catch (error) {
      logger.error('Error in healthCheck', { error });
      handleError(error as Error, res);
    }
  }
}