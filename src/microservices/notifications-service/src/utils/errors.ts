export class CustomError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number = 500, code?: string, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Authentication Errors
export class AuthenticationError extends CustomError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTH_ERROR');
  }
}

export class AuthorizationError extends CustomError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHZ_ERROR');
  }
}

export class TokenExpiredError extends CustomError {
  constructor(message: string = 'Token has expired') {
    super(message, 401, 'TOKEN_EXPIRED');
  }
}

export class InvalidTokenError extends CustomError {
  constructor(message: string = 'Invalid token') {
    super(message, 401, 'INVALID_TOKEN');
  }
}

// Notification Errors
export class NotificationError extends CustomError {
  constructor(message: string = 'Notification failed') {
    super(message, 500, 'NOTIFICATION_ERROR');
  }
}

export class EmailError extends CustomError {
  constructor(message: string = 'Email sending failed') {
    super(message, 500, 'EMAIL_ERROR');
  }
}

export class PushError extends CustomError {
  constructor(message: string = 'Push notification failed') {
    super(message, 500, 'PUSH_ERROR');
  }
}

export class SMSError extends CustomError {
  constructor(message: string = 'SMS sending failed') {
    super(message, 500, 'SMS_ERROR');
  }
}

export class WebhookError extends CustomError {
  constructor(message: string = 'Webhook notification failed') {
    super(message, 500, 'WEBHOOK_ERROR');
  }
}

// Provider Errors
export class ProviderError extends CustomError {
  constructor(message: string = 'Provider error') {
    super(message, 500, 'PROVIDER_ERROR');
  }
}

export class ProviderNotEnabledError extends CustomError {
  constructor(provider: string) {
    super(`Provider ${provider} is not enabled`, 400, 'PROVIDER_NOT_ENABLED');
  }
}

export class ProviderConfigurationError extends CustomError {
  constructor(provider: string, message: string) {
    super(`Provider ${provider} configuration error: ${message}`, 500, 'PROVIDER_CONFIG_ERROR');
  }
}

// Template Errors
export class TemplateError extends CustomError {
  constructor(message: string = 'Template error') {
    super(message, 500, 'TEMPLATE_ERROR');
  }
}

export class TemplateNotFoundError extends CustomError {
  constructor(templateId: string) {
    super(`Template ${templateId} not found`, 404, 'TEMPLATE_NOT_FOUND');
  }
}

export class TemplateRenderError extends CustomError {
  constructor(templateId: string, message: string) {
    super(`Template ${templateId} render error: ${message}`, 500, 'TEMPLATE_RENDER_ERROR');
  }
}

// Subscription Errors
export class SubscriptionError extends CustomError {
  constructor(message: string = 'Subscription error') {
    super(message, 500, 'SUBSCRIPTION_ERROR');
  }
}

export class SubscriptionNotFoundError extends CustomError {
  constructor(subscriptionId: string) {
    super(`Subscription ${subscriptionId} not found`, 404, 'SUBSCRIPTION_NOT_FOUND');
  }
}

export class InvalidSubscriptionError extends CustomError {
  constructor(message: string) {
    super(`Invalid subscription: ${message}`, 400, 'INVALID_SUBSCRIPTION');
  }
}

// Validation Errors
export class ValidationError extends CustomError {
  constructor(message: string = 'Validation failed') {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class InvalidEmailError extends CustomError {
  constructor(email: string) {
    super(`Invalid email address: ${email}`, 400, 'INVALID_EMAIL');
  }
}

export class InvalidPhoneError extends CustomError {
  constructor(phone: string) {
    super(`Invalid phone number: ${phone}`, 400, 'INVALID_PHONE');
  }
}

export class InvalidWebhookError extends CustomError {
  constructor(url: string) {
    super(`Invalid webhook URL: ${url}`, 400, 'INVALID_WEBHOOK');
  }
}

// Rate Limiting Errors
export class RateLimitError extends CustomError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

export class TooManyRequestsError extends CustomError {
  constructor(retryAfter?: number) {
    const message = retryAfter 
      ? `Too many requests. Retry after ${retryAfter} seconds`
      : 'Too many requests';
    super(message, 429, 'TOO_MANY_REQUESTS');
  }
}

// Database Errors
export class DatabaseError extends CustomError {
  constructor(message: string = 'Database error') {
    super(message, 500, 'DATABASE_ERROR');
  }
}

export class DatabaseConnectionError extends CustomError {
  constructor(message: string = 'Database connection failed') {
    super(message, 500, 'DB_CONNECTION_ERROR');
  }
}

// External Service Errors
export class ExternalServiceError extends CustomError {
  constructor(service: string, message: string) {
    super(`External service ${service} error: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR');
  }
}

export class ServiceUnavailableError extends CustomError {
  constructor(service: string) {
    super(`Service ${service} is unavailable`, 503, 'SERVICE_UNAVAILABLE');
  }
}

// Network Errors
export class NetworkError extends CustomError {
  constructor(message: string = 'Network error') {
    super(message, 500, 'NETWORK_ERROR');
  }
}

export class TimeoutError extends CustomError {
  constructor(message: string = 'Request timeout') {
    super(message, 408, 'TIMEOUT_ERROR');
  }
}

// Configuration Errors
export class ConfigurationError extends CustomError {
  constructor(message: string = 'Configuration error') {
    super(message, 500, 'CONFIG_ERROR');
  }
}

export class MissingConfigurationError extends CustomError {
  constructor(key: string) {
    super(`Missing configuration: ${key}`, 500, 'MISSING_CONFIG');
  }
}

// Business Logic Errors
export class BusinessLogicError extends CustomError {
  constructor(message: string = 'Business logic error') {
    super(message, 400, 'BUSINESS_LOGIC_ERROR');
  }
}

export class QuotaExceededError extends CustomError {
  constructor(type: string) {
    super(`Quota exceeded for ${type}`, 429, 'QUOTA_EXCEEDED');
  }
}

export class FeatureNotAvailableError extends CustomError {
  constructor(feature: string) {
    super(`Feature ${feature} is not available`, 403, 'FEATURE_NOT_AVAILABLE');
  }
}

// Utility functions
export const handleError = (error: any): CustomError => {
  if (error instanceof CustomError) {
    return error;
  }

  // Map common errors to custom errors
  if (error.name === 'ValidationError') {
    return new ValidationError(error.message);
  }

  if (error.name === 'CastError') {
    return new ValidationError('Invalid data format');
  }

  if (error.code === 'ECONNREFUSED') {
    return new NetworkError('Connection refused');
  }

  if (error.code === 'ETIMEDOUT') {
    return new TimeoutError('Request timed out');
  }

  if (error.code === 'ENOTFOUND') {
    return new NetworkError('Host not found');
  }

  // Default to generic error
  return new CustomError(error.message || 'Internal server error', 500, 'INTERNAL_ERROR');
};

export const formatErrorResponse = (error: CustomError) => {
  return {
    success: false,
    error: {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      timestamp: new Date().toISOString(),
    },
  };
};
