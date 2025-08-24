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

export class MercadoPagoProvider implements PaymentProvider {
  private readonly providerName = 'mercadopago';
  private readonly baseUrl = 'https://api.mercadopago.com';

  constructor() {
    // MercadoPago provider implementation
  }

  private async makeMercadoPagoRequest(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${config.providers.mercadopago.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`MercadoPago API error: ${response.status} - ${errorData.message || response.statusText}`);
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
      const preference = await this.makeMercadoPagoRequest('/checkout/preferences', 'POST', {
        items: [{
          title: data.description || 'Payment',
          quantity: 1,
          unit_price: data.amount / 100, // MercadoPago expects decimal format
          currency_id: data.currency,
        }],
        payer: data.customerId ? {
          id: data.customerId,
        } : undefined,
        external_reference: data.metadata?.orderId || '',
        notification_url: config.providers.mercadopago.webhookUrl,
        back_urls: {
          success: config.providers.mercadopago.returnUrl,
          failure: config.providers.mercadopago.cancelUrl,
          pending: config.providers.mercadopago.pendingUrl,
        },
      });

      metrics.paymentIntentsCreated.inc({ provider: this.providerName });

      return {
        id: preference.id,
        amount: data.amount,
        currency: data.currency,
        status: PaymentStatus.PENDING,
        customerId: data.customerId,
        paymentMethodId: data.paymentMethodId,
        description: data.description,
        metadata: data.metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      logger.error('Failed to create MercadoPago payment intent', { error, data });
      metrics.paymentErrors.inc({ provider: this.providerName, type: 'create_intent' });
      throw new PaymentError('Failed to create payment intent', error);
    }
  }

  async confirmPaymentIntent(paymentIntentId: string, paymentMethodId?: string): Promise<PaymentIntent> {
    try {
      const payment = await this.makeMercadoPagoRequest(`/v1/payments/${paymentIntentId}`);

      return {
        id: payment.id,
        amount: payment.transaction_amount * 100, // Convert to cents
        currency: payment.currency_id.toUpperCase() as Currency,
        status: this.mapPaymentStatus(payment.status),
        customerId: payment.payer?.id,
        paymentMethodId: paymentMethodId,
        description: payment.description,
        metadata: {},
        createdAt: new Date(payment.date_created),
        updatedAt: new Date(),
      };
    } catch (error) {
      logger.error('Failed to confirm MercadoPago payment intent', { error, paymentIntentId });
      throw new PaymentError('Failed to confirm payment intent', error);
    }
  }

  async getPaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
    try {
      const payment = await this.makeMercadoPagoRequest(`/v1/payments/${paymentIntentId}`);

      return {
        id: payment.id,
        amount: payment.transaction_amount * 100, // Convert to cents
        currency: payment.currency_id.toUpperCase() as Currency,
        status: this.mapPaymentStatus(payment.status),
        customerId: payment.payer?.id,
        paymentMethodId: undefined,
        description: payment.description,
        metadata: {},
        createdAt: new Date(payment.date_created),
        updatedAt: new Date(),
      };
    } catch (error) {
      logger.error('Failed to retrieve MercadoPago payment intent', { error, paymentIntentId });
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
    // MercadoPago doesn't support direct payment method creation like Stripe
    // This would typically be handled through their hosted checkout
    throw new PaymentError('MercadoPago payment method creation not supported');
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
      const customer = await this.makeMercadoPagoRequest('/v1/customers', 'POST', {
        email: data.email,
        first_name: data.name?.split(' ')[0] || '',
        last_name: data.name?.split(' ').slice(1).join(' ') || '',
        phone: data.phone ? {
          area_code: data.phone.substring(0, 2),
          number: data.phone.substring(2),
        } : undefined,
        address: data.address ? {
          street_name: data.address.line1,
          street_number: data.address.line2,
          city: data.address.city,
          state: data.address.state,
          zip_code: data.address.postalCode,
          country: data.address.country,
        } : undefined,
      });

      metrics.customersCreated.inc({ provider: this.providerName });

      return {
        id: customer.id,
        email: customer.email,
        name: `${customer.first_name} ${customer.last_name}`.trim(),
        phone: customer.phone ? `${customer.phone.area_code}${customer.phone.number}` : undefined,
        address: customer.address ? {
          line1: customer.address.street_name,
          line2: customer.address.street_number,
          city: customer.address.city,
          state: customer.address.state,
          postalCode: customer.address.zip_code,
          country: customer.address.country,
        } : undefined,
        metadata: data.metadata,
        createdAt: new Date(customer.date_created),
        updatedAt: new Date(),
      };
    } catch (error) {
      logger.error('Failed to create MercadoPago customer', { error, data });
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
      const refund = await this.makeMercadoPagoRequest(`/v1/payments/${data.paymentIntentId}/refunds`, 'POST', {
        amount: data.amount ? data.amount / 100 : undefined, // Convert to decimal
        reason: data.reason,
      });

      metrics.refundsCreated.inc({ provider: this.providerName });

      return {
        id: refund.id,
        paymentIntentId: data.paymentIntentId,
        amount: data.amount,
        currency: 'ARS' as Currency, // MercadoPago primarily uses ARS
        status: refund.status,
        reason: data.reason,
        metadata: data.metadata,
        createdAt: new Date(),
      };
    } catch (error) {
      logger.error('Failed to create MercadoPago refund', { error, data });
      throw new PaymentError('Failed to create refund', error);
    }
  }

  private mapPaymentStatus(mercadopagoStatus: string): PaymentStatus {
    switch (mercadopagoStatus) {
      case 'pending':
        return PaymentStatus.PENDING;
      case 'approved':
        return PaymentStatus.SUCCEEDED;
      case 'authorized':
        return PaymentStatus.AUTHORIZED;
      case 'in_process':
        return PaymentStatus.PROCESSING;
      case 'in_mediation':
        return PaymentStatus.PROCESSING;
      case 'rejected':
        return PaymentStatus.FAILED;
      case 'cancelled':
        return PaymentStatus.CANCELED;
      case 'refunded':
        return PaymentStatus.REFUNDED;
      case 'charged_back':
        return PaymentStatus.DISPUTED;
      default:
        return PaymentStatus.FAILED;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.makeMercadoPagoRequest('/users/me');
      return true;
    } catch (error) {
      logger.error('MercadoPago health check failed', { error });
      return false;
    }
  }
}
