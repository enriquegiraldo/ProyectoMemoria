// src/shared/logger/performance.ts
import { Logger } from 'winston';

export interface PerformanceMetric {
  operation: string;
  duration: number;
  details?: any;
  requestId?: string;
}

export interface DatabaseMetric extends PerformanceMetric {
  query: string;
  table?: string;
  success?: boolean;
  userId?: string;
}

export interface ApiMetric extends PerformanceMetric {
  endpoint: string;
  method: string;
  statusCode: number;
  userId?: string;
}

export interface FileMetric extends PerformanceMetric { //aqui el error
  fileId: string;
  fileSize?: number;
  userId?: string;
  jobId?: string;
  operation: string;
}

export interface CacheMetric extends PerformanceMetric {
  key: string;
  operation: 'hit' | 'miss' | 'set' | 'delete';
}

export const createPerformanceMethods = (logger: Logger) => ({
  databaseQuery: ({ query, duration, success, table, userId, details, requestId }: DatabaseMetric) =>
    logger.info('Database Query', {
      event: 'database_query',
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      duration: `${duration}ms`,
      success,
      table,
      userId,
      details,
      requestId,
      timestamp: new Date().toISOString(),
    }),

  externalApiCall: (service: string, endpoint: string, duration: number, success: boolean, details?: any, requestId?: string) =>
    logger.info('External API Call', {
      event: 'external_api_call',
      service,
      endpoint,
      duration: `${duration}ms`,
      success,
      details,
      requestId,
      timestamp: new Date().toISOString(),
    }),

  cacheHit: ({ key, duration, requestId }: CacheMetric) =>
    logger.debug('Cache Hit', {
      event: 'cache_hit',
      key: key.substring(0, 50) + (key.length > 50 ? '...' : ''),
      duration: `${duration}ms`,
      requestId,
      timestamp: new Date().toISOString(),
    }),

  cacheMiss: ({ key, duration, requestId }: CacheMetric) =>
    logger.debug('Cache Miss', {
      event: 'cache_miss',
      key: key.substring(0, 50) + (key.length > 50 ? '...' : ''),
      duration: `${duration}ms`,
      requestId,
      timestamp: new Date().toISOString(),
    }),

  cacheOperation: ({ operation, key, duration, details, requestId }: CacheMetric) =>
    logger.debug('Cache operation', {
      event: 'cache_operation',
      operation,
      key: key.substring(0, 50) + (key.length > 50 ? '...' : ''),
      duration: `${duration}ms`,
      details,
      requestId,
      timestamp: new Date().toISOString(),
    }),

  uploadTime: ({ userId, fileId, fileSize, duration, details, requestId }: FileMetric) =>
    logger.info('Upload performance', {
      event: 'upload_performance',
      userId,
      fileId,
      fileSize,
      duration: `${duration}ms`,
      details,
      requestId,
      timestamp: new Date().toISOString(),
    }),

  processingTime: ({ userId, fileId, jobId, operation, duration, details, requestId }: FileMetric) =>
    logger.info('Processing performance', {
      event: 'processing_performance',
      userId,
      fileId,
      jobId,
      operation,
      duration: `${duration}ms`,
      details,
      requestId,
      timestamp: new Date().toISOString(),
    }),

  storageOperation: (userId: string, operation: string, provider: string, duration: number, details?: any, requestId?: string) =>
    logger.info('Storage operation', {
      event: 'storage_operation',
      userId,
      operation,
      provider,
      duration: `${duration}ms`,
      details,
      requestId,
      timestamp: new Date().toISOString(),
    }),

  cdnOperation: (userId: string, operation: string, duration: number, details?: any, requestId?: string) =>
    logger.info('CDN operation', {
      event: 'cdn_operation',
      userId,
      operation,
      duration: `${duration}ms`,
      details,
      requestId,
      timestamp: new Date().toISOString(),
    }),

  apiResponse: ({ endpoint, method, duration, statusCode, userId, details, requestId }: ApiMetric) =>
    logger.info('API response', {
      event: 'api_response',
      endpoint,
      method,
      duration: `${duration}ms`,
      statusCode,
      userId,
      details,
      requestId,
      timestamp: new Date().toISOString(),
    }),

  fileProcessing: ({ fileId, operation, duration, fileSize, userId, details, requestId }: FileMetric) =>
    logger.info('File processing', {
      event: 'file_processing',
      fileId,
      operation,
      duration: `${duration}ms`,
      fileSize,
      userId,
      details,
      requestId,
      timestamp: new Date().toISOString(),
    }),
});

//export type { PerformanceMetric, DatabaseMetric, ApiMetric, FileMetric, CacheMetric };