import { Router, Request, Response } from 'express';
import { metrics } from '@/utils';

const router = Router();

/**
 * Prometheus metrics endpoint
 * GET /metrics
 */
router.get('/', (req: Request, res: Response) => {
  res.set('Content-Type', 'text/plain');
  res.end(metrics.getMetrics());
});

/**
 * JSON metrics summary endpoint
 * GET /metrics/summary
 */
router.get('/summary', (req: Request, res: Response) => {
  const summary = {
    timestamp: new Date().toISOString(),
    service: 'notifications-service',
    metrics: {
      http: {
        requests: {
          total: metrics.getHttpRequestCount(),
          byMethod: metrics.getHttpRequestsByMethod(),
          byEndpoint: metrics.getHttpRequestsByEndpoint(),
        },
        duration: {
          average: metrics.getAverageHttpRequestDuration(),
          percentiles: metrics.getHttpRequestDurationPercentiles(),
        },
        errors: {
          total: metrics.getHttpErrorCount(),
          byCode: metrics.getHttpErrorsByCode(),
        },
      },
      notifications: {
        sent: {
          total: metrics.getNotificationSentCount(),
          byType: metrics.getNotificationsSentByType(),
          byProvider: metrics.getNotificationsSentByProvider(),
        },
        failed: {
          total: metrics.getNotificationFailedCount(),
          byType: metrics.getNotificationsFailedByType(),
          byProvider: metrics.getNotificationsFailedByProvider(),
        },
        processing: {
          average: metrics.getAverageNotificationProcessingTime(),
          percentiles: metrics.getNotificationProcessingTimePercentiles(),
        },
      },
      templates: {
        rendered: metrics.getTemplateRenderCount(),
        errors: metrics.getTemplateRenderErrorCount(),
      },
      subscriptions: {
        active: metrics.getActiveSubscriptionCount(),
        created: metrics.getSubscriptionCreatedCount(),
        updated: metrics.getSubscriptionUpdatedCount(),
        deleted: metrics.getSubscriptionDeletedCount(),
      },
      scheduler: {
        scheduled: metrics.getScheduledNotificationCount(),
        executed: metrics.getExecutedNotificationCount(),
        cancelled: metrics.getCancelledNotificationCount(),
        failed: metrics.getFailedNotificationCount(),
      },
      system: {
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        cpu: process.cpuUsage(),
      },
    },
  };

  res.status(200).json(summary);
});

/**
 * Health metrics endpoint
 * GET /metrics/health
 */
router.get('/health', (req: Request, res: Response) => {
  const healthMetrics = {
    timestamp: new Date().toISOString(),
    service: 'notifications-service',
    status: 'healthy',
    metrics: {
      errorRate: metrics.getErrorRate(),
      successRate: metrics.getSuccessRate(),
      averageResponseTime: metrics.getAverageHttpRequestDuration(),
      activeConnections: metrics.getActiveConnections(),
      queueSize: metrics.getQueueSize(),
    },
  };

  res.status(200).json(healthMetrics);
});

export default router;
