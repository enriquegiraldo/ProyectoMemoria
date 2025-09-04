// src/utils/logger.ts
export const logger = {
  info: (message: string, meta?: any) => console.log(`[INFO] ${message}`, meta),
  warn: (message: string, meta?: any) => console.warn(`[WARN] ${message}`, meta),
  error: (message: string, meta?: any) => console.error(`[ERROR] ${message}`, meta),
};

export const auditLogger = {
  dataAccess: (userId: string, action: string, resource: string, actor: string) =>
    console.log(`[AUDIT] ${userId} ${action} ${resource} by ${actor}`),
  suspiciousActivity: (userId: string, event: string, actor: string, meta?: any) =>
    console.log(`[AUDIT] Suspicious ${event} by ${userId} (${actor})`, meta),
  twoFactorEnabled: (userId: string, method: string, actor: string) =>
    console.log(`[AUDIT] 2FA enabled for ${userId} (${method}) by ${actor}`),
  twoFactorDisabled: (userId: string, actor: string) =>
    console.log(`[AUDIT] 2FA disabled for ${userId} by ${actor}`),
};