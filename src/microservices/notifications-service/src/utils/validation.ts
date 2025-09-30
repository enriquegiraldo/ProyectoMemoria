import { z } from 'zod';

// Base notification schema
export const baseNotificationSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(['email', 'push', 'sms', 'webhook', 'in-app']),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  status: z.enum(['pending', 'sent', 'failed', 'delivered', 'read']).default('pending'),
  userId: z.string().uuid(),
  metadata: z.record(z.any()).optional(),
  scheduledAt: z.date().optional(),
  expiresAt: z.date().optional(),
});

// Email notification schema
export const emailNotificationSchema = baseNotificationSchema.extend({
  type: z.literal('email'),
  to: z.union([z.string().email(), z.array(z.string().email())]),
  from: z.string().email().optional(),
  subject: z.string().min(1).max(200),
  text: z.string().optional(),
  html: z.string().optional(),
  cc: z.union([z.string().email(), z.array(z.string().email())]).optional(),
  bcc: z.union([z.string().email(), z.array(z.string().email())]).optional(),
  replyTo: z.string().email().optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    content: z.instanceof(Buffer),
    contentType: z.string(),
    cid: z.string().optional(),
  })).optional(),
  templateId: z.string().optional(),
  templateData: z.record(z.any()).optional(),
});

// Push notification schema
export const pushNotificationSchema = baseNotificationSchema.extend({
  type: z.literal('push'),
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }).optional(),
  }),
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(500),
  icon: z.string().url().optional(),
  badge: z.string().url().optional(),
  image: z.string().url().optional(),
  tag: z.string().optional(),
  data: z.record(z.any()).optional(),
  actions: z.array(z.object({
    action: z.string(),
    title: z.string(),
    icon: z.string().url().optional(),
  })).optional(),
  requireInteraction: z.boolean().default(false),
  silent: z.boolean().default(false),
  url: z.string().url().optional(),
  topic: z.string().optional(),
});

// SMS notification schema
export const smsNotificationSchema = baseNotificationSchema.extend({
  type: z.literal('sms'),
  to: z.string().regex(/^\+[1-9]\d{1,14}$/), // E.164 format
  from: z.string().optional(),
  body: z.string().min(1).max(1600), // SMS character limit
  mediaUrl: z.string().url().optional(),
  webhookUrl: z.string().url().optional(),
  maxPrice: z.number().positive().optional(),
  provideFeedback: z.boolean().default(false),
  smsType: z.enum(['Transactional', 'Promotional']).default('Transactional'),
  senderId: z.string().max(11).optional(),
});

// Webhook notification schema
export const webhookNotificationSchema = baseNotificationSchema.extend({
  type: z.literal('webhook'),
  url: z.string().url(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).default('POST'),
  headers: z.record(z.string()).optional(),
  payload: z.any(),
  timeout: z.number().positive().max(30000).optional(), // 30 seconds max
  auth: z.object({
    type: z.enum(['basic', 'bearer', 'api-key']),
    username: z.string().optional(),
    password: z.string().optional(),
    token: z.string().optional(),
    apiKey: z.string().optional(),
    headerName: z.string().optional(),
  }).optional(),
  retryCount: z.number().int().min(0).max(5).default(3),
  retryDelay: z.number().positive().default(1000),
});

// In-app notification schema
export const inAppNotificationSchema = baseNotificationSchema.extend({
  type: z.literal('in-app'),
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
  category: z.string().optional(),
  data: z.record(z.any()).optional(),
  read: z.boolean().default(false),
  readAt: z.date().optional(),
});

// Union type for all notification schemas
export const notificationSchema = z.discriminatedUnion('type', [
  emailNotificationSchema,
  pushNotificationSchema,
  smsNotificationSchema,
  webhookNotificationSchema,
  inAppNotificationSchema,
]);

// Subscription schema
export const subscriptionSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid(),
  type: z.enum(['email', 'push', 'sms', 'webhook', 'in-app']),
  channel: z.string(),
  address: z.string(), // email, phone, endpoint, etc.
  preferences: z.object({
    enabled: z.boolean().default(true),
    categories: z.array(z.string()).default([]),
    frequency: z.enum(['immediate', 'daily', 'weekly', 'monthly']).default('immediate'),
    quietHours: z.object({
      enabled: z.boolean().default(false),
      start: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      end: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      timezone: z.string().optional(),
    }).optional(),
  }).default({}),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Template schema
