import { register, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';
import { PaymentStatus, PaymentProvider, PaymentMethod, Currency } from '../types';

// Enable default metrics
collectDefaultMetrics({ register });

// HTTP Metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const httpRequestErrors = new Counter({
  name: 'http_request_errors_total',
  help: 'Total number of HTTP request errors',
  labelNames: ['method', 'route', 'error_type'],
});

// Payment Metrics
export const paymentTotal = new Counter({
  name: 'payments_total',
  help: 'Total number of payments',
  labelNames: ['status', 'provider', 'payment_method', 'currency'],
});

export const paymentAmount = new Counter({
  name: 'payments_amount_total',
  help: 'Total amount of payments',
  labelNames: ['status', 'provider', 'currency'],
});

export const paymentDuration = new Histogram({
  name: 'payment_processing_duration_seconds',
  help: 'Duration of payment processing in seconds',
  labelNames: ['provider', 'payment_method'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
});

export const paymentSuccessRate = new Gauge({
  name: 'payment_success_rate',
  help: 'Payment success rate percentage',
  labelNames: ['provider', 'payment_method'],
});

export const paymentFailureRate = new Gauge({
  name: 'payment_failure_rate',
  help: 'Payment failure rate percentage',
  labelNames: ['provider', 'payment_method'],
});

// Subscription Metrics
export const subscriptionTotal = new Counter({
  name: 'subscriptions_total',
  help: 'Total number of subscriptions',
  labelNames: ['status', 'provider', 'plan'],
});

export const subscriptionActive = new Gauge({
  name: 'subscriptions_active',
  help: 'Number of active subscriptions',
  labelNames: ['provider', 'plan'],
});

export const subscriptionChurnRate = new Gauge({
  name: 'subscription_churn_rate',
  help: 'Subscription churn rate percentage',
  labelNames: ['provider', 'plan'],
});

// Refund Metrics
export const refundTotal = new Counter({
  name: 'refunds_total',
  help: 'Total number of refunds',
  labelNames: ['status', 'provider', 'reason'],
});

export const refundAmount = new Counter({
  name: 'refunds_amount_total',
  help: 'Total amount of refunds',
  labelNames: ['status', 'provider', 'currency'],
});

// Webhook Metrics
export const webhookTotal = new Counter({
  name: 'webhooks_total',
  help: 'Total number of webhook events',
  labelNames: ['provider', 'event_type', 'status'],
});

export const webhookProcessingDuration = new Histogram({
  name: 'webhook_processing_duration_seconds',
  help: 'Duration of webhook processing in seconds',
  labelNames: ['provider', 'event_type'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
});

export const webhookRetryTotal = new Counter({
  name: 'webhook_retries_total',
  help: 'Total number of webhook retries',
  labelNames: ['provider', 'event_type'],
});

// Dispute Metrics
export const disputeTotal = new Counter({
  name: 'disputes_total',
  help: 'Total number of disputes',
  labelNames: ['status', 'provider', 'reason'],
});

export const disputeAmount = new Counter({
  name: 'disputes_amount_total',
  help: 'Total amount of disputes',
  labelNames: ['status', 'provider', 'currency'],
});

// Revenue Metrics
export const revenueTotal = new Counter({
  name: 'revenue_total',
  help: 'Total revenue',
  labelNames: ['currency', 'provider'],
});

export const revenueMonthly = new Gauge({
  name: 'revenue_monthly',
  help: 'Monthly revenue',
  labelNames: ['currency', 'provider', 'year', 'month'],
});

// Error Metrics
export const errorTotal = new Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'provider', 'operation'],
});

// Database Metrics
export const databaseConnections = new Gauge({
  name: 'database_connections',
  help: 'Number of active database connections',
  labelNames: ['state'],
});

export const databaseQueryDuration = new Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5],
});

// Cache Metrics
export const cacheHits = new Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_type'],
});

export const cacheMisses = new Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_type'],
});

export const cacheSize = new Gauge({
  name: 'cache_size',
  help: 'Current cache size',
  labelNames: ['cache_type'],
});

// Business Metrics
export const customerTotal = new Counter({
  name: 'customers_total',
  help: 'Total number of customers',
  labelNames: ['status'],
});

export const customerLifetimeValue = new Histogram({
  name: 'customer_lifetime_value',
  help: 'Customer lifetime value distribution',
  labelNames: ['currency'],
  buckets: [10, 50, 100, 500, 1000, 5000, 10000, 50000],
});

