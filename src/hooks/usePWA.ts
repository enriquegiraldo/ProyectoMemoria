"use client";
import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAState {
  isInstalled: boolean;
  canInstall: boolean;
  isOnline: boolean;
  isStandalone: boolean;
  deferredPrompt: BeforeInstallPromptEvent | null;
}

interface PWAActions {
  install: () => Promise<boolean>;
  checkForUpdate: () => Promise<void>;
  showNotification: (title: string, options?: NotificationOptions) => Promise<void>;
}

export const usePWA = (): PWAState & PWAActions => {
  const [state, setState] = useState<PWAState>({
    isInstalled: false,
    canInstall: false,
    isOnline: navigator.onLine,
    isStandalone: window.matchMedia('(display-mode: standalone)').matches,
    deferredPrompt: null,
  });

  // Verificar si la app está instalada
  const checkIfInstalled = useCallback(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setState(prev => ({ ...prev, isInstalled: isStandalone, isStandalone }));
    return isStandalone;
  }, []);

  // Manejar el evento beforeinstallprompt
  const handleBeforeInstallPrompt = useCallback((e: Event) => {
    e.preventDefault();
    setState(prev => ({
      ...prev,
      canInstall: true,
      deferredPrompt: e as BeforeInstallPromptEvent,
    }));
  }, []);

  // Manejar el evento appinstalled
  const handleAppInstalled = useCallback(() => {
    setState(prev => ({
      ...prev,
      isInstalled: true,
      canInstall: false,
      deferredPrompt: null,
    }));
  }, []);

  // Manejar cambios en la conectividad
  const handleOnlineStatusChange = useCallback(() => {
    setState(prev => ({ ...prev, isOnline: navigator.onLine }));
  }, []);

  // Función para instalar la app
  const install = useCallback(async (): Promise<boolean> => {
    if (!state.deferredPrompt) {
      console.warn('No hay prompt de instalación disponible');
      return false;
    }

    try {
      await state.deferredPrompt.prompt();
      const { outcome } = await state.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('App instalada exitosamente');
        return true;
      } else {
        console.log('Usuario rechazó la instalación');
        return false;
      }
    } catch (error) {
      console.error('Error durante la instalación:', error);
      return false;
    } finally {
      setState(prev => ({ ...prev, deferredPrompt: null, canInstall: false }));
    }
  }, [state.deferredPrompt]);

  // Función para verificar actualizaciones
  const checkForUpdate = useCallback(async (): Promise<void> => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
          console.log('Verificación de actualización completada');
        }
      } catch (error) {
        console.error('Error verificando actualizaciones:', error);
      }
    }
  }, []);

  // Función para mostrar notificaciones
  const showNotification = useCallback(async (
    title: string, 
    options: NotificationOptions = {}
  ): Promise<void> => {
    if (!('Notification' in window)) {
      console.warn('Este navegador no soporta notificaciones');
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/pwa-192x192.svg',
        badge: '/pwa-192x192.svg',
        ...options,
      });
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification(title, {
          icon: '/pwa-192x192.svg',
          badge: '/pwa-192x192.svg',
          ...options,
        });
      }
    }
  }, []);

  // Configurar event listeners
  useEffect(() => {
    // Verificar estado inicial
    checkIfInstalled();

    // Event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);

    // Verificar permisos de notificación
    if ('Notification' in window && Notification.permission === 'default') {
      // Solicitar permisos después de un delay
      setTimeout(() => {
        Notification.requestPermission();
      }, 5000);
    }

    // Verificar actualizaciones periódicamente
    const updateInterval = setInterval(checkForUpdate, 1000 * 60 * 60); // Cada hora

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
      clearInterval(updateInterval);
    };
  }, [checkIfInstalled, handleBeforeInstallPrompt, handleAppInstalled, handleOnlineStatusChange, checkForUpdate]);

  return {
    ...state,
    install,
    checkForUpdate,
    showNotification,
  };
};