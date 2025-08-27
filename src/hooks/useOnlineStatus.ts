"use client";
import { useState, useEffect } from 'react';

/**
 * Hook para manejar el estado offline/online
 * @returns boolean - true si está online, false si está offline
 */
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(() => {
    // Verificar si estamos en el cliente
    if (typeof window !== 'undefined') {
      return navigator.onLine;
    }
    // En SSR asumir que está online
    return true;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};