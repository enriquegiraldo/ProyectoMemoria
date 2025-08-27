"use client";
import { useState, useEffect } from 'react';

/**
 * Hook para manejar el estado standalone (si la app está instalada como PWA)
 * @returns boolean - true si está en modo standalone, false si no
 */
export const useStandaloneStatus = () => {
  const [isStandalone, setIsStandalone] = useState(() => {
    // Verificar si estamos en el cliente
    if (typeof window !== 'undefined') {
      return window.matchMedia('(display-mode: standalone)').matches;
    }
    // En SSR asumir que no está en standalone
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e: MediaQueryListEvent) => setIsStandalone(e.matches);

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isStandalone;
};