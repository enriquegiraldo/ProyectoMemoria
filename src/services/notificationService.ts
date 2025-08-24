import { supabase } from '../lib/supabase';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'memory' | 'subscription' | 'system' | 'social';
  data?: Record<string, any>;
  is_read: boolean;
  created_at: string;
  read_at?: string;
}

export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}

export class NotificationService {
  // Obtener notificaciones del usuario
  static async getUserNotifications(userId: string, limit = 20): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return [];
    }
  }

  // Marcar notificación como leída
  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  // Marcar todas las notificaciones como leídas
  static async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  // Obtener contador de notificaciones no leídas
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Crear notificación
  static async createNotification(notification: Omit<Notification, 'id' | 'created_at'>): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          ...notification,
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) throw error;
      return data?.id || null;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }

  // Enviar notificación push
  static async sendPushNotification(
    userId: string, 
    title: string, 
    message: string, 
    data?: Record<string, any>
  ): Promise<boolean> {
    try {
      // Obtener suscripciones push del usuario
      const { data: subscriptions, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      if (!subscriptions || subscriptions.length === 0) return false;

      // Enviar a cada suscripción
      const promises = subscriptions.map(subscription =>
        this.sendToSubscription(subscription, title, message, data)
      );

      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }

  // Enviar notificación a una suscripción específica
  private static async sendToSubscription(
    subscription: PushSubscription,
    title: string,
    message: string,
    data?: Record<string, any>
  ): Promise<void> {
    try {
      const response = await fetch('/api/notifications/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          notification: {
            title,
            message,
            data,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Push notification failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error sending to subscription:', error);
      // Si falla, eliminar la suscripción
      await this.removePushSubscription(subscription.id);
    }
  }

  // Registrar suscripción push
  static async registerPushSubscription(
    userId: string,
    subscription: Omit<PushSubscription, 'id' | 'user_id' | 'created_at'>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .insert({
          ...subscription,
          user_id: userId,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error registering push subscription:', error);
      return false;
    }
  }

  // Eliminar suscripción push
  static async removePushSubscription(subscriptionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('id', subscriptionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing push subscription:', error);
      return false;
    }
  }

  // Notificaciones específicas por tipo
  static async notifyMemoryCreated(userId: string, memoryTitle: string): Promise<void> {
    await this.createNotification({
      user_id: userId,
      title: 'Nueva Memoria Creada',
      message: `Has creado exitosamente la memoria "${memoryTitle}"`,
      type: 'success',
      category: 'memory',
      is_read: false,
      data: { action: 'memory_created' },
    });
  }

  static async notifyMemoryLiked(userId: string, memoryTitle: string, likerName: string): Promise<void> {
    await this.createNotification({
      user_id: userId,
      title: 'Memoria Gustada',
      message: `${likerName} le dio like a tu memoria "${memoryTitle}"`,
      type: 'info',
      category: 'social',
      is_read: false,
      data: { action: 'memory_liked' },
    });
  }

  static async notifySubscriptionUpgraded(userId: string, planName: string): Promise<void> {
    await this.createNotification({
      user_id: userId,
      title: 'Suscripción Actualizada',
      message: `Tu suscripción ha sido actualizada al plan ${planName}`,
      type: 'success',
      category: 'subscription',
      is_read: false,
      data: { action: 'subscription_upgraded' },
    });
  }

  static async notifySystemMaintenance(userId: string, message: string): Promise<void> {
    await this.createNotification({
      user_id: userId,
      title: 'Mantenimiento del Sistema',
      message,
      type: 'warning',
      category: 'system',
      is_read: false,
      data: { action: 'system_maintenance' },
    });
  }

  // Suscribirse a notificaciones push del navegador
  static async subscribeToPushNotifications(userId: string): Promise<boolean> {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('Push notifications not supported');
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      });

      const pushSubscription = {
        endpoint: subscription.endpoint,
        p256dh: btoa(String.fromCharCode.apply(null, 
          new Uint8Array(subscription.getKey('p256dh')!)
        )),
        auth: btoa(String.fromCharCode.apply(null, 
          new Uint8Array(subscription.getKey('auth')!)
        )),
      };

      return await this.registerPushSubscription(userId, pushSubscription);
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return false;
    }
  }

  // Convertir clave VAPID
  private static urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}
