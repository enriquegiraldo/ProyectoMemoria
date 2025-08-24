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
  RefundReason
} from '../types';
import { logger, metrics } from '../utils';
import { PaymentError } from '../utils/errors';
import config from '../config';

export class StripeProvider implements PaymentProvider {
  private stripe: Stripe;
  private readonly providerName = 'stripe';

  constructor() {
    this.stripe = new Stripe(config.providers.stripe.secretKey, {
      apiVersion: '2023-10-16',
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
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: data.amount,
        currency: data.currency.toLowerCase(),
        customer: data.customerId,
        payment_method: data.paymentMethodId,
        description: data.description,
        metadata: data.metadata,
        automatic_payment_methods: { enabled: true },
      });

      metrics.paymentIntentsCreated.inc({ provider: this.providerName });

      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency.toUpperCase() as Currency,
        status: this.mapPaymentStatus(paymentIntent.status),
        customerId: paymentIntent.customer as string,
        paymentMethodId: paymentIntent.payment_method as string,
        description: paymentIntent.description,
        metadata: paymentIntent.metadata,
        createdAt: new Date(paymentIntent.created * 1000),
        updatedAt: new Date(),
      };
    } catch (error) {
      logger.error('Failed to create Stripe payment intent', { error, data });
      metrics.paymentErrors.inc({ provider: this.providerName, type: 'create_intent' });
      throw new PaymentError('Failed to create payment intent', error);
    }
  }

  async confirmPaymentIntent(paymentIntentId: string, paymentMethodId?: string): Promise<PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
      });

      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency.toUpperCase() as Currency,
        status: this.mapPaymentStatus(paymentIntent.status),
        customerId: paymentIntent.customer as string,
        paymentMethodId: paymentIntent.payment_method as string,
        description: paymentIntent.description,
        metadata: paymentIntent.metadata,
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
        customerId: paymentIntent.customer as string,
        paymentMethodId: paymentIntent.payment_method as string,
        description: paymentIntent.description,
        metadata: paymentIntent.metadata,
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
      address?: {
        line1?: string;
        line2?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
      };
    };
  }): Promise<PaymentMethod> {
    try {
      const paymentMethod = await this.stripe.paymentMethods.create({
        type: data.type,
        card: data.card,
        billing_details: data.billingDetails,
      });

      metrics.paymentMethodsCreated.inc({ provider: this.providerName });

      return {
        id: paymentMethod.id,
        type: paymentMethod.type as PaymentMethodType,
        card: paymentMethod.card ? {
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          expMonth: paymentMethod.card.exp_month,
          expYear: paymentMethod.card.exp_year,
          country: paymentMethod.card.country,
        } : undefined,
        billingDetails: paymentMethod.billing_details ? {
          name: paymentMethod.billing_details.name,
          email: paymentMethod.billing_details.email,
          phone: paymentMethod.billing_details.phone,
          address: paymentMethod.billing_details.address ? {
            line1: paymentMethod.billing_details.address.line1,
            line2: paymentMethod.billing_details.address.line2,
            city: paymentMethod.billing_details.address.city,
            state: paymentMethod.billing_details.address.state,
            postalCode: paymentMethod.billing_details.address.postal_code,
            country: paymentMethod.billing_details.address.country,
          } : undefined,
        } : undefined,
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
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
    metadata?: Record<string, string>;
  }): Promise<Customer> {
    try {
      const customer = await this.stripe.customers.create({
        email: data.email,
        name: data.name,
        phone: data.phone,
        address: data.address,
        metadata: data.metadata,
      });

      metrics.customersCreated.inc({ provider: this.providerName });

      return {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        address: customer.address ? {
          line1: customer.address.line1,
          line2: customer.address.line2,
          city: customer.address.city,
          state: customer.address.state,
          postalCode: customer.address.postal_code,
          country: customer.address.country,
        } : undefined,
        metadata: customer.metadata,
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
      const refund = await this.stripe.refunds.create({
        payment_intent: data.paymentIntentId,
        amount: data.amount,
        reason: data.reason,
        metadata: data.metadata,
      });

      metrics.refundsCreated.inc({ provider: this.providerName });

      return {
        id: refund.id,
        paymentIntentId: refund.payment_intent as string,
        amount: refund.amount,
        currency: refund.currency.toUpperCase() as Currency,
        status: refund.status,
        reason: refund.reason,
        metadata: refund.metadata,
        createdAt: new Date(refund.created * 1000),
      };
    } catch (error) {
      logger.error('Failed to create Stripe refund', { error, data });
      throw new PaymentError('Failed to create refund', error);
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
        return PaymentStatus.CANCELED;
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
}
