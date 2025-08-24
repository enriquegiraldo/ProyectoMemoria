import { register, Counter, Histogram, Gauge } from 'prom-client';

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

export const httpRequestsInProgress = new Gauge({
  name: 'http_requests_in_progress',
  help: 'Number of HTTP requests currently in progress',
  labelNames: ['method', 'route'],
});

// Notification Metrics
export const notificationsSent = new Counter({
  name: 'notifications_sent_total',
  help: 'Total number of notifications sent',
  labelNames: ['type', 'provider', 'status'],
});

export const notificationDuration = new Histogram({
  name: 'notification_duration_seconds',
  help: 'Duration of notification sending in seconds',
  labelNames: ['type', 'provider'],
  buckets: [0.1, 0.3, 0.5, 1, 2, 5, 10, 30],
});

export const notificationsInQueue = new Gauge({
  name: 'notifications_in_queue',
  help: 'Number of notifications currently in queue',
  labelNames: ['type', 'priority'],
});

export const notificationErrors = new Counter({
  name: 'notification_errors_total',
  help: 'Total number of notification errors',
  labelNames: ['type', 'provider', 'error_type'],
});

// Email Metrics
export const emailSent = new Counter({
  name: 'email_sent_total',
  help: 'Total number of emails sent',
  labelNames: ['provider', 'status'],
});

export const emailDuration = new Histogram({
  name: 'email_duration_seconds',
  help: 'Duration of email sending in seconds',
  labelNames: ['provider'],
  buckets: [0.1, 0.3, 0.5, 1, 2, 5, 10],
});

// Push Metrics
export const pushSent = new Counter({
  name: 'push_sent_total',
  help: 'Total number of push notifications sent',
  labelNames: ['provider', 'status'],
});

export const pushDuration = new Histogram({
  name: 'push_duration_seconds',
  help: 'Duration of push notification sending in seconds',
  labelNames: ['provider'],
  buckets: [0.1, 0.3, 0.5, 1, 2, 5, 10],
});

// SMS Metrics
export const smsSent = new Counter({
  name: 'sms_sent_total',
  help: 'Total number of SMS messages sent',
  labelNames: ['provider', 'status'],
});

export const smsDuration = new Histogram({
  name: 'sms_duration_seconds',
  help: 'Duration of SMS sending in seconds',
  labelNames: ['provider'],
  buckets: [0.1, 0.3, 0.5, 1, 2, 5, 10],
});

// Webhook Metrics
export const webhookSent = new Counter({
  name: 'webhook_sent_total',
  help: 'Total number of webhook notifications sent',
  labelNames: ['provider', 'status'],
});

export const webhookDuration = new Histogram({
  name: 'webhook_duration_seconds',
  help: 'Duration of webhook sending in seconds',
  labelNames: ['provider'],
  buckets: [0.1, 0.3, 0.5, 1, 2, 5, 10, 30],
});

// Template Metrics
export const templateRenders = new Counter({
  name: 'template_renders_total',
  help: 'Total number of template renders',
  labelNames: ['template_type', 'status'],
});

export const templateRenderDuration = new Histogram({
  name: 'template_render_duration_seconds',
  help: 'Duration of template rendering in seconds',
  labelNames: ['template_type'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1],
});

// Subscription Metrics
export const subscriptionChanges = new Counter({
  name: 'subscription_changes_total',
  help: 'Total number of subscription changes',
  labelNames: ['action', 'type'],
});

export const activeSubscriptions = new Gauge({
  name: 'active_subscriptions',
  help: 'Number of active subscriptions',
  labelNames: ['type'],
});

// System Metrics
export const systemMemoryUsage = new Gauge({
  name: 'system_memory_usage_bytes',
  help: 'System memory usage in bytes',
});

export const systemCpuUsage = new Gauge({
  name: 'system_cpu_usage_percent',
  help: 'System CPU usage percentage',
});

export const systemUptime = new Gauge({
  name: 'system_uptime_seconds',
  help: 'System uptime in seconds',
});

// Business Metrics
export const activeUsers = new Gauge({
  name: 'active_users',
  help: 'Number of active users',
});

export const totalNotifications = new Counter({
  name: 'total_notifications',
  help: 'Total number of notifications processed',
  labelNames: ['type'],
});

