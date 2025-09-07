import { getRepository } from '../database/connection';
import { Subscription } from '../models';
import { PaymentProviderFactory } from '../providers';
import { notificationsIntegrationService } from './notifications-integration.service';
import {
  SubscriptionStatus,
  PaymentProvider,
  Currency,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  CancelSubscriptionRequest
} from '../types';
import { logger, metrics, ValidationError, SubscriptionError } from '../utils';

export class SubscriptionService {
  private subscriptionRepository = getRepository(Subscription);

  async createSubscription(request: CreateSubscriptionRequest): Promise<Subscription> {
    try {
      logger.info('Creating subscription', { 
        userId: request.userId, 
        planId: request.planId, 
        provider: request.provider 
      });

      // Validate request
      if (request.amount <= 0) {
        throw new ValidationError('Amount must be greater than 0');
      }

      // Check if user already has an active subscription
      const existingSubscription = await this.subscriptionRepository.findOne({
        where: { 
          userId: request.userId, 
          status: SubscriptionStatus.ACTIVE 
        }
      });

      if (existingSubscription) {
        throw new SubscriptionError('User already has an active subscription');
      }

      // Get payment provider
      const provider = PaymentProviderFactory.createProvider(request.provider);

      // Create subscription with provider
      const providerSubscription = await provider.createSubscription({
        customerId: request.customerId,
        planId: request.planId,
        amount: request.amount,
        currency: request.currency || Currency.USD,
        interval: request.interval,
        intervalCount: request.intervalCount,
        trialDays: request.trialDays,
        metadata: request.metadata,
      });

      // Calculate period dates
      const now = new Date();
      const currentPeriodStart = request.trialDays ? 
        new Date(now.getTime() + request.trialDays * 24 * 60 * 60 * 1000) : 
        now;
      
      const currentPeriodEnd = new Date(currentPeriodStart.getTime() + 
        request.intervalCount * this.getIntervalMilliseconds(request.interval));

      // Create subscription record
      const subscription = this.subscriptionRepository.create({
        userId: request.userId,
        planId: request.planId,
        customerId: request.customerId,
        status: SubscriptionStatus.ACTIVE,
        provider: request.provider,
        providerSubscriptionId: providerSubscription.id,
        providerCustomerId: providerSubscription.customerId,
        amount: request.amount,
        currency: request.currency || Currency.USD,
        interval: request.interval,
        intervalCount: request.intervalCount,
        currentPeriodStart,
        currentPeriodEnd,
        trialStart: request.trialDays ? now : null,
        trialEnd: request.trialDays ? currentPeriodStart : null,
        quantity: request.quantity || 1,
        metadata: request.metadata,
        providerData: providerSubscription.providerData,
        isTest: request.isTest || false,
      });

      await this.subscriptionRepository.save(subscription);

      // Send subscription created notification
      await notificationsIntegrationService.sendSubscriptionCreatedNotification(
        request.userId,
        {
          planName: request.planName || 'Premium Plan',
          amount: subscription.amount,
          currency: subscription.currency,
          interval: subscription.interval,
          nextBillingDate: subscription.currentPeriodEnd
        }
      );

      // Record metrics
      metrics.subscriptionsCreated.inc({ provider: request.provider });

      logger.info('Subscription created successfully', { 
        subscriptionId: subscription.id, 
        providerSubscriptionId: providerSubscription.id 
      });

      return subscription;
    } catch (error) {
      logger.error('Error creating subscription:', error);
      metrics.subscriptionErrors.inc({ provider: request.provider, error: 'create' });
      throw error;
    }
  }

  async getSubscription(subscriptionId: string): Promise<Subscription> {
    try {
      const subscription = await this.subscriptionRepository.findOne({
        where: { id: subscriptionId }
      });

      if (!subscription) {
        throw new SubscriptionError('Subscription not found');
      }

      return subscription;
    } catch (error) {
      logger.error('Error getting subscription:', error);
      throw error;
    }
  }

  async getSubscriptionByUser(userId: string): Promise<Subscription | null> {
    try {
      return await this.subscriptionRepository.findOne({
        where: { userId, status: SubscriptionStatus.ACTIVE }
      });
    } catch (error) {
      logger.error('Error getting user subscription:', error);
      throw error;
    }
  }

