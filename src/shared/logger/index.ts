// src/shared/logger/index.ts
// Exportaciones de valores (funciones)
export { createBaseLogger } from './base';
export { createHttpMiddleware } from './http';
export { createAuditMethods } from './audit';
export { createPerformanceMethods } from './performance';
export { createMetricsMethods } from './metrics';
export { createUploadMethods } from './upload';
export { createProcessingMethods } from './processing';
export { createPaymentMethods } from './payment';
export { createWebhookMethods } from './webhook';
export { createNotificationMethods } from './notification';
export { createSecurityMethods } from './security';

// Exportaciones de tipos (interfaces)
export type { LoggerConfig } from './base';
export type { AuditEvent, SecurityEvent, FileEvent, MemoryEvent, PermissionEvent } from './audit';
export type { PerformanceMetric, DatabaseMetric, ApiMetric, FileMetric, CacheMetric } from './performance';
export type { MetricEvent } from './metrics';
export type { UploadEvent } from './upload';
export type { ProcessingEvent } from './processing';
export type { PaymentEvent } from './payment';
export type { WebhookEvent } from './webhook';
export type { NotificationEvent } from './notification';