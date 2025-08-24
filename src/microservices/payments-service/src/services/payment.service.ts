import { getRepository } from '../database/connection';
import { Payment } from '../models';
import { PaymentProviderFactory } from '../providers';
import { notificationsIntegrationService } from './notifications-integration.service';
import {
  PaymentIntent,
  PaymentStatus,
  PaymentMethod,
  PaymentProvider,
  Currency,
  CreatePaymentIntentRequest,
  ConfirmPaymentRequest,
  RefundRequest
} from '../types';
import { logger, metrics, ValidationError, PaymentError } from '../utils';

export class PaymentService {
  private paymentRepository = getRepository(Payment);

  async createPaymentIntent(request: CreatePaymentIntentRequest): Promise<PaymentIntent> {
    try {
      logger.info('Creating payment intent', { 
        userId: request.userId, 
        amount: request.amount, 
        provider: request.provider 
      });

      // Validate request
      if (request.amount <= 0) {
        throw new ValidationError('Amount must be greater than 0');
      }

      // Get payment provider
      const provider = PaymentProviderFactory.createProvider(request.provider);

      // Create payment intent with provider
      const paymentIntent = await provider.createPaymentIntent({
        amount: request.amount,
        currency: request.currency || Currency.USD,
        paymentMethod: request.paymentMethod,
        description: request.description,
        metadata: request.metadata,
        customerId: request.customerId,
      });

      // Create payment record in database
      const payment = this.paymentRepository.create({
        userId: request.userId,
        customerId: request.customerId,
        subscriptionId: request.subscriptionId,
        invoiceId: request.invoiceId,
        amount: request.amount,
        currency: request.currency || Currency.USD,
        status: PaymentStatus.PENDING,
        paymentMethod: request.paymentMethod,
        provider: request.provider,
        providerPaymentId: paymentIntent.id,
        providerCustomerId: paymentIntent.customerId,
        description: request.description,
        metadata: request.metadata,
        providerData: paymentIntent.providerData,
        isTest: request.isTest || false,
      });

      await this.paymentRepository.save(payment);

      // Record metrics
      metrics.paymentIntentsCreated.inc({ provider: request.provider });

      logger.info('Payment intent created successfully', { 
        paymentId: payment.id, 
        providerPaymentId: paymentIntent.id 
      });

      return {
        id: payment.id,
        providerPaymentId: paymentIntent.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        provider: payment.provider,
        clientSecret: paymentIntent.clientSecret,
        customerId: payment.customerId,
        metadata: payment.metadata,
        createdAt: payment.createdAt,
        expiresAt: paymentIntent.expiresAt,
      };
    } catch (error) {
      logger.error('Error creating payment intent:', error);
      metrics.paymentErrors.inc({ provider: request.provider, error: 'create_intent' });
      throw error;
    }
  }

  async confirmPayment(request: ConfirmPaymentRequest): Promise<Payment> {
    try {
      logger.info('Confirming payment', { 
        paymentId: request.paymentId, 
        provider: request.provider 
      });

      // Get payment from database
      const payment = await this.paymentRepository.findOne({
        where: { id: request.paymentId }
      });

      if (!payment) {
        throw new PaymentError('Payment not found');
      }

      if (payment.status !== PaymentStatus.PENDING) {
        throw new PaymentError(`Payment is not in pending status: ${payment.status}`);
      }

      // Get payment provider
      const provider = PaymentProviderFactory.createProvider(payment.provider);

      // Confirm payment with provider
      const confirmedPayment = await provider.confirmPayment(
        payment.providerPaymentId!,
        request.paymentMethodData
      );

      // Update payment status
      payment.status = confirmedPayment.status;
      payment.providerPaymentMethodId = confirmedPayment.paymentMethodId;
      payment.providerData = confirmedPayment.providerData;
      payment.processedAt = new Date();

      if (confirmedPayment.status === PaymentStatus.SUCCEEDED) {
        payment.processedAt = new Date();
      } else if (confirmedPayment.status === PaymentStatus.FAILED) {
        payment.failedAt = new Date();
        payment.failureReason = confirmedPayment.failureReason;
        payment.failureCode = confirmedPayment.failureCode;
      }

      await this.paymentRepository.save(payment);

      // Send notifications based on payment status
      if (confirmedPayment.status === PaymentStatus.SUCCEEDED) {
        await notificationsIntegrationService.sendPaymentSuccessNotification(
          payment.userId,
          {
            amount: payment.amount,
            currency: payment.currency,
            paymentMethod: payment.paymentMethod,
            provider: payment.provider,
            transactionId: payment.providerPaymentId || payment.id
          }
        );
      } else if (confirmedPayment.status === PaymentStatus.FAILED) {
        await notificationsIntegrationService.sendPaymentFailureNotification(
          payment.userId,
          {
            amount: payment.amount,
            currency: payment.currency,
            paymentMethod: payment.paymentMethod,
            provider: payment.provider,
            reason: confirmedPayment.failureReason || 'Payment failed'
          }
        );
      }

      // Record metrics
      metrics.paymentsProcessed.inc({ 
        provider: payment.provider, 
        status: payment.status 
      });

      logger.info('Payment confirmed successfully', { 
        paymentId: payment.id, 
        status: payment.status 
      });

      return payment;
    } catch (error) {
      logger.error('Error confirming payment:', error);
      metrics.paymentErrors.inc({ provider: request.provider, error: 'confirm_payment' });
      throw error;
    }
  }

