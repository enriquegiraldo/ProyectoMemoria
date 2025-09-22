// src/microservices/payments-service/src/providers/stripe.provider.ts
import Stripe from 'stripe';
import {
  PaymentProvider,
  PaymentIntent,
  PaymentMethod,
  Customer,
  Refund,
  PaymentStatus,
  PaymentMethodType,
  Currency,
  RefundReason,
  RefundStatus,
  Address,
  Subscription,
} from '../types';
import { logger, metrics } from '../utils';
import { PaymentError } from '../utils/errors';
import config from '../config';

export class StripeProvider implements PaymentProvider {
  private stripe: Stripe;
  private readonly providerName = 'stripe';

  constructor() {
    this.stripe = new Stripe(config.stripe.secretKey, {
      apiVersion: '2025-08-27.basil',
      typescript: true,
    });
  }

  async createPaymentIntent(data: {
    amount: number;
    currency: Currency;
    customerId?: string;
    paymentMethodId?: string;
    description?: string;
    metadata?: Record<string, string>;
  }): Promise<PaymentIntent> {
    try {
      // Construir el objeto params dinámicamente para evitar propiedades undefined
      const params: Stripe.PaymentIntentCreateParams = {
        amount: data.amount,
        currency: data.currency.toLowerCase(),
        automatic_payment_methods: { enabled: true },
      };

      if (data.customerId) {
        params.customer = data.customerId;
      }
      if (data.paymentMethodId) {
        params.payment_method = data.paymentMethodId;
      }
      if (data.description) {
        params.description = data.description;
      }
      if (data.metadata) {
        params.metadata = data.metadata;
      }

      const paymentIntent = await this.stripe.paymentIntents.create(params);

      metrics.paymentIntentsCreated.inc({ provider: this.providerName });

      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency.toUpperCase() as Currency,
        status: this.mapPaymentStatus(paymentIntent.status),
        customerId: paymentIntent.customer as string | undefined,
        paymentMethodId: paymentIntent.payment_method as string | undefined,
        description: paymentIntent.description ?? undefined,
        metadata: paymentIntent.metadata ?? {},
        createdAt: new Date(paymentIntent.created * 1000),
        updatedAt: new Date(),
      };
    } catch (error) {
      logger.error('Failed to create Stripe payment intent', { error, data });
      metrics.paymentErrors.inc({ provider: this.providerName, error: 'create_intent' });
      throw new PaymentError('Failed to create payment intent', error);
    }
  }

  async confirmPaymentIntent(paymentIntentId: string, paymentMethodId?: string): Promise<PaymentIntent> {
    try {
      const params: Stripe.PaymentIntentConfirmParams = {};
      if (paymentMethodId) {
        params.payment_method = paymentMethodId;
      }

      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId, params);

      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency.toUpperCase() as Currency,
        status: this.mapPaymentStatus(paymentIntent.status),
        customerId: paymentIntent.customer as string | undefined,
        paymentMethodId: paymentIntent.payment_method as string | undefined,
        description: paymentIntent.description ?? undefined,
        metadata: paymentIntent.metadata ?? {},
        createdAt: new Date(paymentIntent.created * 1000),
        updatedAt: new Date(),
      };
    } catch (error) {
      logger.error('Failed to confirm Stripe payment intent', { error, paymentIntentId });
      throw new PaymentError('Failed to confirm payment intent', error);
    }
  }

  async getPaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency.toUpperCase() as Currency,
        status: this.mapPaymentStatus(paymentIntent.status),
        customerId: paymentIntent.customer as string | undefined,
        paymentMethodId: paymentIntent.payment_method as string | undefined,
        description: paymentIntent.description ?? undefined,
        metadata: paymentIntent.metadata ?? {},
        createdAt: new Date(paymentIntent.created * 1000),
        updatedAt: new Date(),
      };
    } catch (error) {
      logger.error('Failed to retrieve Stripe payment intent', { error, paymentIntentId });
      throw new PaymentError('Failed to retrieve payment intent', error);
    }
  }

  async createPaymentMethod(data: {
    type: PaymentMethodType;
    card?: {
      number: string;
      expMonth: number;
      expYear: number;
      cvc: string;
    };
    billingDetails?: {
      name?: string;
      email?: string;
      phone?: string;
      address?: Address;
    };
  }): Promise<PaymentMethod> {
    try {
      const params: Stripe.PaymentMethodCreateParams = {
        type: data.type,
      };
      if (data.card) {
        params.card = data.card;
      }
      if (data.billingDetails) {
        params.billing_details = data.billingDetails;
      }

      const paymentMethod = await this.stripe.paymentMethods.create(params);

      metrics.paymentMethodsCreated.inc({ provider: this.providerName });

      return {
        id: paymentMethod.id,
        type: paymentMethod.type as PaymentMethodType,
        card: paymentMethod.card
          ? {
              brand: paymentMethod.card.brand,
              last4: paymentMethod.card.last4,
              expMonth: paymentMethod.card.exp_month,
              expYear: paymentMethod.card.exp_year,
              country: paymentMethod.card.country ?? undefined,
            }
          : undefined,
        billingDetails: paymentMethod.billing_details
          ? {
              name: paymentMethod.billing_details.name ?? undefined,
              email: paymentMethod.billing_details.email ?? undefined,
              phone: paymentMethod.billing_details.phone ?? undefined,
              address: paymentMethod.billing_details.address
                ? {
                    line1: paymentMethod.billing_details.address.line1 ?? '',
                    line2: paymentMethod.billing_details.address.line2 ?? undefined,
                    city: paymentMethod.billing_details.address.city ?? '',
                    state: paymentMethod.billing_details.address.state ?? undefined,
                    postalCode: paymentMethod.billing_details.address.postal_code ?? '',
                    country: paymentMethod.billing_details.address.country ?? '',
                  }
                : undefined,
            }
          : undefined,
        createdAt: new Date(paymentMethod.created * 1000),
      };
    } catch (error) {
      logger.error('Failed to create Stripe payment method', { error, data });
      throw new PaymentError('Failed to create payment method', error);
    }
  }

  async createCustomer(data: {
    email: string;
    name?: string;
    phone?: string;
    address?: Address;
    metadata?: Record<string, string>;
  }): Promise<Customer> {
    try {
      const params: Stripe.CustomerCreateParams = {
        email: data.email,
      };
      if (data.name) {
        params.name = data.name;
      }
      if (data.phone) {
        params.phone = data.phone;
      }
      if (data.address) {
        params.address = data.address;
      }
      if (data.metadata) {
        params.metadata = data.metadata;
      }

      const customer = await this.stripe.customers.create(params);

      metrics.customersCreated.inc({ provider: this.providerName });

      return {
        id: customer.id,
        email: customer.email ?? '',
        name: customer.name ?? undefined,
        phone: customer.phone ?? undefined,
        address: customer.address
          ? {
              line1: customer.address.line1 ?? '',
              line2: customer.address.line2 ?? undefined,
              city: customer.address.city ?? '',
              state: customer.address.state ?? undefined,
              postalCode: customer.address.postal_code ?? '',
              country: customer.address.country ?? '',
            }
          : undefined,
        metadata: customer.metadata ?? {},
        createdAt: new Date(customer.created * 1000),
        updatedAt: new Date(),
      };
    } catch (error) {
      logger.error('Failed to create Stripe customer', { error, data });
      throw new PaymentError('Failed to create customer', error);
    }
  }

  async createRefund(data: {
    paymentIntentId: string;
    amount?: number;
    reason?: RefundReason;
    metadata?: Record<string, string>;
  }): Promise<Refund> {
    try {
      const params: Stripe.RefundCreateParams = {
        payment_intent: data.paymentIntentId,
      };
      if (data.amount) {
        params.amount = data.amount;
      }
      if (data.reason) {
        params.reason = data.reason as Stripe.RefundCreateParams.Reason;
      }
      if (data.metadata) {
        params.metadata = data.metadata;
      }

      const refund = await this.stripe.refunds.create(params);

      metrics.refundsCreated.inc({ provider: this.providerName });

      return {
        id: refund.id,
        paymentIntentId: refund.payment_intent as string,
        amount: refund.amount,
        currency: refund.currency.toUpperCase() as Currency,
        status: (refund.status ?? 'pending') as RefundStatus,
        reason: refund.reason as RefundReason | undefined,
        metadata: refund.metadata ?? {},
        createdAt: new Date(refund.created * 1000),
      };
    } catch (error) {
      logger.error('Failed to create Stripe refund', { error, data });
      throw new PaymentError('Failed to create refund', error);
    }
  }

  async createSubscription(data: {
    customerId: string;
    priceId: string;
    paymentMethodId?: string;
    metadata?: Record<string, string>;
  }): Promise<Subscription> {
    try {
      const params: Stripe.SubscriptionCreateParams = {
        customer: data.customerId,
        items: [{ price: data.priceId }],
      };
      if (data.paymentMethodId) {
        params.default_payment_method = data.paymentMethodId;
      }
      if (data.metadata) {
        params.metadata = data.metadata;
      }

      const subscription = await this.stripe.subscriptions.create(params);

      metrics.subscriptionsCreated.inc({ provider: this.providerName });

      return {
        id: subscription.id,
        customerId: subscription.customer as string,
        status: subscription.status as 'active' | 'past_due' | 'unpaid' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'trialing',
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        metadata: subscription.metadata ?? {},
        createdAt: new Date(subscription.created * 1000),
        updatedAt: new Date(),
      };
    } catch (error) {
      logger.error('Failed to create Stripe subscription', { error, data });
      metrics.subscriptionErrors.inc({ provider: this.providerName, error: 'create_subscription' });
      throw new PaymentError('Failed to create subscription', error);
    }
  }

  async updateSubscription(data: {
    subscriptionId: string;
    priceId?: string;
    paymentMethodId?: string;
    metadata?: Record<string, string>;
  }): Promise<Subscription> {
    try {
      const params: Stripe.SubscriptionUpdateParams = {};
      if (data.priceId) {
        params.items = [{ price: data.priceId }];
      }
      if (data.paymentMethodId) {
        params.default_payment_method = data.paymentMethodId;
      }
      if (data.metadata) {
        params.metadata = data.metadata;
      }

      const subscription = await this.stripe.subscriptions.update(data.subscriptionId, params);

      metrics.subscriptionsUpdated.inc({ provider: this.providerName });

      return {
        id: subscription.id,
        customerId: subscription.customer as string,
        status: subscription.status as 'active' | 'past_due' | 'unpaid' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'trialing',
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        metadata: subscription.metadata ?? {},
        createdAt: new Date(subscription.created * 1000),
        updatedAt: new Date(),
      };
    } catch (error) {
      logger.error('Failed to update Stripe subscription', { error, data });
      metrics.subscriptionErrors.inc({ provider: this.providerName, error: 'update_subscription' });
      throw new PaymentError('Failed to update subscription', error);
    }
  }

  async cancelSubscription(data: {
    subscriptionId: string;
    reason?: string;
  }): Promise<Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.cancel(data.subscriptionId, {
        invoice_now: true,
        prorate: true,
      });

      metrics.subscriptionsCanceled.inc({ provider: this.providerName });

      return {
        id: subscription.id,
        customerId: subscription.customer as string,
        status: subscription.status as 'active' | 'past_due' | 'unpaid' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'trialing',
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        metadata: subscription.metadata ?? {},
        createdAt: new Date(subscription.created * 1000),
        updatedAt: new Date(),
        cancelReason: data.reason ?? undefined,
      };
    } catch (error) {
      logger.error('Failed to cancel Stripe subscription', { error, data });
      metrics.subscriptionErrors.inc({ provider: this.providerName, error: 'cancel_subscription' });
      throw new PaymentError('Failed to cancel subscription', error);
    }
  }

  private mapPaymentStatus(stripeStatus: string): PaymentStatus {
    switch (stripeStatus) {
      case 'requires_payment_method':
      case 'requires_confirmation':
      case 'requires_action':
        return PaymentStatus.PENDING;
      case 'processing':
        return PaymentStatus.PROCESSING;
      case 'succeeded':
        return PaymentStatus.SUCCEEDED;
      case 'canceled':
        return PaymentStatus.CANCELLED;
      case 'requires_capture':
        return PaymentStatus.AUTHORIZED;
      default:
        return PaymentStatus.FAILED;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.stripe.paymentMethods.list({ limit: 1 });
      return true;
    } catch (error) {
      logger.error('Stripe health check failed', { error });
      return false;
    }
  }
};