export const notificationDeliveryRate = new Gauge({
  name: 'notification_delivery_rate',
  help: 'Notification delivery success rate',
  labelNames: ['type', 'provider'],
});

// Rate Limiting Metrics
export const rateLimitViolations = new Counter({
  name: 'rate_limit_violations_total',
  help: 'Total number of rate limit violations',
  labelNames: ['endpoint', 'user_type'],
});

// Error Metrics
export const errorTotal = new Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'severity'],
});

// Metrics utility functions
export const metrics = {
  recordHttpRequest: (method: string, route: string, statusCode: number, duration: number) => {
    httpRequestDuration.labels(method, route, statusCode.toString()).observe(duration);
    httpRequestTotal.labels(method, route, statusCode.toString()).inc();
  },

  recordHttpRequestStart: (method: string, route: string) => {
    httpRequestsInProgress.labels(method, route).inc();
  },

  recordHttpRequestEnd: (method: string, route: string) => {
    httpRequestsInProgress.labels(method, route).dec();
  },

  recordNotificationSent: (type: string, provider: string, status: string) => {
    notificationsSent.labels(type, provider, status).inc();
  },

  recordNotificationDuration: (type: string, provider: string, duration: number) => {
    notificationDuration.labels(type, provider).observe(duration);
  },

  recordEmailSent: (provider: string, status: string, duration: number) => {
    emailSent.labels(provider, status).inc();
    emailDuration.labels(provider).observe(duration);
  },

  recordPushSent: (provider: string, status: string, duration: number) => {
    pushSent.labels(provider, status).inc();
    pushDuration.labels(provider).observe(duration);
  },

  recordSMSSent: (provider: string, status: string, duration: number) => {
    smsSent.labels(provider, status).inc();
    smsDuration.labels(provider).observe(duration);
  },

  recordWebhookSent: (provider: string, status: string, duration: number) => {
    webhookSent.labels(provider, status).inc();
    webhookDuration.labels(provider).observe(duration);
  },

  recordTemplateRender: (templateType: string, status: string, duration: number) => {
    templateRenders.labels(templateType, status).inc();
    templateRenderDuration.labels(templateType).observe(duration);
  },

  recordSubscriptionChange: (action: string, type: string) => {
    subscriptionChanges.labels(action, type).inc();
  },

  recordError: (type: string, severity: string) => {
    errorTotal.labels(type, severity).inc();
  },

  recordRateLimitViolation: (endpoint: string, userType: string) => {
    rateLimitViolations.labels(endpoint, userType).inc();
  },

  updateSystemMetrics: () => {
    const memUsage = process.memoryUsage();
    systemMemoryUsage.set(memUsage.heapUsed);
    
    // CPU usage would need additional monitoring library
    // systemCpuUsage.set(cpuUsage);
    
    systemUptime.set(process.uptime());
  },

  updateBusinessMetrics: (activeUsersCount: number, deliveryRates: Record<string, number>) => {
    activeUsers.set(activeUsersCount);
    
    Object.entries(deliveryRates).forEach(([key, rate]) => {
      const [type, provider] = key.split(':');
      notificationDeliveryRate.labels(type, provider).set(rate);
    });
  },
};

// Register all metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(httpRequestsInProgress);
register.registerMetric(notificationsSent);
register.registerMetric(notificationDuration);
register.registerMetric(notificationsInQueue);
register.registerMetric(notificationErrors);
register.registerMetric(emailSent);
register.registerMetric(emailDuration);
register.registerMetric(pushSent);
register.registerMetric(pushDuration);
register.registerMetric(smsSent);
register.registerMetric(smsDuration);
register.registerMetric(webhookSent);
register.registerMetric(webhookDuration);
register.registerMetric(templateRenders);
register.registerMetric(templateRenderDuration);
register.registerMetric(subscriptionChanges);
register.registerMetric(activeSubscriptions);
register.registerMetric(systemMemoryUsage);
register.registerMetric(systemCpuUsage);
register.registerMetric(systemUptime);
register.registerMetric(activeUsers);
register.registerMetric(totalNotifications);
register.registerMetric(notificationDeliveryRate);
register.registerMetric(rateLimitViolations);
register.registerMetric(errorTotal);

export { register };
