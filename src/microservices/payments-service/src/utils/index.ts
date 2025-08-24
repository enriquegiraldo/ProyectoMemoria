// Logger
export { logger } from './logger';

// Metrics
export { metrics } from './metrics';

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
  mapProviderError
} from './errors';

// Validation
export {
  uuidSchema,
  emailSchema,
  amountSchema,
  currencySchema,
  paymentMethodSchema,
  providerSchema,
  refundReasonSchema,
  subscriptionStatusSchema,
  validateCardNumber,
  validateCVV,
  validateExpirationDate
} from './validation';

// Authentication utilities
export {
  UserRole,
  Permission,
  rolePermissions,
  generateJWT,
  verifyJWT,
  hashPassword,
  verifyPassword,
  hasPermission,
  hasRole,
  isResourceOwner,
  getRateLimitForRole,
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