// Helper functions for recording metrics
export const recordPayment = (
  status: PaymentStatus,
  provider: PaymentProvider,
  paymentMethod: PaymentMethod,
  currency: Currency,
  amount: number
) => {
  paymentTotal.inc({ status, provider, payment_method: paymentMethod, currency });
  paymentAmount.inc({ status, provider, currency }, amount);
};

export const recordPaymentDuration = (
  provider: PaymentProvider,
  paymentMethod: PaymentMethod,
  duration: number
) => {
  paymentDuration.observe({ provider, payment_method: paymentMethod }, duration);
};

export const recordWebhook = (
  provider: PaymentProvider,
  eventType: string,
  status: string
) => {
  webhookTotal.inc({ provider, event_type: eventType, status });
};

export const recordWebhookDuration = (
  provider: PaymentProvider,
  eventType: string,
  duration: number
) => {
  webhookProcessingDuration.observe({ provider, event_type: eventType }, duration);
};

export const recordError = (
  type: string,
  provider: PaymentProvider,
  operation: string
) => {
  errorTotal.inc({ type, provider, operation });
};

export const recordHttpRequest = (
  method: string,
  route: string,
  statusCode: number,
  duration: number
) => {
  httpRequestTotal.inc({ method, route, status_code: statusCode.toString() });
  httpRequestDuration.observe({ method, route, status_code: statusCode.toString() }, duration);
};

export const recordHttpError = (
  method: string,
  route: string,
  errorType: string
) => {
  httpRequestErrors.inc({ method, route, error_type: errorType });
};

export const recordDatabaseQuery = (
  operation: string,
  table: string,
  duration: number
) => {
  databaseQueryDuration.observe({ operation, table }, duration);
};

export const recordCacheHit = (cacheType: string) => {
  cacheHits.inc({ cache_type: cacheType });
};

export const recordCacheMiss = (cacheType: string) => {
  cacheMisses.inc({ cache_type: cacheType });
};

export const setCacheSize = (cacheType: string, size: number) => {
  cacheSize.set({ cache_type: cacheType }, size);
};

export const setDatabaseConnections = (state: string, count: number) => {
  databaseConnections.set({ state }, count);
};

export const setSubscriptionActive = (
  provider: PaymentProvider,
  plan: string,
  count: number
) => {
  subscriptionActive.set({ provider, plan }, count);
};

export const setPaymentSuccessRate = (
  provider: PaymentProvider,
  paymentMethod: PaymentMethod,
  rate: number
) => {
  paymentSuccessRate.set({ provider, payment_method: paymentMethod }, rate);
};

export const setPaymentFailureRate = (
  provider: PaymentProvider,
  paymentMethod: PaymentMethod,
  rate: number
) => {
  paymentFailureRate.set({ provider, payment_method: paymentMethod }, rate);
};

export const setSubscriptionChurnRate = (
  provider: PaymentProvider,
  plan: string,
  rate: number
) => {
  subscriptionChurnRate.set({ provider, plan }, rate);
};

export const recordRevenue = (
  currency: Currency,
  provider: PaymentProvider,
  amount: number
) => {
  revenueTotal.inc({ currency, provider }, amount);
};

export const setMonthlyRevenue = (
  currency: Currency,
  provider: PaymentProvider,
  year: number,
  month: number,
  amount: number
) => {
  revenueMonthly.set({ currency, provider, year: year.toString(), month: month.toString() }, amount);
};

// Get metrics as string
export const getMetrics = async (): Promise<string> => {
  return register.metrics();
};

// Get metrics as JSON
export const getMetricsJson = async () => {
  const metrics = await register.getMetricsAsJSON();
  return metrics;
};

export default {
  recordPayment,
  recordPaymentDuration,
  recordWebhook,
  recordWebhookDuration,
  recordError,
  recordHttpRequest,
  recordHttpError,
  recordDatabaseQuery,
  recordCacheHit,
  recordCacheMiss,
  setCacheSize,
  setDatabaseConnections,
  setSubscriptionActive,
  setPaymentSuccessRate,
  setPaymentFailureRate,
  setSubscriptionChurnRate,
  recordRevenue,
  setMonthlyRevenue,
  getMetrics,
  getMetricsJson,
};
