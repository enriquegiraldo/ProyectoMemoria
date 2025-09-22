// src/shared/logger/processing.ts
import { Logger } from 'winston';

export interface ProcessingEvent {
  userId: string;
  fileId: string;
  jobId: string;
  operation: string;
  progress?: number;
  duration?: number;
  error?: string;
  details?: any;
  requestId?: string;
  type?: string;// aqui la correcion pero sale otro error en otro lado
}

export const createProcessingMethods = (logger: Logger) => ({
  jobQueued: ({ userId, fileId, jobId, operation, details, requestId, type }: ProcessingEvent) =>
    logger.info('Processing job queued', { event: 'processing_job_queued', userId, fileId, jobId, operation, details, requestId, type, timestamp: new Date().toISOString() }),

  jobStarted: ({ userId, fileId, jobId, operation, details, requestId, type }: ProcessingEvent) =>
    logger.info('Processing job started', { event: 'processing_job_started', userId, fileId, jobId, operation, details, requestId, type, timestamp: new Date().toISOString() }),

  jobCompleted: ({ userId, fileId, jobId, operation, duration, details, requestId, type }: ProcessingEvent) =>
    logger.info('Processing job completed', {
      event: 'processing_job_completed',
      userId,
      fileId,
      jobId,
      operation,
      duration: `${duration}ms`,
      details,
      requestId,
      timestamp: new Date().toISOString(),
    }),

  jobFailed: ({ userId, fileId, jobId, operation, error, details, requestId }: ProcessingEvent) =>
    logger.error('Processing job failed', { event: 'processing_job_failed', userId, fileId, jobId, operation, error, details, requestId, timestamp: new Date().toISOString() }),

  progress: ({ userId, fileId, jobId, operation, progress, details, requestId }: ProcessingEvent) =>
    logger.debug('Processing progress', { event: 'processing_progress', userId, fileId, jobId, operation, progress, details, requestId, timestamp: new Date().toISOString() }),
});

//export type { ProcessingEvent };