import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { memoryCache, userCache, gamificationCache, analyticsCache } from '../../../../services/cacheService';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Solo administradores pueden ver estadísticas de caché
    if (!session?.user?.email || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Obtener estadísticas de todos los servicios de caché
    const memoryStats = memoryCache.getStats();
    const userStats = userCache.getStats();
    const gamificationStats = gamificationCache.getStats();
    const analyticsStats = analyticsCache.getStats();

    // Calcular estadísticas totales
    const totalStats = {
      hits: memoryStats.hits + userStats.hits + gamificationStats.hits + analyticsStats.hits,
      misses: memoryStats.misses + userStats.misses + gamificationStats.misses + analyticsStats.misses,
      keys: memoryStats.keys + userStats.keys + gamificationStats.keys + analyticsStats.keys,
      memory: memoryStats.memory + userStats.memory + gamificationStats.memory + analyticsStats.memory,
    };

    // Calcular hit rate
    const totalRequests = totalStats.hits + totalStats.misses;
    const hitRate = totalRequests > 0 ? (totalStats.hits / totalRequests) * 100 : 0;

    return NextResponse.json({
      data: {
        total: {
          ...totalStats,
          hitRate: Math.round(hitRate * 100) / 100,
        },
        services: {
          memory: memoryStats,
          user: userStats,
          gamification: gamificationStats,
          analytics: analyticsStats,
        },
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('Error fetching cache stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
