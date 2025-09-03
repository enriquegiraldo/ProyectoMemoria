import React, { useState } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { Card } from '../ui/Card';
import Button  from '../ui/Button';
import { 
  Bell, 
  Check, 
  X, 
  Settings,
  RefreshCw,
  Trash2
} from 'lucide-react';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    subscribeToPush,
    formatTime,
    getNotificationIcon,
    getNotificationColor,
  } = useNotifications();

  const [showSettings, setShowSettings] = useState(false);

  if (!isOpen) return null;

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleRefresh = async () => {
    await refreshNotifications();
  };

  const handleEnablePush = async () => {
    const success = await subscribeToPush();
    if (success) {
      setShowSettings(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'memory':
        return '📝';
      case 'subscription':
        return '💳';
      case 'system':
        return '⚙️';
      case 'social':
        return '👥';
      default:
        return '📢';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50" 
        onClick={onClose}
      />
      
      {/* Notification Panel */}
      <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold">Notificaciones</h3>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleRefresh}
              variant="ghost"
              size="sm"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              onClick={() => setShowSettings(!showSettings)}
              variant="ghost"
              size="sm"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="p-4 border-b bg-gray-50">
            <h4 className="text-sm font-medium mb-3">Configuración</h4>
            <div className="space-y-3">
              <Button
                onClick={handleEnablePush}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Activar Notificaciones Push
              </Button>
              <Button
                onClick={handleMarkAllAsRead}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Marcar Todas como Leídas
              </Button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Cargando notificaciones...</p>
            </div>
          ) : error ? (
            <div className="p-4 text-center">
              <p className="text-red-600">{error}</p>
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                Reintentar
              </Button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No tienes notificaciones</p>
              <p className="text-sm text-gray-400 mt-1">
                Te notificaremos cuando haya novedades
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    !notification.is_read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <span className="text-lg">
                        {getCategoryIcon(notification.category)}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className="text-xs text-gray-400">
                              {formatTime(notification.created_at)}
                            </span>
                            {!notification.is_read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-1 ml-2">
                          {!notification.is_read && (
                            <Button
                              onClick={() => handleMarkAsRead(notification.id)}
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Type indicator */}
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs mt-2 ${getNotificationColor(notification.type)}`}>
                        <span className="mr-1">{getNotificationIcon(notification.type)}</span>
                        {notification.type}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-4 border-t bg-gray-50">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{notifications.length} notificaciones</span>
              {unreadCount > 0 && (
                <span>{unreadCount} sin leer</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
