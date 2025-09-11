// src/shared/logger/notification.ts
import { Logger } from 'winston';

export interface NotificationEvent {
  userId: string;
  notificationId: string;
  type: string;
  channel: string;
  success: boolean;
  details?: any;
  requestId?: string;
}

export const createNotificationMethods = (logger: Logger) => ({
  log: (level: 'info' | 'warn' | 'error', message: string, { userId, notificationId, type, channel, success, details, requestId }: NotificationEvent) =>
    logger.log(level, message, { event: 'notification_event', userId, notificationId, type, channel, success, details, requestId, timestamp: new Date().toISOString() }),
});

//export type { NotificationEvent };