  async updateSubscription(request: UpdateSubscriptionRequest): Promise<Subscription> {
    try {
      logger.info('Updating subscription', { 
        subscriptionId: request.subscriptionId, 
        quantity: request.quantity 
      });

      const subscription = await this.getSubscription(request.subscriptionId);

      if (subscription.status !== SubscriptionStatus.ACTIVE) {
        throw new SubscriptionError('Can only update active subscriptions');
      }

      // Get payment provider
      const provider = PaymentProviderFactory.createProvider(subscription.provider);

      // Update subscription with provider
      await provider.updateSubscription(
        subscription.providerSubscriptionId!,
        { quantity: request.quantity }
      );

      // Update local record
      subscription.quantity = request.quantity;
      subscription.amount = request.amount || subscription.amount;
      subscription.metadata = { ...subscription.metadata, ...request.metadata };

      await this.subscriptionRepository.save(subscription);

      logger.info('Subscription updated successfully', { 
        subscriptionId: subscription.id 
      });

      return subscription;
    } catch (error) {
      logger.error('Error updating subscription:', error);
      metrics.subscriptionErrors.inc({ error: 'update' });
      throw error;
    }
  }

  async cancelSubscription(request: CancelSubscriptionRequest): Promise<Subscription> {
    try {
      logger.info('Canceling subscription', { 
        subscriptionId: request.subscriptionId, 
        cancelAtPeriodEnd: request.cancelAtPeriodEnd 
      });

      const subscription = await this.getSubscription(request.subscriptionId);

      if (subscription.status !== SubscriptionStatus.ACTIVE) {
        throw new SubscriptionError('Can only cancel active subscriptions');
      }

      // Get payment provider
      const provider = PaymentProviderFactory.createProvider(subscription.provider);

      // Cancel subscription with provider
      await provider.cancelSubscription(
        subscription.providerSubscriptionId!,
        request.cancelAtPeriodEnd
      );

      // Update local record
      subscription.canceledAt = new Date();
      subscription.cancelReason = request.reason;

      if (request.cancelAtPeriodEnd) {
        subscription.cancelAtPeriodEnd = true;
      } else {
        subscription.status = SubscriptionStatus.CANCELLED;
        subscription.endedAt = new Date();
        subscription.cancelAtPeriodEnd = false;
      }

      await this.subscriptionRepository.save(subscription);

      // Send subscription cancellation notification
      await notificationsIntegrationService.sendSubscriptionCancellationNotification(
        subscription.userId,
        {
          planName: subscription.metadata?.planName || 'Premium Plan',
          endDate: subscription.endedAt || subscription.currentPeriodEnd,
          reason: request.reason
        }
      );

      // Record metrics
      metrics.subscriptionsCanceled.inc({ provider: subscription.provider });

      logger.info('Subscription canceled successfully', { 
        subscriptionId: subscription.id 
      });

      return subscription;
    } catch (error) {
      logger.error('Error canceling subscription:', error);
      metrics.subscriptionErrors.inc({ error: 'cancel' });
      throw error;
    }
  }

  async getSubscriptionAnalytics(userId?: string, startDate?: Date, endDate?: Date) {
    try {
      const queryBuilder = this.subscriptionRepository.createQueryBuilder('subscription');

      if (userId) {
        queryBuilder.where('subscription.userId = :userId', { userId });
      }

      if (startDate) {
        queryBuilder.andWhere('subscription.createdAt >= :startDate', { startDate });
      }

      if (endDate) {
        queryBuilder.andWhere('subscription.createdAt <= :endDate', { endDate });
      }

      const [
        totalSubscriptions,
        activeSubscriptions,
        canceledSubscriptions,
        totalRevenue
      ] = await Promise.all([
        queryBuilder.getCount(),
        queryBuilder.where('subscription.status = :status', { status: SubscriptionStatus.ACTIVE }).getCount(),
        queryBuilder.where('subscription.status = :status', { status: SubscriptionStatus.CANCELED }).getCount(),
        queryBuilder.select('SUM(subscription.amount)', 'total').getRawOne(),
      ]);

      return {
        totalSubscriptions,
        activeSubscriptions,
        canceledSubscriptions,
        cancelRate: totalSubscriptions > 0 ? (canceledSubscriptions / totalSubscriptions) * 100 : 0,
        totalRevenue: parseFloat(totalRevenue?.total || '0'),
      };
    } catch (error) {
      logger.error('Error getting subscription analytics:', error);
      throw error;
    }
  }

  private getIntervalMilliseconds(interval: string): number {
    switch (interval.toLowerCase()) {
      case 'day':
        return 24 * 60 * 60 * 1000;
      case 'week':
        return 7 * 24 * 60 * 60 * 1000;
      case 'month':
        return 30 * 24 * 60 * 60 * 1000;
      case 'year':
        return 365 * 24 * 60 * 60 * 1000;
      default:
        throw new ValidationError(`Unsupported interval: ${interval}`);
    }
  }
}
