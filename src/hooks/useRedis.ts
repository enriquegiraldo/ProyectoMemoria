import { useState, useEffect, useCallback } from 'react';
import { CacheService, cacheWithFallback } from '../services/cacheService';

// Tipos para el hook
interface UseRedisOptions {
  ttl?: number;
  cacheService?: CacheService;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseRedisReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setData: (data: T) => Promise<void>;
  clearCache: () => Promise<void>;
}

// Hook principal para usar Redis
export function useRedis<T>(
  key: string,
  fallback?: () => Promise<T>,
  options: UseRedisOptions = {}
): UseRedisReturn<T> {
  const {
    ttl,
    cacheService,
    autoRefresh = false,
    refreshInterval = 300000, // 5 minutos por defecto
  } = options;

  const [data, setDataState] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función para cargar datos
  const loadData = useCallback(async () => {
    if (!fallback) return;

    setLoading(true);
    setError(null);

    try {
      const result = await cacheWithFallback(key, fallback, { ttl, cacheService });
      setDataState(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading data');
    } finally {
      setLoading(false);
    }
  }, [key, fallback, ttl, cacheService]);

  // Función para establecer datos manualmente
  const setData = useCallback(async (newData: T) => {
    if (!cacheService) return;

    try {
      await cacheService.set(key, newData, ttl);
      setDataState(newData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error setting data');
    }
  }, [key, ttl, cacheService]);

  // Función para limpiar caché
  const clearCache = useCallback(async () => {
    if (!cacheService) return;

    try {
      await cacheService.delete(key);
      setDataState(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error clearing cache');
    }
  }, [key, cacheService]);

  // Función para refrescar datos
  const refresh = useCallback(async () => {
    if (!cacheService) return;

    try {
      await cacheService.delete(key);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error refreshing data');
    }
  }, [key, cacheService, loadData]);

  // Efecto para cargar datos iniciales
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Efecto para auto-refresh
  useEffect(() => {
    if (!autoRefresh || !refreshInterval) return;

    const interval = setInterval(loadData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadData]);

  return {
    data,
    loading,
    error,
    refresh,
    setData,
    clearCache,
  };
}

// Hook específico para memorias
export function useMemoryCache(memoryId: string) {
  const fallback = async () => {
    // Aquí iría la lógica para obtener la memoria de la base de datos
    const response = await fetch(`/api/memories/${memoryId}`);
    if (!response.ok) throw new Error('Failed to fetch memory');
    return response.json();
  };

  return useRedis(`memory:${memoryId}`, fallback, {
    ttl: 3600, // 1 hora
    autoRefresh: true,
    refreshInterval: 300000, // 5 minutos
  });
}

// Hook específico para perfil de usuario
export function useUserCache(userId: string) {
  const fallback = async () => {
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  };

  return useRedis(`user:${userId}`, fallback, {
    ttl: 3600, // 1 hora
    autoRefresh: false,
  });
}

// Hook específico para gamificación
export function useGamificationCache(userId: string) {
  const fallback = async () => {
    const response = await fetch(`/api/gamification/user/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch gamification data');
    return response.json();
  };

  return useRedis(`gamification:${userId}`, fallback, {
    ttl: 300, // 5 minutos
    autoRefresh: true,
    refreshInterval: 60000, // 1 minuto
  });
}

// Hook específico para leaderboard
export function useLeaderboardCache(timeframe: string = 'all') {
  const fallback = async () => {
    const response = await fetch(`/api/gamification/leaderboard?timeframe=${timeframe}`);
    if (!response.ok) throw new Error('Failed to fetch leaderboard');
    return response.json();
  };

  return useRedis(`leaderboard:${timeframe}`, fallback, {
    ttl: 300, // 5 minutos
    autoRefresh: true,
    refreshInterval: 300000, // 5 minutos
  });
}

// Hook para estadísticas de caché
export function useCacheStats() {
  const [stats, setStats] = useState({
    hits: 0,
    misses: 0,
    keys: 0,
    memory: 0,
  });

  const refreshStats = useCallback(async () => {
    try {
      const response = await fetch('/api/cache/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching cache stats:', error);
    }
  }, []);

  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 30000); // Actualizar cada 30 segundos
    return () => clearInterval(interval);
  }, [refreshStats]);

  return { stats, refreshStats };
}

// Hook para gestión de caché
export function useCacheManagement() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearAllCache = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/cache/clear', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to clear cache');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error clearing cache');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearPatternCache = useCallback(async (pattern: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/cache/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pattern }),
      });
      if (!response.ok) throw new Error('Failed to clear cache pattern');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error clearing cache pattern');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    clearAllCache,
    clearPatternCache,
  };
}
