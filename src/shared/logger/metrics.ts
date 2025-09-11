// src/shared/logger/metrics.ts
import { Logger } from 'winston';

export interface MetricEvent {
  userId?: string;
  details?: any;
  requestId?: string;
}

export const createMetricsMethods = (logger: Logger) => ({
  userRegistration: (method: string, success: boolean, requestId?: string) =>
    logger.info('User Registration', { event: 'user_registration', method, success, requestId, timestamp: new Date().toISOString() }),

  subscriptionChange: (userId: string, oldPlan: string, newPlan: string, requestId?: string) =>
    logger.info('Subscription Change', { event: 'subscription_change', userId, oldPlan, newPlan, requestId, timestamp: new Date().toISOString() }),

  featureUsage: (userId: string, feature: string, usage: any, requestId?: string) =>
    logger.info('Feature Usage', { event: 'feature_usage', userId, feature, usage, requestId, timestamp: new Date().toISOString() }),

  memoryCreated: (userId: string, memoryType: string, hasMedia: boolean, requestId?: string) =>
    logger.info('Memory created metric', { event: 'memory_created', userId, memoryType, hasMedia, requestId, timestamp: new Date().toISOString() }),

  userEngagement: (userId: string, action: string, memoryId?: string, requestId?: string) =>
    logger.info('User engagement', { event: 'user_engagement', userId, action, memoryId, requestId, timestamp: new Date().toISOString() }),

  storageUsage: (userId: string, bytesUsed: number, fileCount: number, requestId?: string) =>
    logger.info('Storage usage', { event: 'storage_usage', userId, bytesUsed, fileCount, requestId, timestamp: new Date().toISOString() }),

  searchPerformed: (userId: string, query: string, resultCount: number, duration: number, requestId?: string) =>
    logger.info('Search performed', {
      event: 'search_performed',
      userId,
      query: query.substring(0, 50) + (query.length > 50 ? '...' : ''),
      resultCount,
      duration: `${duration}ms`,
      requestId,
      timestamp: new Date().toISOString(),
    }),
});

//export type { MetricEvent };