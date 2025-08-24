import { getCache, setCache, deleteCache, clearCache } from '../lib/redis';

// Tipos para el servicio de caché
export interface CacheOptions {
  ttl?: number; // Tiempo de vida en segundos
  prefix?: string; // Prefijo para las claves
}

export interface CacheStats {
  hits: number;
  misses: number;
  keys: number;
  memory: number;
}

// Configuración por defecto
const DEFAULT_TTL = 3600; // 1 hora
const DEFAULT_PREFIX = 'memoria';

// Estadísticas de caché
let cacheStats = {
  hits: 0,
  misses: 0,
  keys: 0,
  memory: 0,
};

// Clase principal del servicio de caché
export class CacheService {
  private prefix: string;
  private defaultTtl: number;

  constructor(options: CacheOptions = {}) {
    this.prefix = options.prefix || DEFAULT_PREFIX;
    this.defaultTtl = options.ttl || DEFAULT_TTL;
  }

  // Generar clave de caché
  private generateKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  // Obtener valor del caché
  async get<T>(key: string): Promise<T | null> {
    try {
      const cacheKey = this.generateKey(key);
      const value = await getCache(cacheKey);
      
      if (value !== null) {
        cacheStats.hits++;
        return value as T;
      } else {
        cacheStats.misses++;
        return null;
      }
    } catch (error) {
      console.error('Cache get error:', error);
      cacheStats.misses++;
      return null;
    }
  }

  // Establecer valor en caché
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const cacheKey = this.generateKey(key);
      const timeToLive = ttl || this.defaultTtl;
      await setCache(cacheKey, value, timeToLive);
      cacheStats.keys++;
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  // Eliminar valor del caché
  async delete(key: string): Promise<void> {
    try {
      const cacheKey = this.generateKey(key);
      await deleteCache(cacheKey);
      cacheStats.keys = Math.max(0, cacheStats.keys - 1);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  // Limpiar caché por patrón
  async clear(pattern?: string): Promise<void> {
    try {
      const searchPattern = pattern ? `${this.prefix}:${pattern}` : `${this.prefix}:*`;
      await clearCache(searchPattern);
      cacheStats.keys = 0;
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  // Obtener múltiples valores
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    const promises = keys.map(key => this.get<T>(key));
    return Promise.all(promises);
  }

  // Establecer múltiples valores
  async mset<T>(entries: Array<{ key: string; value: T; ttl?: number }>): Promise<void> {
    const promises = entries.map(({ key, value, ttl }) => this.set(key, value, ttl));
    await Promise.all(promises);
  }

  // Verificar si existe una clave
  async exists(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  // Obtener estadísticas
  getStats(): CacheStats {
    return { ...cacheStats };
  }

  // Resetear estadísticas
  resetStats(): void {
    cacheStats = {
      hits: 0,
      misses: 0,
      keys: 0,
      memory: 0,
    };
  }
}

// Instancias específicas para diferentes tipos de datos
export const memoryCache = new CacheService({ prefix: 'memory', ttl: 1800 }); // 30 minutos
export const userCache = new CacheService({ prefix: 'user', ttl: 3600 }); // 1 hora
export const gamificationCache = new CacheService({ prefix: 'gamification', ttl: 300 }); // 5 minutos
export const analyticsCache = new CacheService({ prefix: 'analytics', ttl: 7200 }); // 2 horas

// Funciones de utilidad para caché específico
export class MemoryCacheService extends CacheService {
  constructor() {
    super({ prefix: 'memory', ttl: 1800 });
  }

  // Caché de memorias populares
  async getPopularMemories(): Promise<any> {
    return this.get('popular');
  }

  async setPopularMemories(memories: any): Promise<void> {
    await this.set('popular', memories, 1800);
  }

  // Caché de memoria específica
  async getMemory(id: string): Promise<any> {
    return this.get(`memory:${id}`);
  }

  async setMemory(id: string, memory: any): Promise<void> {
    await this.set(`memory:${id}`, memory, 3600);
  }

  // Invalidar caché de memoria
  async invalidateMemory(id: string): Promise<void> {
    await this.delete(`memory:${id}`);
    await this.delete('popular');
  }
}

export class UserCacheService extends CacheService {
  constructor() {
    super({ prefix: 'user', ttl: 3600 });
  }

  // Caché de perfil de usuario
  async getUserProfile(userId: string): Promise<any> {
    return this.get(`profile:${userId}`);
  }

  async setUserProfile(userId: string, profile: any): Promise<void> {
    await this.set(`profile:${userId}`, profile, 3600);
  }

  // Caché de datos de gamificación del usuario
  async getUserGamification(userId: string): Promise<any> {
    return this.get(`gamification:${userId}`);
  }

  async setUserGamification(userId: string, data: any): Promise<void> {
    await this.set(`gamification:${userId}`, data, 300);
  }

  // Invalidar caché de usuario
  async invalidateUser(userId: string): Promise<void> {
    await this.delete(`profile:${userId}`);
    await this.delete(`gamification:${userId}`);
  }
}

export class GamificationCacheService extends CacheService {
  constructor() {
    super({ prefix: 'gamification', ttl: 300 });
  }

  // Caché de leaderboard
  async getLeaderboard(timeframe: string = 'all'): Promise<any> {
    return this.get(`leaderboard:${timeframe}`);
  }

  async setLeaderboard(timeframe: string, data: any): Promise<void> {
    await this.set(`leaderboard:${timeframe}`, data, 300);
  }

  // Caché de misiones
  async getMissions(userId: string): Promise<any> {
    return this.get(`missions:${userId}`);
  }

  async setMissions(userId: string, missions: any): Promise<void> {
    await this.set(`missions:${userId}`, missions, 300);
  }

  // Invalidar caché de gamificación
  async invalidateGamification(): Promise<void> {
    await this.clear('leaderboard:*');
    await this.clear('missions:*');
  }
}

// Instancias globales
export const memoryCacheService = new MemoryCacheService();
export const userCacheService = new UserCacheService();
export const gamificationCacheService = new GamificationCacheService();

// Función de utilidad para caché con fallback
export async function cacheWithFallback<T>(
  key: string,
  fallback: () => Promise<T>,
  options: { ttl?: number; cacheService?: CacheService } = {}
): Promise<T> {
  const { ttl, cacheService = memoryCache } = options;
  
  // Intentar obtener del caché
  const cached = await cacheService.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Si no está en caché, ejecutar fallback
  const result = await fallback();
  
  // Guardar en caché
  await cacheService.set(key, result, ttl);
  
  return result;
}

// Función para invalidar caché relacionado
export async function invalidateRelatedCache(pattern: string): Promise<void> {
  await Promise.all([
    memoryCache.clear(pattern),
    userCache.clear(pattern),
    gamificationCache.clear(pattern),
  ]);
}
