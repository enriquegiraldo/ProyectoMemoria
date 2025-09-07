import { z } from 'zod';
import {
  PaymentMethod,
  PaymentProvider,
  Currency,
  RefundReason,
  SubscriptionStatus,
  InvoiceStatus,
  BillingCycle
} from '../types';

// Common validation schemas
export const uuidSchema = z.string().uuid('Invalid UUID format');
export const emailSchema = z.string().email('Invalid email format');
export const amountSchema = z.number().positive('Amount must be positive');
export const currencySchema = z.nativeEnum(Currency);
export const paymentMethodSchema = z.nativeEnum(PaymentMethod);
export const paymentProviderSchema = z.nativeEnum(PaymentProvider);
export const subscriptionStatusSchema = z.nativeEnum(SubscriptionStatus);

// Payment intent validation
export const createPaymentIntentSchema = z.object({
  amount: amountSchema,
  currency: currencySchema,
  paymentMethod: paymentMethodSchema,
  provider: paymentProviderSchema,
  customerId: uuidSchema,
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// Subscription validation
export const createSubscriptionSchema = z.object({
  customerId: uuidSchema,
  planId: uuidSchema,
  provider: paymentProviderSchema,
  paymentMethodId: uuidSchema.optional(),
  trialDays: z.number().optional(),
  metadata: z.record(z.any()).optional(),
});

// Refund validation
export const createRefundSchema = z.object({
  paymentId: uuidSchema,
  amount: amountSchema.optional(),
  reason: z.nativeEnum(RefundReason),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// Query validation schemas
export const paymentQuerySchema = z.object({
  customerId: uuidSchema.optional(),
  status: z.nativeEnum(PaymentStatus).optional(),
  provider: paymentProviderSchema.optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export const subscriptionQuerySchema = z.object({
  customerId: uuidSchema.optional(),
  status: subscriptionStatusSchema.optional(),
  provider: paymentProviderSchema.optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

// Request validation schemas
export const createPaymentIntentRequestSchema = z.object({
  body: createPaymentIntentSchema,
});

export const createSubscriptionRequestSchema = z.object({
  body: createSubscriptionSchema,
});

export const createRefundRequestSchema = z.object({
  body: createRefundSchema,
});

// URL parameter validation schemas
export const idParamSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

// Custom validation functions
export const validateAmount = (amount: number, currency: Currency): boolean => {
  return amount > 0;
};

export const validateCardNumber = (cardNumber: string): boolean => {
  const cleanNumber = cardNumber.replace(/\s+/g, '').replace(/-/g, '');
  return cleanNumber.length >= 13 && cleanNumber.length <= 19;
};

export const validateCvv = (cvv: string): boolean => {
  const cleanCvv = cvv.replace(/\s+/g, '');
  return /^\d{3,4}$/.test(cleanCvv);
};

export const validateExpiryDate = (month: number, year: number): boolean => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  if (year < currentYear || year > currentYear + 20) {
    return false;
  }

  if (month < 1 || month > 12) {
    return false;
  }

  if (year === currentYear && month < currentMonth) {
    return false;
  }

  return true;
};

// Import PaymentStatus for validation functions
import { PaymentStatus } from '../types';
