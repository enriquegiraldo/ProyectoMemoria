// src/hooks/useNotifications.ts
import { useState, useEffect, useCallback } from 'react';
import { NotificationService, type Notification } from '../services/notificationService';
import { useAuth } from './useAuth';

export interface UseNotificationsReturn {
  // Estado
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  // Acciones
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  subscribeToPush: () => Promise<boolean>;
  removeNotification: (notificationId: string) => Promise<void>;

  // Utilidades
  formatTime: (date: string) => string;
  getNotificationIcon: (type: Notification['type']) => string;
  getNotificationColor: (type: Notification['type']) => string;
}

export function useNotifications(): UseNotificationsReturn {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar notificaciones
  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      const [notificationsData, count] = await Promise.all([
        NotificationService.getUserNotifications(user.id),
        NotificationService.getUnreadCount(user.id),
      ]);

      setNotifications(notificationsData);
      setUnreadCount(count);
    } catch (err) {
      setError('Error al cargar las notificaciones');
      console.error('Error loading notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Marcar como leída
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const success = await NotificationService.markAsRead(notificationId);
      if (success) {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === notificationId
              ? { ...notification, is_read: true, read_at: new Date().toISOString() }
              : notification
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  // Marcar todas como leídas
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;

    try {
      const success = await NotificationService.markAllAsRead(user.id);
      if (success) {
        setNotifications((prev) =>
          prev.map((notification) => ({
            ...notification,
            is_read: true,
            read_at: new Date().toISOString(),
          }))
        );
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, [user?.id]);

  // Eliminar una notificación
  const removeNotification = useCallback(async (notificationId: string) => {
    try {
      const success = await NotificationService.deleteNotification(notificationId);
      if (success) {
        setNotifications((prev) => prev.filter((notification) => notification.id !== notificationId));
        setUnreadCount((prev) =>
          Math.max(0, prev - (notifications.find((n) => n.id === notificationId && !n.is_read) ? 1 : 0))
        );
      }
    } catch (err) {
      console.error('Error removing notification:', err);
    }
  }, [notifications]);

  // Refrescar notificaciones
  const refreshNotifications = useCallback(async () => {
    await loadNotifications();
  }, [loadNotifications]);

  // Suscribirse a notificaciones push
  const subscribeToPush = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const success = await NotificationService.subscribeToNotifications(user.id);
      if (success) {
        console.log('Push notifications enabled successfully');
      }
      return success;
    } catch (err) {
      console.error('Error subscribing to push notifications:', err);
      return false;
    }
  }, [user?.id]);

  // Formatear tiempo
  const formatTime = useCallback((date: string): string => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Ahora mismo';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Hace ${diffInHours}h`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Hace ${diffInDays}d`;

    return notificationDate.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
    });
  }, []);

  // Obtener icono según tipo
  const getNotificationIcon = useCallback((type: Notification['type']): string => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'info':
      default:
        return 'ℹ️';
    }
  }, []);

  // Obtener color según tipo
  const getNotificationColor = useCallback((type: Notification['type']): string => {
    switch (type) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'info':
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  }, []);

  // Cargar notificaciones al montar el componente
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Suscribirse a cambios en tiempo real
  useEffect(() => {
    if (!user?.id) return;

    const channel = NotificationService.subscribeToNotifications(user.id, (newNotification) => {
      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id]);

  return {
    // Estado
    notifications,
    unreadCount,
    isLoading,
    error,

    // Acciones
    markAsRead,
    markAllAsRead,
    removeNotification,
    refreshNotifications,
    subscribeToPush,

    // Utilidades
    formatTime,
    getNotificationIcon,
    getNotificationColor,
  };
}

// Función para suscribirse a notificaciones en tiempo real
function subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
  // Esta función se implementará cuando agreguemos Supabase Realtime
  // Por ahora, simulamos con polling
  const interval = setInterval(async () => {
    try {
      const notifications = await NotificationService.getUserNotifications(userId, 1);
      if (notifications.length > 0) {
        const latest = notifications[0];
        const now = new Date();
        const notificationDate = new Date(latest.created_at);
        const diffInMinutes = (now.getTime() - notificationDate.getTime()) / (1000 * 60);

        // Solo notificar si es muy reciente (últimos 30 segundos)
        if (diffInMinutes < 0.5) {
          callback(latest);
        }
      }
    } catch (error) {
      console.error('Error polling notifications:', error);
    }
  }, 30000); // Poll cada 30 segundos

  return {
    unsubscribe: () => clearInterval(interval),
  };
}

// Agregar la función al servicio
NotificationService.subscribeToNotifications = subscribeToNotifications;