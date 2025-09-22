// src/microservices/media-service/src/utils/metrics.ts
import { register, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';
import { config } from '../config';

// Enable default metrics collection
if (config.monitoring.enableMetrics) {
  collectDefaultMetrics({ register });
}

// HTTP request metrics
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

export const paymentIntentsCreated = new Counter({
  name: 'payment_intents_created_total',
  help: 'Total number of payment intents created',
  labelNames: ['provider'],
});

export const paymentMethodsCreated = new Counter({
  name: 'payment_methods_created_total',
  help: 'Total number of payment methods created',
  labelNames: ['provider'],
});

export const customersCreated = new Counter({
  name: 'customers_created_total',
  help: 'Total number of customers created',
  labelNames: ['provider'],
});

export const refundsCreated = new Counter({
  name: 'refunds_created_total',
  help: 'Total number of refunds created',
  labelNames: ['provider'],
});

export const paymentsProcessed = new Counter({
  name: 'payments_processed_total',
  help: 'Total number of payments processed',
  labelNames: ['provider', 'status'],
});

export const paymentErrors = new Counter({
  name: 'payment_errors_total',
  help: 'Total number of payment errors',
  labelNames: ['provider', 'error'],
});

export const refundsProcessed = new Counter({
  name: 'refunds_processed_total',
  help: 'Total number of refunds processed',
  labelNames: ['provider', 'status', 'reason'],
});

export const subscriptionsCreated = new Counter({
  name: 'subscriptions_created_total',
  help: 'Total number of subscriptions created',
  labelNames: ['provider'],
});

export const subscriptionsUpdated = new Counter({
  name: 'subscriptions_updated_total',
  help: 'Total number of subscriptions updated',
  labelNames: ['provider'],
});

export const subscriptionsCanceled = new Counter({
  name: 'subscriptions_canceled_total',
  help: 'Total number of subscriptions canceled',
  labelNames: ['provider'],
});

export const subscriptionErrors = new Counter({
  name: 'subscription_errors_total',
  help: 'Total number of subscription errors',
  labelNames: ['provider', 'error'],
});

export const httpRequestInProgress = new Gauge({
  name: 'http_requests_in_progress',
  help: 'Number of HTTP requests currently in progress',
  labelNames: ['method', 'route'],
});

// File upload metrics
export const fileUploadTotal = new Counter({
  name: 'file_uploads_total',
  help: 'Total number of file uploads',
  labelNames: ['user_id', 'file_type', 'status'],
});

export const fileUploadSize = new Histogram({
  name: 'file_upload_size_bytes',
  help: 'Size of uploaded files in bytes',
  labelNames: ['file_type'],
  buckets: [1024, 10240, 102400, 1048576, 10485760, 104857600, 1073741824],
});

export const fileUploadDuration = new Histogram({
  name: 'file_upload_duration_seconds',
  help: 'Duration of file uploads in seconds',
  labelNames: ['file_type', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
});

export const fileUploadErrors = new Counter({
  name: 'file_upload_errors_total',
  help: 'Total number of file upload errors',
  labelNames: ['error_type', 'file_type'],
});

// File processing metrics
export const fileProcessingTotal = new Counter({
  name: 'file_processing_total',
  help: 'Total number of file processing jobs',
  labelNames: ['user_id', 'file_type', 'operation', 'status'],
});

export const fileProcessingDuration = new Histogram({
  name: 'file_processing_duration_seconds',
  help: 'Duration of file processing in seconds',
  labelNames: ['file_type', 'operation', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120, 300],
});

export const fileProcessingErrors = new Counter({
  name: 'file_processing_errors_total',
  help: 'Total number of file processing errors',
  labelNames: ['error_type', 'file_type', 'operation'],
});

export const fileProcessingQueueSize = new Gauge({
  name: 'file_processing_queue_size',
  help: 'Current number of files in processing queue',
  labelNames: ['priority'],
});

// Storage metrics
export const storageOperationTotal = new Counter({
  name: 'storage_operations_total',
  help: 'Total number of storage operations',
  labelNames: ['operation', 'provider', 'status'],
});

export const storageOperationDuration = new Histogram({
  name: 'storage_operation_duration_seconds',
  help: 'Duration of storage operations in seconds',
  labelNames: ['operation', 'provider'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
});

export const storageOperationErrors = new Counter({
  name: 'storage_operation_errors_total',
  help: 'Total number of storage operation errors',
  labelNames: ['error_type', 'operation', 'provider'],
});

export const storageUsageBytes = new Gauge({
  name: 'storage_usage_bytes',
  help: 'Current storage usage in bytes',
  labelNames: ['user_id', 'provider'],
});

// CDN metrics
export const cdnOperationTotal = new Counter({
  name: 'cdn_operations_total',
  help: 'Total number of CDN operations',
  labelNames: ['operation', 'provider', 'status'],
});

export const cdnOperationDuration = new Histogram({
  name: 'cdn_operation_duration_seconds',
  help: 'Duration of CDN operations in seconds',
  labelNames: ['operation', 'provider'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
});

export const cdnCacheHitRatio = new Gauge({
  name: 'cdn_cache_hit_ratio',
  help: 'CDN cache hit ratio',
  labelNames: ['provider'],
});

// System metrics
export const systemMemoryUsage = new Gauge({
  name: 'system_memory_usage_bytes',
  help: 'Current memory usage in bytes',
  labelNames: ['type'],
});

export const systemCpuUsage = new Gauge({
  name: 'system_cpu_usage_percent',
  help: 'Current CPU usage percentage',
});

export const systemDiskUsage = new Gauge({
  name: 'system_disk_usage_bytes',
  help: 'Current disk usage in bytes',
  labelNames: ['path'],
});

export const systemUptime = new Gauge({
  name: 'system_uptime_seconds',
  help: 'System uptime in seconds',
});

// Business metrics
export const activeUsers = new Gauge({
  name: 'active_users_total',
  help: 'Number of active users',
  labelNames: ['role'],
});

export const totalFiles = new Gauge({
  name: 'total_files',
  help: 'Total number of files',
  labelNames: ['file_type', 'status'],
});

export const totalStorageUsed = new Gauge({
  name: 'total_storage_used_bytes',
  help: 'Total storage used in bytes',
  labelNames: ['file_type'],
});

// Rate limiting metrics
export const rateLimitExceeded = new Counter({
  name: 'rate_limit_exceeded_total',
  help: 'Total number of rate limit violations',
  labelNames: ['user_id', 'endpoint', 'limit_type'],
});

export const rateLimitRemaining = new Gauge({
  name: 'rate_limit_remaining',
  help: 'Remaining requests for rate limiting',
  labelNames: ['user_id', 'endpoint', 'limit_type'],
});

// Error metrics
export const errorTotal = new Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['error_type', 'error_code', 'service'],
});

export const errorRate = new Gauge({
  name: 'error_rate',
  help: 'Error rate per minute',
  labelNames: ['error_type'],
});

// Performance metrics
export const responseTimePercentile = new Histogram({
  name: 'response_time_percentile_seconds',
  help: 'Response time percentiles',
  labelNames: ['endpoint', 'method'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

export const throughputRequestsPerSecond = new Gauge({
  name: 'throughput_requests_per_second',
  help: 'Requests per second throughput',
  labelNames: ['endpoint'],
});

// Utility functions for metrics
export const metrics = {
  recordPayment: (status: string, provider: string, paymentMethod: any, currency: string, amount: number) => { 
    paymentIntentsCreated.inc({ provider });//lo agrago la IA del vscode copilot despues de pegar tu sigerencia 
    paymentMethodsCreated.inc({ provider });//lo agrago la IA del vscode copilot despues de pegar tu sigerencia 
    customersCreated.inc({ provider });//lo agrago la IA del vscode copilot despues de pegar tu sigerencia 
    refundsCreated.inc({ provider });//lo agrago la IA del vscode copilot despues de pegar tu sigerencia 
    paymentsProcessed.inc({ provider, status });//lo agrago la IA del vscode copilot despues de pegar tu sigerencia 
    paymentErrors.inc({ provider, error: paymentMethod.error });//lo agrago la IA del vscode copilot despues de pegar tu sigerencia 
    refundsProcessed.inc({ provider, status, reason: paymentMethod.reason });//lo agrago la IA del vscode copilot despues de pegar tu sigerencia 
    subscriptionsCreated.inc({ provider });//lo agrago la IA del vscode copilot despues de pegar tu sigerencia 
    subscriptionsUpdated.inc({ provider });//lo agrago la IA del vscode copilot despues de pegar tu sigerencia 
    subscriptionsCanceled.inc({ provider });//lo agrago la IA del vscode copilot despues de pegar tu sigerencia 
    subscriptionErrors.inc({ provider, error: paymentMethod.error });//lo agrago la IA del vscode copilot despues de pegar tu sigerencia 
    paymentMethod.amount = amount;//lo agrago la IA del vscode copilot despues de pegar tu sigerencia 
    paymentMethod.currency = currency;//lo agrago la IA del vscode copilot despues de pegar tu sigerencia 

    // Implementación existente
  },
  httpRequestDuration,
  httpRequestTotal,
  httpRequestsInProgress,
  paymentIntentsCreated,
  paymentMethodsCreated,
  customersCreated,
  refundsCreated,
  paymentsProcessed,
  paymentErrors,
  refundsProcessed,
  subscriptionsCreated,
  subscriptionsUpdated,
  subscriptionsCanceled,
  subscriptionErrors,
  // ... otras funciones existentes ...
  // HTTP metrics
  recordHttpRequest: (method: string, route: string, statusCode: number, duration: number) => {
    httpRequestDuration.observe({ method, route, status_code: statusCode }, duration);
    httpRequestTotal.inc({ method, route, status_code: statusCode });
  },

  startHttpRequest: (method: string, route: string) => {
    httpRequestInProgress.inc({ method, route });
  },

  endHttpRequest: (method: string, route: string) => {
    httpRequestInProgress.dec({ method, route });
  },

  // File upload metrics
  recordFileUpload: (userId: string, fileType: string, status: string, size: number, duration: number) => {
    fileUploadTotal.inc({ user_id: userId, file_type: fileType, status });
    fileUploadSize.observe({ file_type: fileType }, size);
    fileUploadDuration.observe({ file_type: fileType, status }, duration);
  },

  recordFileUploadError: (errorType: string, fileType: string) => {
    fileUploadErrors.inc({ error_type: errorType, file_type: fileType });
  },

  // File processing metrics
  recordFileProcessing: (userId: string, fileType: string, operation: string, status: string, duration: number) => {
    fileProcessingTotal.inc({ user_id: userId, file_type: fileType, operation, status });
    fileProcessingDuration.observe({ file_type: fileType, operation, status }, duration);
  },

  recordFileProcessingError: (errorType: string, fileType: string, operation: string) => {
    fileProcessingErrors.inc({ error_type: errorType, file_type: fileType, operation });
  },

  setProcessingQueueSize: (priority: string, size: number) => {
    fileProcessingQueueSize.set({ priority }, size);
  },

  // Storage metrics
  recordStorageOperation: (operation: string, provider: string, status: string, duration: number) => {
    storageOperationTotal.inc({ operation, provider, status });
    storageOperationDuration.observe({ operation, provider }, duration);
  },

  recordStorageError: (errorType: string, operation: string, provider: string) => {
    storageOperationErrors.inc({ error_type: errorType, operation, provider });
  },

  setStorageUsage: (userId: string, provider: string, usage: number) => {
    storageUsageBytes.set({ user_id: userId, provider }, usage);
  },

  // CDN metrics
  recordCdnOperation: (operation: string, provider: string, status: string, duration: number) => {
    cdnOperationTotal.inc({ operation, provider, status });
    cdnOperationDuration.observe({ operation, provider }, duration);
  },

  setCdnCacheHitRatio: (provider: string, ratio: number) => {
    cdnCacheHitRatio.set({ provider }, ratio);
  },

  // System metrics
  setSystemMemoryUsage: (type: string, usage: number) => {
    systemMemoryUsage.set({ type }, usage);
  },

  setSystemCpuUsage: (usage: number) => {
    systemCpuUsage.set(usage);
  },

  setSystemDiskUsage: (path: string, usage: number) => {
    systemDiskUsage.set({ path }, usage);
  },

  setSystemUptime: (uptime: number) => {
    systemUptime.set(uptime);
  },

  // Business metrics
  setActiveUsers: (role: string, count: number) => {
    activeUsers.set({ role }, count);
  },

  setTotalFiles: (fileType: string, status: string, count: number) => {
    totalFiles.set({ file_type: fileType, status }, count);
  },

  setTotalStorageUsed: (fileType: string, usage: number) => {
    totalStorageUsed.set({ file_type: fileType }, usage);
  },

  // Rate limiting metrics
  recordRateLimitExceeded: (userId: string, endpoint: string, limitType: string) => {
    rateLimitExceeded.inc({ user_id: userId, endpoint, limit_type: limitType });
  },

  setRateLimitRemaining: (userId: string, endpoint: string, limitType: string, remaining: number) => {
    rateLimitRemaining.set({ user_id: userId, endpoint, limit_type: limitType }, remaining);
  },

  // Error metrics
  recordError: (errorType: string, errorCode: string, service: string) => {
    errorTotal.inc({ error_type: errorType, error_code: errorCode, service });
  },

  setErrorRate: (errorType: string, rate: number) => {
    errorRate.set({ error_type: errorType }, rate);
  },

  // Performance metrics
  recordResponseTime: (endpoint: string, method: string, duration: number) => {
    responseTimePercentile.observe({ endpoint, method }, duration);
  },

  setThroughput: (endpoint: string, requestsPerSecond: number) => {
    throughputRequestsPerSecond.set({ endpoint }, requestsPerSecond);
  },
};

// Metrics middleware
export const metricsMiddleware = (req: any, res: any, next: any) => {
  const start = Date.now();
  const method = req.method;
  const route = req.route?.path || req.path || 'unknown';

  // Start request tracking
  metrics.startHttpRequest(method, route);

  // Override res.end to capture metrics
  const originalEnd = res.end;
  res.end = function(chunk: any, encoding: any) {
    const duration = (Date.now() - start) / 1000;
    const statusCode = res.statusCode;

    // Record metrics
    metrics.recordHttpRequest(method, route, statusCode, duration);
    metrics.endHttpRequest(method, route);

    // Call original end
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Health check metrics
export const healthCheckMetrics = {
  recordHealthCheck: (status: 'healthy' | 'unhealthy' | 'degraded', duration: number) => {
    const healthCheckDuration = new Histogram({
      name: 'health_check_duration_seconds',
      help: 'Duration of health checks in seconds',
      labelNames: ['status'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    });

    healthCheckDuration.observe({ status }, duration);
  },
};

// Custom metrics collector
export const customMetricsCollector = {
  collect: async () => {
    // Collect system metrics
    const memUsage = process.memoryUsage();
    metrics.setSystemMemoryUsage('rss', memUsage.rss);
    metrics.setSystemMemoryUsage('heapUsed', memUsage.heapUsed);
    metrics.setSystemMemoryUsage('heapTotal', memUsage.heapTotal);
    metrics.setSystemMemoryUsage('external', memUsage.external);

    // Set uptime
    metrics.setSystemUptime(process.uptime());

    // Collect CPU usage (simplified)
    const startUsage = process.cpuUsage();
    await new Promise(resolve => setTimeout(resolve, 100));
    const endUsage = process.cpuUsage(startUsage);
    const cpuUsage = (endUsage.user + endUsage.system) / 1000000; // Convert to seconds
    metrics.setSystemCpuUsage(cpuUsage);
  },
};

// Export register for metrics endpoint
export { register };


//