// Payment Types
export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
  DISPUTED = 'disputed',
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer',
  PAYPAL = 'paypal',
  CRYPTO = 'crypto',
  CASH = 'cash',
  WALLET = 'wallet',
}

export enum PaymentProvider {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  MERCADOPAGO = 'mercadopago',
  BITCOIN = 'bitcoin',
  ETHEREUM = 'ethereum',
  USDT = 'usdt',
}

export enum Currency {
  USD = 'usd',
  EUR = 'eur',
  GBP = 'gbp',
  JPY = 'jpy',
  CAD = 'cad',
  AUD = 'aud',
  CHF = 'chf',
  CNY = 'cny',
  BRL = 'brl',
  MXN = 'mxn',
  ARS = 'ars',
  BTC = 'btc',
  ETH = 'eth',
  USDT = 'usdt',
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  provider: PaymentProvider;
  customerId: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export interface Payment {
  id: string;
  intentId: string;
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  provider: PaymentProvider;
  providerPaymentId: string;
  customerId: string;
  description?: string;
  metadata?: Record<string, any>;
  receiptUrl?: string;
  failureReason?: string;
  refundedAmount?: number;
  refundedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentMethodData {
  id: string;
  type: PaymentMethod;
  provider: PaymentProvider;
  providerMethodId: string;
  customerId: string;
  isDefault: boolean;
  cardBrand?: string;
  cardLast4?: string;
  cardExpMonth?: number;
  cardExpYear?: number;
  bankName?: string;
  bankLast4?: string;
  walletType?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Subscription Types
export enum SubscriptionStatus {
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELLED = 'cancelled',
  UNPAID = 'unpaid',
  TRIAL = 'trial',
  PAUSED = 'paused',
}

export enum BillingCycle {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: Currency;
  billingCycle: BillingCycle;
  features: string[];
  isActive: boolean;
  trialDays?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  customerId: string;
  planId: string;
  status: SubscriptionStatus;
  provider: PaymentProvider;
  providerSubscriptionId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialStart?: Date;
  trialEnd?: Date;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: Date;
  endedAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Billing Types
export enum InvoiceStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  PAID = 'paid',
  VOID = 'void',
  UNCOLLECTIBLE = 'uncollectible',
}

export interface Invoice {
  id: string;
  customerId: string;
  subscriptionId?: string;
  paymentId?: string;
  number: string;
  status: InvoiceStatus;
  amount: number;
  currency: Currency;
  taxAmount?: number;
  discountAmount?: number;
  totalAmount: number;
  dueDate: Date;
  paidAt?: Date;
  voidedAt?: Date;
  items: InvoiceItem[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  metadata?: Record<string, any>;
}

export interface Receipt {
  id: string;
  paymentId: string;
  invoiceId?: string;
  customerId: string;
  amount: number;
  currency: Currency;
  receiptUrl: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

// Refund Types
export enum RefundStatus {
  PENDING = 'pending',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum RefundReason {
  DUPLICATE = 'duplicate',
  FRAUDULENT = 'fraudulent',
  REQUESTED_BY_CUSTOMER = 'requested_by_customer',
  EXPIRED_UNCOLLECTED = 'expired_uncollected',
  OTHER = 'other',
}

export interface Refund {
  id: string;
  paymentId: string;
  amount: number;
  currency: Currency;
  status: RefundStatus;
  reason: RefundReason;
  provider: PaymentProvider;
  providerRefundId: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Webhook Types
export enum WebhookEventType {
  PAYMENT_INTENT_CREATED = 'payment_intent.created',
  PAYMENT_INTENT_SUCCEEDED = 'payment_intent.succeeded',
  PAYMENT_INTENT_FAILED = 'payment_intent.failed',
  PAYMENT_SUCCEEDED = 'payment.succeeded',
  PAYMENT_FAILED = 'payment.failed',
  SUBSCRIPTION_CREATED = 'subscription.created',
  SUBSCRIPTION_UPDATED = 'subscription.updated',
  SUBSCRIPTION_CANCELLED = 'subscription.cancelled',
  INVOICE_CREATED = 'invoice.created',
  INVOICE_PAID = 'invoice.paid',
  REFUND_CREATED = 'refund.created',
  REFUND_SUCCEEDED = 'refund.succeeded',
  DISPUTE_CREATED = 'dispute.created',
  DISPUTE_UPDATED = 'dispute.updated',
}

export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  provider: PaymentProvider;
  providerEventId: string;
  data: Record<string, any>;
  processed: boolean;
  processedAt?: Date;
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: Date;
  errorMessage?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Customer Types
export interface Customer {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  address?: Address;
  taxId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

// Dispute Types
export enum DisputeStatus {
  NEEDS_RESPONSE = 'needs_response',
  UNDER_REVIEW = 'under_review',
  WON = 'won',
  LOST = 'lost',
  WARNING_NEEDS_RESPONSE = 'warning_needs_response',
  WARNING_UNDER_REVIEW = 'warning_under_review',
  WARNING_CLOSED = 'warning_closed',
}

export enum DisputeReason {
  DUPLICATE = 'duplicate',
  FRAUDULENT = 'fraudulent',
  SUBSCRIPTION_CANCELED = 'subscription_canceled',
  PRODUCT_NOT_RECEIVED = 'product_not_received',
  PRODUCT_UNACCEPTABLE = 'product_unacceptable',
  CREDIT_NOT_PROCESSED = 'credit_not_processed',
  GENERAL = 'general',
  INCORRECT_ACCOUNT_DETAILS = 'incorrect_account_details',
  INSUFFICIENT_FUNDS = 'insufficient_funds',
  PRODUCT_NOT_AS_DESCRIBED = 'product_not_as_described',
  CUSTOMER_INITIATED = 'customer_initiated',
}

export interface Dispute {
  id: string;
  paymentId: string;
  amount: number;
  currency: Currency;
  status: DisputeStatus;
  reason: DisputeReason;
  provider: PaymentProvider;
  providerDisputeId: string;
  evidence?: DisputeEvidence;
  dueBy?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface DisputeEvidence {
  customerEmail?: string;
  customerPurchaseIp?: string;
  customerSignature?: string;
  billingAddress?: string;
  customerName?: string;
  customerPhone?: string;
  serviceDate?: string;
  productDescription?: string;
  explanation?: string;
  duplicateChargeId?: string;
  duplicateChargeExplanation?: string;
  duplicateChargeDocumentation?: string;
  refundPolicy?: string;
  refundPolicyDisclosure?: string;
  refundRefusalExplanation?: string;
  cancellationPolicy?: string;
  cancellationPolicyDisclosure?: string;
  cancellationRebuttal?: string;
  customerCommunication?: string;
  uncategorizedText?: string;
  uncategorizedFile?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Request Types
export interface CreatePaymentIntentRequest {
  amount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  provider: PaymentProvider;
  customerId: string;
  description?: string;
  metadata?: Record<string, any>;
  captureMethod?: 'automatic' | 'manual';
  confirm?: boolean;
}

export interface ConfirmPaymentRequest {
  paymentIntentId: string;
  paymentMethodId?: string;
  returnUrl?: string;
  metadata?: Record<string, any>;
}

export interface CreateSubscriptionRequest {
  customerId: string;
  planId: string;
  provider: PaymentProvider;
  paymentMethodId?: string;
  trialDays?: number;
  metadata?: Record<string, any>;
}

export interface UpdateSubscriptionRequest {
  planId?: string;
  paymentMethodId?: string;
  trialDays?: number;
  metadata?: Record<string, any>;
}

export interface CreateRefundRequest {
  paymentId: string;
  amount?: number;
  reason: RefundReason;
  description?: string;
  metadata?: Record<string, any>;
}

// Query Types
export interface PaymentQuery {
  customerId?: string;
  status?: PaymentStatus;
  provider?: PaymentProvider;
  paymentMethod?: PaymentMethod;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  currency?: Currency;
  page?: number;
  limit?: number;
}

export interface SubscriptionQuery {
  customerId?: string;
  status?: SubscriptionStatus;
  provider?: PaymentProvider;
  planId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface InvoiceQuery {
  customerId?: string;
  status?: InvoiceStatus;
  subscriptionId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

// Analytics Types
export interface PaymentAnalytics {
  totalPayments: number;
  totalAmount: number;
  averageAmount: number;
  successRate: number;
  failureRate: number;
  refundRate: number;
  chargebackRate: number;
  byStatus: Record<PaymentStatus, number>;
  byProvider: Record<PaymentProvider, number>;
  byCurrency: Record<Currency, number>;
  byMonth: Array<{
    month: string;
    count: number;
    amount: number;
  }>;
}

export interface SubscriptionAnalytics {
  totalSubscriptions: number;
  activeSubscriptions: number;
  cancelledSubscriptions: number;
  churnRate: number;
  averageLifetime: number;
  byStatus: Record<SubscriptionStatus, number>;
  byPlan: Record<string, number>;
  byProvider: Record<PaymentProvider, number>;
  byMonth: Array<{
    month: string;
    new: number;
    cancelled: number;
    active: number;
  }>;
}

// Health Check Types
export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  checks: {
    database: HealthCheck;
    redis: HealthCheck;
    stripe: HealthCheck;
    paypal: HealthCheck;
    mercadopago: HealthCheck;
    crypto: HealthCheck;
  };
}

export interface HealthCheck {
  status: 'ok' | 'error' | 'warning';
  responseTime?: number;
  error?: string;
  details?: any;
}