export const templateSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  type: z.enum(['email', 'push', 'sms', 'webhook']),
  subject: z.string().optional(),
  content: z.string().min(1),
  variables: z.array(z.object({
    name: z.string(),
    type: z.enum(['string', 'number', 'boolean', 'date', 'array', 'object']),
    required: z.boolean().default(false),
    defaultValue: z.any().optional(),
    description: z.string().optional(),
  })).default([]),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Schedule schema
export const scheduleSchema = z.object({
  id: z.string().uuid().optional(),
  notificationId: z.string().uuid(),
  cronExpression: z.string().optional(),
  scheduledAt: z.date(),
  timezone: z.string().default('UTC'),
  repeat: z.object({
    enabled: z.boolean().default(false),
    interval: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
    endDate: z.date().optional(),
    maxOccurrences: z.number().int().positive().optional(),
  }).optional(),
  status: z.enum(['pending', 'scheduled', 'executed', 'cancelled', 'failed']).default('pending'),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// API Request/Response schemas
export const sendNotificationRequestSchema = z.object({
  notification: notificationSchema,
  options: z.object({
    priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
    scheduledAt: z.date().optional(),
    expiresAt: z.date().optional(),
    retryCount: z.number().int().min(0).max(5).optional(),
    retryDelay: z.number().positive().optional(),
    preferredProvider: z.string().optional(),
  }).optional(),
});

export const sendBulkNotificationRequestSchema = z.object({
  notifications: z.array(notificationSchema),
  options: z.object({
    batchSize: z.number().int().positive().max(1000).optional(),
    concurrency: z.number().int().positive().max(10).optional(),
    preferredProvider: z.string().optional(),
  }).optional(),
});

export const createSubscriptionRequestSchema = z.object({
  subscription: subscriptionSchema,
});

export const updateSubscriptionRequestSchema = z.object({
  id: z.string().uuid(),
  updates: subscriptionSchema.partial(),
});

export const createTemplateRequestSchema = z.object({
  template: templateSchema,
});

export const updateTemplateRequestSchema = z.object({
  id: z.string().uuid(),
  updates: templateSchema.partial(),
});

export const scheduleNotificationRequestSchema = z.object({
  schedule: scheduleSchema,
});

// Query schemas
export const notificationQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  type: z.enum(['email', 'push', 'sms', 'webhook', 'in-app']).optional(),
  status: z.enum(['pending', 'sent', 'failed', 'delivered', 'read']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(['createdAt', 'updatedAt', 'priority', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const subscriptionQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  type: z.enum(['email', 'push', 'sms', 'webhook', 'in-app']).optional(),
  enabled: z.boolean().optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export const templateQuerySchema = z.object({
  type: z.enum(['email', 'push', 'sms', 'webhook']).optional(),
  name: z.string().optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

// Health check schema
export const healthCheckSchema = z.object({
  status: z.enum(['healthy', 'unhealthy', 'degraded']),
  timestamp: z.date(),
  uptime: z.number(),
  version: z.string(),
  checks: z.record(z.object({
    status: z.enum(['healthy', 'unhealthy']),
    responseTime: z.number().optional(),
    error: z.string().optional(),
  })),
});

// Custom validation functions
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
};

export const validateWebhookUrl = (url: string): boolean => {
  try {
    new URL(url);
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
};

export const validateCronExpression = (cron: string): boolean => {
  const cronRegex = /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/;
  return cronRegex.test(cron);
};

export const validateTemplateVariables = (content: string, variables: any[]): boolean => {
  const variableNames = variables.map(v => v.name);
  const contentVariables = content.match(/\{\{([^}]+)\}\}/g)?.map(v => v.slice(2, -2).trim()) || [];
  
  return contentVariables.every(v => variableNames.includes(v));
};

// Export types
export type EmailNotification = z.infer<typeof emailNotificationSchema>;
export type PushNotification = z.infer<typeof pushNotificationSchema>;
export type SMSNotification = z.infer<typeof smsNotificationSchema>;
export type WebhookNotification = z.infer<typeof webhookNotificationSchema>;
export type InAppNotification = z.infer<typeof inAppNotificationSchema>;
export type Notification = z.infer<typeof notificationSchema>;
export type Subscription = z.infer<typeof subscriptionSchema>;
export type Template = z.infer<typeof templateSchema>;
export type Schedule = z.infer<typeof scheduleSchema>;
export const providerSchema = z.enum(['stripe', 'paypal', 'mercadopago', 'crypto']);