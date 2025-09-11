// src/shared/logger/upload.ts
import { Logger } from 'winston';

export interface UploadEvent {
  userId: string;
  fileId: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  error?: string;
  reason?: string;
  duration?: number;
  details?: any;
  requestId?: string;
}

export const createUploadMethods = (logger: Logger) => ({
  started: ({ userId, fileId, fileName, fileSize, mimeType, details, requestId }: UploadEvent) =>
    logger.info('Upload started', { event: 'upload_started', userId, fileId, fileName, fileSize, mimeType, details, requestId, timestamp: new Date().toISOString() }),

  completed: ({ userId, fileId, fileName, duration, details, requestId }: UploadEvent) =>
    logger.info('Upload completed', { event: 'upload_completed', userId, fileId, fileName, duration: `${duration}ms`, details, requestId, timestamp: new Date().toISOString() }),

  failed: ({ userId, fileId, fileName, error, details, requestId }: UploadEvent) =>
    logger.error('Upload failed', { event: 'upload_failed', userId, fileId, fileName, error, details, requestId, timestamp: new Date().toISOString() }),

  validationFailed: ({ userId, fileName, reason, details, requestId }: UploadEvent) =>
    logger.warn('Upload validation failed', { event: 'upload_validation_failed', userId, fileName, reason, details, requestId, timestamp: new Date().toISOString() }),
});

//export type { UploadEvent };