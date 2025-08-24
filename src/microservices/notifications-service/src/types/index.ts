// Notification Types
export enum NotificationType {
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms',
  WEBHOOK = 'webhook',
  IN_APP = 'in_app',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

// Email Types
export interface EmailNotification {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  template?: string;
  templateData?: Record<string, any>;
  attachments?: EmailAttachment[];
  replyTo?: string;
  from?: string;
  fromName?: string;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
  cid?: string;
}

export interface EmailProvider {
  name: string;
  enabled: boolean;
  send(notification: EmailNotification): Promise<EmailResult>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: string;
  timestamp: Date;
}

// Push Notification Types
export interface PushNotification {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: Record<string, any>;
  actions?: PushAction[];
  requireInteraction?: boolean;
  silent?: boolean;
  timestamp?: number;
  url?: string;
}

export interface PushAction {
  action: string;
  title: string;
  icon?: string;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushProvider {
  name: string;
  enabled: boolean;
  send(subscription: PushSubscription, notification: PushNotification): Promise<PushResult>;
}

export interface PushResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: string;
  timestamp: Date;
}

// SMS Types
export interface SMSNotification {
  to: string | string[];
  message: string;
  from?: string;
  template?: string;
  templateData?: Record<string, any>;
}

export interface SMSProvider {
  name: string;
  enabled: boolean;
  send(notification: SMSNotification): Promise<SMSResult>;
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: string;
  timestamp: Date;
}

// Webhook Types
export interface WebhookNotification {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  signature?: string;
}

export interface WebhookProvider {
  name: string;
  enabled: boolean;
  send(notification: WebhookNotification): Promise<WebhookResult>;
}

export interface WebhookResult {
  success: boolean;
  statusCode?: number;
  response?: any;
  error?: string;
  provider: string;
  timestamp: Date;
}

// Subscription Types
export interface NotificationSubscription {
  id: string;
  userId: string;
  type: NotificationType;
  provider: string;
  endpoint?: string;
  token?: string;
  preferences: NotificationPreferences;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  inApp: boolean;
  marketing: boolean;
  transactional: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm
    end: string; // HH:mm
    timezone: string;
  };
}

// Template Types
export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  subject?: string;
  title?: string;
  content: string;
  htmlContent?: string;
  variables: string[];
  language: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Schedule Types
export interface NotificationSchedule {
  id: string;
  notification: BaseNotification;
  scheduledAt: Date;
  timezone: string;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: Date;
  };
  status: 'scheduled' | 'sent' | 'cancelled' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

// Base Notification Interface
export interface BaseNotification {
  id?: string;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  userId: string;
  title?: string;
  message: string;
  data?: Record<string, any>;
  metadata?: Record<string, any>;
  scheduledAt?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  error?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  updatedAt: Date;
}

// API Request/Response Types
export interface SendNotificationRequest {
  type: NotificationType;
  userId: string;
  title?: string;
  message: string;
  data?: Record<string, any>;
  priority?: NotificationPriority;
  scheduledAt?: Date;
  template?: string;
  templateData?: Record<string, any>;
}

export interface BatchNotificationRequest {
  notifications: SendNotificationRequest[];
  priority?: NotificationPriority;
  scheduledAt?: Date;
}

export interface ScheduleNotificationRequest {
  notification: SendNotificationRequest;
  scheduledAt: Date;
  timezone?: string;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: Date;
  };
}

export interface CreateSubscriptionRequest {
  userId: string;
  type: NotificationType;
  provider: string;
  endpoint?: string;
  token?: string;
  preferences?: Partial<NotificationPreferences>;
}

export interface UpdatePreferencesRequest {
  userId: string;
  preferences: Partial<NotificationPreferences>;
}

export interface CreateTemplateRequest {
  name: string;
  type: NotificationType;
  subject?: string;
  title?: string;
  content: string;
  htmlContent?: string;
  variables: string[];
  language: string;
}

// Queue Types
export interface NotificationJob {
  id: string;
  notification: BaseNotification;
  attempts: number;
  maxAttempts: number;
  delay?: number;
  priority?: number;
  timestamp: Date;
}

// Metrics Types
export interface NotificationMetrics {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  deliveryRate: number;
  averageDeliveryTime: number;
  providerStats: Record<string, ProviderStats>;
  typeStats: Record<NotificationType, TypeStats>;
}

export interface ProviderStats {
  sent: number;
  delivered: number;
  failed: number;
  deliveryRate: number;
  averageDeliveryTime: number;
}

export interface TypeStats {
  sent: number;
  delivered: number;
  failed: number;
  deliveryRate: number;
}

// Error Types
export interface NotificationError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

// Health Check Types
export interface HealthStatus {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  uptime: number;
  version: string;
  providers: Record<string, ProviderHealth>;
  queue: QueueHealth;
  database: DatabaseHealth;
}

export interface ProviderHealth {
  name: string;
  status: 'healthy' | 'unhealthy';
  responseTime?: number;
  lastCheck: Date;
  error?: string;
}

export interface QueueHealth {
  status: 'healthy' | 'unhealthy';
  pendingJobs: number;
  activeJobs: number;
  completedJobs: number;
  failedJobs: number;
}

export interface DatabaseHealth {
  status: 'healthy' | 'unhealthy';
  responseTime?: number;
  connections: number;
  error?: string;
}
