// Registro del Service Worker para PWA
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('Service Worker registrado exitosamente:', registration);

      // Manejar actualizaciones del Service Worker
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nueva versión disponible
              console.log('Nueva versión de la app disponible');
              
              // Mostrar notificación de actualización
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Memoria Eterna', {
                  body: 'Hay una nueva versión disponible. Recarga la página para actualizar.',
                  icon: '/pwa-192x192.svg',
                  badge: '/pwa-192x192.svg',
                  requireInteraction: true,
                });
              }

              // Emitir evento personalizado para que la UI pueda mostrar un prompt de actualización
              window.dispatchEvent(new CustomEvent('sw-update-available'));
            }
          });
        }
      });

      // Manejar cuando el Service Worker toma control
      if (navigator.serviceWorker.controller) {
        console.log('Service Worker ya está controlando la página');
      }

      // Escuchar mensajes del Service Worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { data } = event;
        console.log('Mensaje del Service Worker:', data);
      });

      return registration;
    } catch (error) {
      console.error('Error registrando Service Worker:', error);
      return null;
    }
  } else {
    console.warn('Service Worker no soportado en este navegador');
    return null;
  }
};

// Función para actualizar la aplicación
export const updateApp = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.waiting) {
        // Enviar mensaje al Service Worker para activar la nueva versión
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        
        // Recargar la página cuando el nuevo Service Worker tome control
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        });
      }
    } catch (error) {
      console.error('Error actualizando la app:', error);
    }
  }
};

// Función para limpiar el caché
export const clearCache = async () => {
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
      console.log('Caché limpiado exitosamente');
    } catch (error) {
      console.error('Error limpiando caché:', error);
    }
  }
};

// Función para verificar si la app está en modo standalone
export const isStandalone = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches;
};

// Función para verificar si la app puede ser instalada
export const canInstall = (): boolean => {
  return 'BeforeInstallPromptEvent' in window;
};

// Función para solicitar permisos de notificación
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if ('Notification' in window) {
    return await Notification.requestPermission();
  }
  return 'denied';
};

// Función para mostrar notificación
export const showNotification = async (
  title: string,
  options: NotificationOptions = {}
): Promise<void> => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/pwa-192x192.svg',
      badge: '/pwa-192x192.svg',
      ...options,
    });
  }
};

// Función para obtener información del Service Worker
export const getSWInfo = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        return {
          scope: registration.scope,
          updateViaCache: registration.updateViaCache,
          installing: !!registration.installing,
          waiting: !!registration.waiting,
          active: !!registration.active,
        };
      }
    } catch (error) {
      console.error('Error obteniendo información del SW:', error);
    }
  }
  return null;
};

// Función para verificar conectividad
export const checkConnectivity = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/health', { 
      method: 'HEAD',
      cache: 'no-cache'
    });
    return response.ok;
  } catch {
    return false;
  }
};

// Función para sincronizar datos offline
export const syncOfflineData = async () => {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.sync.register('offline-sync');
        console.log('Sincronización offline registrada');
      }
    } catch (error) {
      console.error('Error registrando sincronización:', error);
    }
  }
};

// Función para obtener estadísticas de caché
export const getCacheStats = async () => {
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      const stats = await Promise.all(
        cacheNames.map(async (cacheName) => {
          const cache = await caches.open(cacheName);
          const keys = await cache.keys();
          return {
            name: cacheName,
            size: keys.length,
            urls: keys.map(req => req.url),
          };
        })
      );
      return stats;
    } catch (error) {
      console.error('Error obteniendo estadísticas de caché:', error);
      return [];
    }
  }
  return [];
};

// Función para precargar recursos importantes
export const preloadResources = async (resources: string[]) => {
  if ('caches' in window) {
    try {
      const cache = await caches.open('memoria-eterna-preload-v1');
      await cache.addAll(resources);
      console.log('Recursos precargados:', resources);
    } catch (error) {
      console.error('Error precargando recursos:', error);
    }
  }
};

// Función para manejar errores del Service Worker
export const handleSWError = (error: Error) => {
  console.error('Error del Service Worker:', error);
  
  // Enviar error a analytics si está disponible
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'exception', {
      description: error.message,
      fatal: false,
    });
  }
};

// Función para inicializar PWA
export const initializePWA = async () => {
  try {
    // Registrar Service Worker
    const registration = await registerServiceWorker();
    
    if (registration) {
      // Solicitar permisos de notificación después de un delay
      setTimeout(async () => {
        if (Notification.permission === 'default') {
          await requestNotificationPermission();
        }
      }, 5000);

      // Precargar recursos importantes
      await preloadResources([
        '/manifest.json',
        '/pwa-192x192.svg',
        '/pwa-512x512.svg',
        '/offline.html',
      ]);

      console.log('PWA inicializada exitosamente');
    }
  } catch (error) {
    console.error('Error inicializando PWA:', error);
  }
};

export default {
  registerServiceWorker,
  updateApp,
  clearCache,
  isStandalone,
  canInstall,
  requestNotificationPermission,
  showNotification,
  getSWInfo,
  checkConnectivity,
  syncOfflineData,
  getCacheStats,
  preloadResources,
  handleSWError,
  initializePWA,
};
