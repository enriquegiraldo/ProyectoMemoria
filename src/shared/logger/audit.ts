// src/shared/logger/audit.ts
import { Logger } from 'winston';

// Interfaces para type-safety
export interface AuditEvent {
  userId: string;
  action: string;
  resource: string;
  ip?: string;
  actor?: string;
  details?: any;
  requestId?: string; // Para correlación de trazas
}

export interface SecurityEvent {
  userId?: string;
  event: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip?: string;
  source?: string;
  details?: any;
  requestId?: string;
  
}

export interface FileEvent {
  userId: string;
  fileId: string;
  fileName?: string;
  fileSize?: number;
  ip: string;
  action?: string;
  jobId?: string;
  operation?: string;
  duration?: number;
  details?: any;
  requestId?: string;
}

export interface MemoryEvent {
  userId: string;
  memoryId: string;
  action?: string;
  ip: string;
  details?: any;
  requestId?: string;
}

export interface PermissionEvent {
  userId: string;
  targetUserId: string;
  action: string;
  ip: string;
  details?: any;
  requestId?: string;
}

export const createAuditMethods = (logger: Logger) => ({
  // Autenticación
  login: (userId: string, method: string, success: boolean, ip: string, userAgent?: string, requestId?: string) =>
    logger.info('User Login', { event: 'login', userId, method, success, ip, userAgent, requestId, timestamp: new Date().toISOString() }),

  logout: (userId: string, ip: string, requestId?: string) =>
    logger.info('User Logout', { event: 'logout', userId, ip, requestId, timestamp: new Date().toISOString() }),

  passwordChange: (userId: string, ip: string, requestId?: string) =>
    logger.info('Password Changed', { event: 'password_change', userId, ip, requestId, timestamp: new Date().toISOString() }),

  twoFactorEnabled: (userId: string, method: string, actor: string = 'unknown', ip?: string, requestId?: string) =>
    logger.info('[AUDIT] 2FA enabled', { event: '2fa_enabled', userId, method, actor, ip, requestId, timestamp: new Date().toISOString() }),

  twoFactorDisabled: (userId: string, actor: string = 'unknown', ip?: string, requestId?: string) =>
    logger.info('[AUDIT] 2FA disabled', { event: '2fa_disabled', userId, actor, ip, requestId, timestamp: new Date().toISOString() }),

  ssoLogin: (userId: string, provider: string, ip: string, requestId?: string) =>
    logger.info('SSO Login', { event: 'sso_login', userId, provider, ip, requestId, timestamp: new Date().toISOString() }),

  permissionDenied: (userId: string, action: string, resource: string, ip: string, requestId?: string) =>
    logger.warn('Permission Denied', { event: 'permission_denied', userId, action, resource, ip, requestId, timestamp: new Date().toISOString() }),

  // Datos
  dataAccess: ({ userId, action, resource, ip, actor = 'unknown', details, requestId }: AuditEvent) =>
    logger.info('[AUDIT] Data access', { event: 'data_access', userId, action, resource, actor, ip, details, requestId, timestamp: new Date().toISOString() }),

  dataExport: (userId: string, dataType: string, ip: string, requestId?: string) =>
    logger.info('Data Export', { event: 'data_export', userId, dataType, ip, requestId, timestamp: new Date().toISOString() }),

  dataDeletion: (userId: string, dataType: string, ip: string, requestId?: string) =>
    logger.info('Data Deletion', { event: 'data_deletion', userId, dataType, ip, requestId, timestamp: new Date().toISOString() }),

  // Archivos (Media Service)
  fileUploaded: ({ userId, fileId, fileName, fileSize, ip, details, requestId }: FileEvent) =>
    logger.info('File uploaded', { event: 'file_uploaded', userId, fileId, fileName, fileSize, ip, details, requestId, timestamp: new Date().toISOString() }),

  fileAccessed: ({ userId, fileId, action, ip, details, requestId }: FileEvent) =>
    logger.info('File accessed', { event: 'file_accessed', userId, fileId, action, ip, details, requestId, timestamp: new Date().toISOString() }),

  fileDeleted: ({ userId, fileId, ip, details, requestId }: FileEvent) =>
    logger.info('File deleted', { event: 'file_deleted', userId, fileId, ip, details, requestId, timestamp: new Date().toISOString() }),

  // Procesamiento (Media Service)
  processingStarted: ({ userId, fileId, jobId, operation, ip, details, requestId }: FileEvent) =>
    logger.info('Processing started', { event: 'processing_started', userId, fileId, jobId, operation, ip, details, requestId, timestamp: new Date().toISOString() }),

  processingCompleted: ({ userId, fileId, jobId, operation, duration, details, requestId }: FileEvent) =>
    logger.info('Processing completed', { event: 'processing_completed', userId, fileId, jobId, operation, duration, details, requestId, timestamp: new Date().toISOString() }),

  // Memorias (Memories Service)
  memoryCreated: ({ userId, memoryId, ip, details, requestId }: MemoryEvent) =>
    logger.info('Memory created', { event: 'memory_created', userId, memoryId, ip, details, requestId, timestamp: new Date().toISOString() }),

  memoryModified: ({ userId, memoryId, action, ip, details, requestId }: MemoryEvent) =>
    logger.info('Memory modified', { event: 'memory_modified', userId, memoryId, action, ip, details, requestId, timestamp: new Date().toISOString() }),

  memoryDeleted: ({ userId, memoryId, ip, details, requestId }: MemoryEvent) =>
    logger.info('Memory deleted', { event: 'memory_deleted', userId, memoryId, ip, details, requestId, timestamp: new Date().toISOString() }),

  // Permisos
  permissionChanged: ({ userId, targetUserId, action, ip, details, requestId }: PermissionEvent) =>
    logger.info('Permission changed', { event: 'permission_changed', userId, targetUserId, action, ip, details, requestId, timestamp: new Date().toISOString() }),

  // Seguridad
  suspiciousActivity: (userId: string, activity: string, source: string = 'unknown', ip?: string, details?: any, requestId?: string) =>
    logger.warn('[AUDIT] Suspicious activity', { event: 'suspicious_activity', userId, activity, source, ip, details, requestId, timestamp: new Date().toISOString() }),

  securityEvent: ({ userId, event, severity, ip, source, details, requestId }: SecurityEvent) =>
    logger.warn('Security event', { event, severity, userId, ip, source, details, requestId, timestamp: new Date().toISOString() }),
});

//export type { AuditEvent, SecurityEvent, FileEvent, MemoryEvent, PermissionEvent }; 