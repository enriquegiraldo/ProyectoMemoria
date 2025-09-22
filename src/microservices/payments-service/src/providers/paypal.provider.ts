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

export class PayPalProvider implements PaymentProvider {
  private readonly providerName = 'paypal';
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    // PayPal provider implementation
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await fetch(`${config.providers.paypal.baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${config.providers.paypal.clientId}:${config.providers.paypal.clientSecret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });

      if (!response.ok) {
        throw new Error('Failed to get PayPal access token');
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = new Date(Date.now() + (data.expires_in * 1000));

      return this.accessToken;
    } catch (error) {
      logger.error('Failed to get PayPal access token', { error });
      throw new PaymentError('Failed to authenticate with PayPal', error);
    }
  }

  private async makePayPalRequest(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
    const token = await this.getAccessToken();
    
    const response = await fetch(`${config.providers.paypal.baseUrl}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`PayPal API error: ${response.status} - ${errorData.message || response.statusText}`);
    }

    return response.json();
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
      const order = await this.makePayPalRequest('/v2/checkout/orders', 'POST', {
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: data.currency,
            value: (data.amount / 100).toFixed(2), // PayPal expects decimal format
          },
          description: data.description,
          custom_id: data.metadata?.orderId || '',
        }],
        application_context: {
          return_url: config.providers.paypal.returnUrl,
          cancel_url: config.providers.paypal.cancelUrl,
        },
      });

      metrics.paymentIntentsCreated.inc({ provider: this.providerName });

      return {
        id: order.id,
        amount: data.amount,
        currency: data.currency,
        status: this.mapPaymentStatus(order.status),
        customerId: data.customerId,
        paymentMethodId: data.paymentMethodId,
        description: data.description,
        metadata: data.metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      logger.error('Failed to create PayPal payment intent', { error, data });
      metrics.paymentErrors.inc({ provider: this.providerName, type: 'create_intent' });
      throw new PaymentError('Failed to create payment intent', error);
    }
  }

  async confirmPaymentIntent(paymentIntentId: string, paymentMethodId?: string): Promise<PaymentIntent> {
    try {
      const capture = await this.makePayPalRequest(`/v2/checkout/orders/${paymentIntentId}/capture`, 'POST');

      return {
        id: capture.id,
        amount: parseInt((parseFloat(capture.purchase_units[0].amount.value) * 100).toString()),
        currency: capture.purchase_units[0].amount.currency_code as Currency,
        status: this.mapPaymentStatus(capture.status),
        customerId: capture.payer?.payer_id,
        paymentMethodId: paymentMethodId,
        description: capture.purchase_units[0].description,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      logger.error('Failed to confirm PayPal payment intent', { error, paymentIntentId });
      throw new PaymentError('Failed to confirm payment intent', error);
    }
  }

  async getPaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
    try {
      const order = await this.makePayPalRequest(`/v2/checkout/orders/${paymentIntentId}`);

      return {
        id: order.id,
        amount: parseInt((parseFloat(order.purchase_units[0].amount.value) * 100).toString()),
        currency: order.purchase_units[0].amount.currency_code as Currency,
        status: this.mapPaymentStatus(order.status),
        customerId: order.payer?.payer_id,
        paymentMethodId: undefined,
        description: order.purchase_units[0].description,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      logger.error('Failed to retrieve PayPal payment intent', { error, paymentIntentId });
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
    // PayPal doesn't support direct payment method creation like Stripe
    // This would typically be handled through their hosted checkout
    throw new PaymentError('PayPal payment method creation not supported');
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
    // PayPal doesn't have a direct customer creation API like Stripe
    // Customers are created during the payment flow
    return {
      id: `paypal_${Date.now()}`,
      email: data.email,
      name: data.name,
      phone: data.phone,
      address: data.address,
      metadata: data.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async createRefund(data: {
    paymentIntentId: string;
    amount?: number;
    reason?: RefundReason;
    metadata?: Record<string, string>;
  }): Promise<Refund> {
    try {
      const refund = await this.makePayPalRequest('/v2/payments/captures/refund', 'POST', {
        amount: data.amount ? {
          value: (data.amount / 100).toFixed(2),
          currency_code: 'USD', // Would need to get from original payment
        } : undefined,
        note_to_payer: data.reason,
      });

      metrics.refundsCreated.inc({ provider: this.providerName });

      return {
        id: refund.id,
        paymentIntentId: data.paymentIntentId,
        amount: data.amount,
        currency: 'USD' as Currency,
        status: refund.status,
        reason: data.reason,
        metadata: data.metadata,
        createdAt: new Date(),
      };
    } catch (error) {
      logger.error('Failed to create PayPal refund', { error, data });
      throw new PaymentError('Failed to create refund', error);
    }
  }

  private mapPaymentStatus(paypalStatus: string): PaymentStatus {
    switch (paypalStatus) {
      case 'CREATED':
        return PaymentStatus.PENDING;
      case 'SAVED':
        return PaymentStatus.PENDING;
      case 'APPROVED':
        return PaymentStatus.AUTHORIZED;
      case 'VOIDED':
        return PaymentStatus.CANCELLED;
      case 'COMPLETED':
        return PaymentStatus.SUCCEEDED;
      case 'PAYER_ACTION_REQUIRED':
        return PaymentStatus.PENDING;
      default:
        return PaymentStatus.FAILED;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.getAccessToken();
      return true;
    } catch (error) {
      logger.error('PayPal health check failed', { error });
      return false;
    }
  }
}
