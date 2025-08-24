import { createClient } from 'redis';

// Configuración de Redis
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redisPassword = process.env.REDIS_PASSWORD;

// Crear cliente de Redis
const redisClient = createClient({
  url: redisUrl,
  password: redisPassword,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('Redis connection failed after 10 retries');
        return false;
      }
      return Math.min(retries * 100, 3000);
    },
  },
});

// Manejar eventos de conexión
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('Redis Client Connected');
});

redisClient.on('ready', () => {
  console.log('Redis Client Ready');
});

redisClient.on('end', () => {
  console.log('Redis Client Disconnected');
});

// Conectar al cliente
let isConnected = false;

export async function connectRedis() {
  if (!isConnected) {
    try {
      await redisClient.connect();
      isConnected = true;
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
  }
  return redisClient;
}

// Funciones de caché
export async function getCache(key: string): Promise<any> {
  try {
    await connectRedis();
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

export async function setCache(key: string, value: any, ttl?: number): Promise<void> {
  try {
    await connectRedis();
    const serializedValue = JSON.stringify(value);
    if (ttl) {
      await redisClient.setEx(key, ttl, serializedValue);
    } else {
      await redisClient.set(key, serializedValue);
    }
  } catch (error) {
    console.error('Redis set error:', error);
  }
}

export async function deleteCache(key: string): Promise<void> {
  try {
    await connectRedis();
    await redisClient.del(key);
  } catch (error) {
    console.error('Redis delete error:', error);
  }
}

export async function clearCache(pattern?: string): Promise<void> {
  try {
    await connectRedis();
    if (pattern) {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } else {
      await redisClient.flushDb();
    }
  } catch (error) {
    console.error('Redis clear error:', error);
  }
}

// Funciones de sesión
export async function getSession(sessionId: string): Promise<any> {
  return getCache(`session:${sessionId}`);
}

export async function setSession(sessionId: string, data: any, ttl: number = 3600): Promise<void> {
  return setCache(`session:${sessionId}`, data, ttl);
}

export async function deleteSession(sessionId: string): Promise<void> {
  return deleteCache(`session:${sessionId}`);
}

// Funciones de rate limiting
export async function incrementRateLimit(key: string, window: number = 3600): Promise<number> {
  try {
    await connectRedis();
    const current = await redisClient.incr(key);
    if (current === 1) {
      await redisClient.expire(key, window);
    }
    return current;
  } catch (error) {
    console.error('Redis rate limit error:', error);
    return 0;
  }
}

export async function getRateLimit(key: string): Promise<number> {
  try {
    await connectRedis();
    const value = await redisClient.get(key);
    return value ? parseInt(value) : 0;
  } catch (error) {
    console.error('Redis rate limit get error:', error);
    return 0;
  }
}

// Funciones de gamificación (caché de leaderboard)
export async function getLeaderboardCache(timeframe: string = 'all'): Promise<any> {
  return getCache(`leaderboard:${timeframe}`);
}

export async function setLeaderboardCache(timeframe: string = 'all', data: any, ttl: number = 300): Promise<void> {
  return setCache(`leaderboard:${timeframe}`, data, ttl);
}

export async function invalidateLeaderboardCache(): Promise<void> {
  return clearCache('leaderboard:*');
}

// Funciones de memoria (caché de memorias populares)
export async function getPopularMemoriesCache(): Promise<any> {
  return getCache('memories:popular');
}

export async function setPopularMemoriesCache(data: any, ttl: number = 1800): Promise<void> {
  return setCache('memories:popular', data, ttl);
}

export async function invalidateMemoriesCache(): Promise<void> {
  return clearCache('memories:*');
}

// Cerrar conexión
export async function disconnectRedis(): Promise<void> {
  if (isConnected) {
    await redisClient.quit();
    isConnected = false;
  }
}

// Exportar cliente para uso directo
export { redisClient };