  async getPayment(paymentId: string): Promise<Payment> {
    try {
      const payment = await this.paymentRepository.findOne({
        where: { id: paymentId }
      });

      if (!payment) {
        throw new PaymentError('Payment not found');
      }

      return payment;
    } catch (error) {
      logger.error('Error getting payment:', error);
      throw error;
    }
  }

  async getPaymentsByUser(userId: string, limit = 20, offset = 0): Promise<Payment[]> {
    try {
      return await this.paymentRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: limit,
        skip: offset,
      });
    } catch (error) {
      logger.error('Error getting user payments:', error);
      throw error;
    }
  }

  async refundPayment(request: RefundRequest): Promise<Payment> {
    try {
      logger.info('Processing refund', { 
        paymentId: request.paymentId, 
        amount: request.amount 
      });

      // Get payment from database
      const payment = await this.paymentRepository.findOne({
        where: { id: request.paymentId }
      });

      if (!payment) {
        throw new PaymentError('Payment not found');
      }

      if (payment.status !== PaymentStatus.SUCCEEDED) {
        throw new PaymentError('Payment must be successful to refund');
      }

      if (request.amount > payment.refundableAmount) {
        throw new PaymentError('Refund amount exceeds refundable amount');
      }

      // Get payment provider
      const provider = PaymentProviderFactory.createProvider(payment.provider);

      // Process refund with provider
      const refund = await provider.createRefund(
        payment.providerPaymentId!,
        request.amount,
        request.reason
      );

      // Update payment
      payment.refundedAmount += request.amount;
      payment.refundedAt = new Date();

      if (payment.refundedAmount >= payment.amount) {
        payment.status = PaymentStatus.REFUNDED;
      }

      await this.paymentRepository.save(payment);

      // Record metrics
      metrics.refundsProcessed.inc({ 
        provider: payment.provider, 
        amount: request.amount 
      });

      logger.info('Refund processed successfully', { 
        paymentId: payment.id, 
        refundAmount: request.amount 
      });

      return payment;
    } catch (error) {
      logger.error('Error processing refund:', error);
      metrics.paymentErrors.inc({ error: 'refund' });
      throw error;
    }
  }

  async getPaymentAnalytics(userId?: string, startDate?: Date, endDate?: Date) {
    try {
      const queryBuilder = this.paymentRepository.createQueryBuilder('payment');

      if (userId) {
        queryBuilder.where('payment.userId = :userId', { userId });
      }

      if (startDate) {
        queryBuilder.andWhere('payment.createdAt >= :startDate', { startDate });
      }

      if (endDate) {
        queryBuilder.andWhere('payment.createdAt <= :endDate', { endDate });
      }

      const [
        totalPayments,
        successfulPayments,
        failedPayments,
        totalAmount,
        successfulAmount
      ] = await Promise.all([
        queryBuilder.getCount(),
        queryBuilder.where('payment.status = :status', { status: PaymentStatus.SUCCEEDED }).getCount(),
        queryBuilder.where('payment.status = :status', { status: PaymentStatus.FAILED }).getCount(),
        queryBuilder.select('SUM(payment.amount)', 'total').getRawOne(),
        queryBuilder.where('payment.status = :status', { status: PaymentStatus.SUCCEEDED }).select('SUM(payment.amount)', 'total').getRawOne(),
      ]);

      return {
        totalPayments,
        successfulPayments,
        failedPayments,
        successRate: totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0,
        totalAmount: parseFloat(totalAmount?.total || '0'),
        successfulAmount: parseFloat(successfulAmount?.total || '0'),
      };
    } catch (error) {
      logger.error('Error getting payment analytics:', error);
      throw error;
    }
  }
}
