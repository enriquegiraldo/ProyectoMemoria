// Base error class
export class BaseError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR', details?: any) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Authentication errors
export class AuthenticationError extends BaseError {
  constructor(message: string = 'Authentication failed', details?: any) {
    super(message, 401, 'AUTHENTICATION_ERROR', details);
  }
}

export class AuthorizationError extends BaseError {
  constructor(message: string = 'Authorization failed', details?: any) {
    super(message, 403, 'AUTHORIZATION_ERROR', details);
  }
}

export class TokenExpiredError extends BaseError {
  constructor(message: string = 'Token expired', details?: any) {
    super(message, 401, 'TOKEN_EXPIRED', details);
  }
}

// Validation errors
export class ValidationError extends BaseError {
  constructor(message: string = 'Validation failed', details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class InvalidInputError extends BaseError {
  constructor(message: string = 'Invalid input', details?: any) {
    super(message, 400, 'INVALID_INPUT', details);
  }
}

// Payment errors
export class PaymentError extends BaseError {
  constructor(message: string = 'Payment processing failed', details?: any) {
    super(message, 400, 'PAYMENT_ERROR', details);
  }
}

export class PaymentIntentError extends BaseError {
  constructor(message: string = 'Payment intent error', details?: any) {
    super(message, 400, 'PAYMENT_INTENT_ERROR', details);
  }
}

export class PaymentMethodError extends BaseError {
  constructor(message: string = 'Payment method error', details?: any) {
    super(message, 400, 'PAYMENT_METHOD_ERROR', details);
  }
}

export class InsufficientFundsError extends BaseError {
  constructor(message: string = 'Insufficient funds', details?: any) {
    super(message, 400, 'INSUFFICIENT_FUNDS', details);
  }
}

export class CardDeclinedError extends BaseError {
  constructor(message: string = 'Card declined', details?: any) {
    super(message, 400, 'CARD_DECLINED', details);
  }
}

export class ExpiredCardError extends BaseError {
  constructor(message: string = 'Card expired', details?: any) {
    super(message, 400, 'EXPIRED_CARD', details);
  }
}

export class InvalidCvvError extends BaseError {
  constructor(message: string = 'Invalid CVV', details?: any) {
    super(message, 400, 'INVALID_CVV', details);
  }
}

// Subscription errors
export class SubscriptionError extends BaseError {
  constructor(message: string = 'Subscription error', details?: any) {
    super(message, 400, 'SUBSCRIPTION_ERROR', details);
  }
}

export class SubscriptionNotFoundError extends BaseError {
  constructor(message: string = 'Subscription not found', details?: any) {
    super(message, 404, 'SUBSCRIPTION_NOT_FOUND', details);
  }
}

export class SubscriptionAlreadyExistsError extends BaseError {
  constructor(message: string = 'Subscription already exists', details?: any) {
    super(message, 409, 'SUBSCRIPTION_ALREADY_EXISTS', details);
  }
}

export class PlanNotFoundError extends BaseError {
  constructor(message: string = 'Plan not found', details?: any) {
    super(message, 404, 'PLAN_NOT_FOUND', details);
  }
}

// Billing errors
export class BillingError extends BaseError {
  constructor(message: string = 'Billing error', details?: any) {
    super(message, 400, 'BILLING_ERROR', details);
  }
}

export class InvoiceNotFoundError extends BaseError {
  constructor(message: string = 'Invoice not found', details?: any) {
    super(message, 404, 'INVOICE_NOT_FOUND', details);
  }
}

export class InvoiceAlreadyPaidError extends BaseError {
  constructor(message: string = 'Invoice already paid', details?: any) {
    super(message, 409, 'INVOICE_ALREADY_PAID', details);
  }
}

// Refund errors
export class RefundError extends BaseError {
  constructor(message: string = 'Refund error', details?: any) {
    super(message, 400, 'REFUND_ERROR', details);
  }
}

export class RefundNotFoundError extends BaseError {
  constructor(message: string = 'Refund not found', details?: any) {
    super(message, 404, 'REFUND_NOT_FOUND', details);
  }
}

export class RefundAmountExceedsPaymentError extends BaseError {
  constructor(message: string = 'Refund amount exceeds payment amount', details?: any) {
    super(message, 400, 'REFUND_AMOUNT_EXCEEDS_PAYMENT', details);
  }
}

// Provider errors
export class ProviderError extends BaseError {
  constructor(message: string = 'Payment provider error', details?: any) {
    super(message, 500, 'PROVIDER_ERROR', details);
  }
}

export class StripeError extends BaseError {
  constructor(message: string = 'Stripe error', details?: any) {
    super(message, 500, 'STRIPE_ERROR', details);
  }
}

export class PayPalError extends BaseError {
  constructor(message: string = 'PayPal error', details?: any) {
    super(message, 500, 'PAYPAL_ERROR', details);
  }
}

export class MercadoPagoError extends BaseError {
  constructor(message: string = 'MercadoPago error', details?: any) {
    super(message, 500, 'MERCADOPAGO_ERROR', details);
  }
}

export class CryptoError extends BaseError {
  constructor(message: string = 'Cryptocurrency error', details?: any) {
    super(message, 500, 'CRYPTO_ERROR', details);
  }
}

// Webhook errors
export class WebhookError extends BaseError {
  constructor(message: string = 'Webhook error', details?: any) {
    super(message, 400, 'WEBHOOK_ERROR', details);
  }
}

export class WebhookSignatureError extends BaseError {
  constructor(message: string = 'Invalid webhook signature', details?: any) {
    super(message, 400, 'WEBHOOK_SIGNATURE_ERROR', details);
  }
}

export class WebhookEventNotFoundError extends BaseError {
  constructor(message: string = 'Webhook event not found', details?: any) {
    super(message, 404, 'WEBHOOK_EVENT_NOT_FOUND', details);
  }
}

// Customer errors
export class CustomerError extends BaseError {
  constructor(message: string = 'Customer error', details?: any) {
    super(message, 400, 'CUSTOMER_ERROR', details);
  }
}

export class CustomerNotFoundError extends BaseError {
  constructor(message: string = 'Customer not found', details?: any) {
    super(message, 404, 'CUSTOMER_NOT_FOUND', details);
  }
}

export class CustomerAlreadyExistsError extends BaseError {
  constructor(message: string = 'Customer already exists', details?: any) {
    super(message, 409, 'CUSTOMER_ALREADY_EXISTS', details);
  }
}

// Dispute errors
export class DisputeError extends BaseError {
  constructor(message: string = 'Dispute error', details?: any) {
    super(message, 400, 'DISPUTE_ERROR', details);
  }
}

export class DisputeNotFoundError extends BaseError {
  constructor(message: string = 'Dispute not found', details?: any) {
    super(message, 404, 'DISPUTE_NOT_FOUND', details);
  }
}

// Database errors
export class DatabaseError extends BaseError {
  constructor(message: string = 'Database error', details?: any) {
    super(message, 500, 'DATABASE_ERROR', details);
  }
}

export class ConnectionError extends BaseError {
  constructor(message: string = 'Database connection error', details?: any) {
    super(message, 500, 'CONNECTION_ERROR', details);
  }
}

export class QueryError extends BaseError {
  constructor(message: string = 'Database query error', details?: any) {
    super(message, 500, 'QUERY_ERROR', details);
  }
}

// External service errors
export class ExternalServiceError extends BaseError {
  constructor(message: string = 'External service error', details?: any) {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR', details);
  }
}

export class ServiceUnavailableError extends BaseError {
  constructor(message: string = 'Service unavailable', details?: any) {
    super(message, 503, 'SERVICE_UNAVAILABLE', details);
  }
}

// Network errors
export class NetworkError extends BaseError {
  constructor(message: string = 'Network error', details?: any) {
    super(message, 500, 'NETWORK_ERROR', details);
  }
}

export class TimeoutError extends BaseError {
  constructor(message: string = 'Request timeout', details?: any) {
    super(message, 408, 'TIMEOUT_ERROR', details);
  }
}

// Configuration errors
export class ConfigurationError extends BaseError {
  constructor(message: string = 'Configuration error', details?: any) {
    super(message, 500, 'CONFIGURATION_ERROR', details);
  }
}

export class MissingConfigurationError extends BaseError {
  constructor(message: string = 'Missing configuration', details?: any) {
    super(message, 500, 'MISSING_CONFIGURATION', details);
  }
}

// Rate limiting errors
export class RateLimitError extends BaseError {
  constructor(message: string = 'Rate limit exceeded', details?: any) {
    super(message, 429, 'RATE_LIMIT_ERROR', details);
  }
}

// Business logic errors
export class BusinessLogicError extends BaseError {
  constructor(message: string = 'Business logic error', details?: any) {
    super(message, 400, 'BUSINESS_LOGIC_ERROR', details);
  }
}

export class InvalidStateError extends BaseError {
  constructor(message: string = 'Invalid state', details?: any) {
    super(message, 400, 'INVALID_STATE', details);
  }
}

export class OperationNotAllowedError extends BaseError {
  constructor(message: string = 'Operation not allowed', details?: any) {
    super(message, 403, 'OPERATION_NOT_ALLOWED', details);
  }
}

// Resource errors
export class ResourceNotFoundError extends BaseError {
  constructor(message: string = 'Resource not found', details?: any) {
    super(message, 404, 'RESOURCE_NOT_FOUND', details);
  }
}

export class ResourceConflictError extends BaseError {
  constructor(message: string = 'Resource conflict', details?: any) {
    super(message, 409, 'RESOURCE_CONFLICT', details);
  }
}

// Security errors
export class SecurityError extends BaseError {
  constructor(message: string = 'Security error', details?: any) {
    super(message, 403, 'SECURITY_ERROR', details);
  }
}

export class EncryptionError extends BaseError {
  constructor(message: string = 'Encryption error', details?: any) {
    super(message, 500, 'ENCRYPTION_ERROR', details);
  }
}

export class DecryptionError extends BaseError {
  constructor(message: string = 'Decryption error', details?: any) {
    super(message, 500, 'DECRYPTION_ERROR', details);
  }
}

// Utility functions
export const formatErrorResponse = (error: Error): any => {
  if (error instanceof BaseError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      timestamp: new Date().toISOString(),
    };
  }

  // Handle unknown errors
  return {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      details: config.server.environment === 'development' ? error.message : undefined,
    },
    timestamp: new Date().toISOString(),
  };
};

export const handleError = (error: Error): BaseError => {
  if (error instanceof BaseError) {
    return error;
  }

  // Convert unknown errors to BaseError
  return new BaseError(
    error.message || 'An unexpected error occurred',
    500,
    'INTERNAL_ERROR',
    config.server.environment === 'development' ? error.stack : undefined
  );
};

// Error mapping for provider errors
export const mapProviderError = (provider: string, error: any): BaseError => {
  const message = error.message || 'Provider error';
  const details = error.details || error;

  switch (provider.toLowerCase()) {
    case 'stripe':
      return new StripeError(message, details);
    case 'paypal':
      return new PayPalError(message, details);
    case 'mercadopago':
      return new MercadoPagoError(message, details);
    case 'bitcoin':
    case 'ethereum':
    case 'usdt':
      return new CryptoError(message, details);
    default:
      return new ProviderError(message, details);
  }
};

// Import config for environment checks
import config from '../config';
