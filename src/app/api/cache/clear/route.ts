import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { memoryCache, userCache, gamificationCache, analyticsCache } from '../../../../services/cacheService';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Solo administradores pueden limpiar el caché
    if (!session?.user?.email || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { pattern, service } = body;

    let clearedKeys = 0;

    if (service) {
      // Limpiar caché específico por servicio
      switch (service) {
        case 'memory':
          await memoryCache.clear(pattern);
          clearedKeys = memoryCache.getStats().keys;
          break;
        case 'user':
          await userCache.clear(pattern);
          clearedKeys = userCache.getStats().keys;
          break;
        case 'gamification':
          await gamificationCache.clear(pattern);
          clearedKeys = gamificationCache.getStats().keys;
          break;
        case 'analytics':
          await analyticsCache.clear(pattern);
          clearedKeys = analyticsCache.getStats().keys;
          break;
        default:
          return NextResponse.json(
            { error: 'Invalid service specified' },
            { status: 400 }
          );
      }
    } else {
      // Limpiar todo el caché
      await Promise.all([
        memoryCache.clear(pattern),
        userCache.clear(pattern),
        gamificationCache.clear(pattern),
        analyticsCache.clear(pattern),
      ]);

      // Obtener total de claves limpiadas
      const stats = [
        memoryCache.getStats(),
        userCache.getStats(),
        gamificationCache.getStats(),
        analyticsCache.getStats(),
      ];
      clearedKeys = stats.reduce((total, stat) => total + stat.keys, 0);
    }

    return NextResponse.json({
      message: `Cache cleared successfully`,
      data: {
        clearedKeys,
        pattern: pattern || 'all',
        service: service || 'all',
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
