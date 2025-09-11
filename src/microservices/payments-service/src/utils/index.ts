// src/microservices/payments-service/src/utils/index.ts
// Logger
export { default as logger } from './logger';

// Metrics
export { default as metrics } from './metrics';

// Errors
export {
  BaseError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  PaymentError,
  SubscriptionError,
  BillingError,
  RefundError,
  ProviderError,
  WebhookError,
  CustomerError,
  DisputeError,
  DatabaseError,
  ExternalServiceError,
  NetworkError,
  ConfigurationError,
  BusinessLogicError,
  SecurityError,
  formatErrorResponse,
  mapProviderError,
  handleError
} from './errors';

// Validation
export {
  uuidSchema,
  emailSchema,
  amountSchema,
  currencySchema,
  paymentMethodSchema,
  paymentProviderSchema,
  subscriptionStatusSchema,
  createPaymentIntentSchema,
  createSubscriptionSchema,
  createRefundSchema,
  paymentQuerySchema,
  subscriptionQuerySchema,
  validateCardNumber,
  validateCvv,
  validateExpiryDate
} from './validation';

// Authentication utilities
export {
  UserRole,
  Permission,
  rolePermissions,
  generateToken,
  verifyToken,
  hashPassword,
  verifyPassword,
  hasPermission,
  hasRole,
  canAccessResource,
  getRateLimits,
  generateApiKey,
  validateApiKey,
  extractUserFromToken
} from './auth.utils';

// Crypto utilities
export {
  encrypt,
  decrypt,
  hash,
  verifyHash,
  generateSecureRandom,
  generateSecureRandomNumber,
  hashCardNumber,
  verifyCardNumber,
  maskSensitiveData,
  generateSecureToken,
  generateWebhookSignature,
  verifyWebhookSignature,
  encryptObject,
  decryptObject,
  generateChecksum,
  verifyChecksum,
  secureCompare,
  generateNonce,
  validateNonce,
  encryptSensitiveFields,
  decryptSensitiveFields,
  generateSecurePassword,
  validatePasswordStrength
} from './crypto.utils';
