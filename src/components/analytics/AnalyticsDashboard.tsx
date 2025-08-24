import React, { useEffect } from 'react';
import { useAnalytics } from '../../hooks/useAnalytics';
import { Card } from '../ui/Card';
import { 
  BarChart3, 
  Users, 
  HardDrive, 
  Activity, 
  TrendingUp, 
  FileText,
  Calendar,
  Tag
} from 'lucide-react';

interface AnalyticsDashboardProps {
  type: 'user' | 'system';
  userId?: string;
}

export function AnalyticsDashboard({ type, userId }: AnalyticsDashboardProps) {
  const {
    userMetrics,
    systemMetrics,
    isLoading,
    error,
    loadUserMetrics,
    loadSystemMetrics,
    formatBytes,
    formatNumber,
  } = useAnalytics();

  useEffect(() => {
    if (type === 'user') {
      loadUserMetrics(userId);
    } else if (type === 'system') {
      loadSystemMetrics();
    }
  }, [type, userId]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          <p>{error}</p>
        </div>
      </Card>
    );
  }

  if (type === 'user' && userMetrics) {
    return (
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Memorias</p>
                <p className="text-2xl font-bold">{formatNumber(userMetrics.totalMemories)}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Almacenamiento</p>
                <p className="text-2xl font-bold">{formatBytes(userMetrics.totalStorageUsed)}</p>
              </div>
              <HardDrive className="h-8 w-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Este Mes</p>
                <p className="text-2xl font-bold">{formatNumber(userMetrics.memoriesThisMonth)}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tamaño Promedio</p>
                <p className="text-2xl font-bold">{formatBytes(userMetrics.averageMemorySize)}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-500" />
            </div>
          </Card>
        </div>

        {/* Activity Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Actividad de los Últimos 30 Días</h3>
          <div className="h-64 flex items-end justify-between space-x-1">
            {userMetrics.activityByDay.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-blue-500 rounded-t"
                  style={{
                    height: `${Math.max((day.count / Math.max(...userMetrics.activityByDay.map(d => d.count))) * 200, 4)}px`,
                  }}
                />
                <span className="text-xs text-gray-500 mt-1">
                  {new Date(day.date).getDate()}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Most Used Tags */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Etiquetas Más Usadas</h3>
          <div className="space-y-3">
            {userMetrics.mostUsedTags.map((tag, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <Tag className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="font-medium">{tag.tag}</span>
                </div>
                <span className="text-sm text-gray-600">{tag.count} memorias</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (type === 'system' && systemMetrics) {
    return (
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                <p className="text-2xl font-bold">{formatNumber(systemMetrics.totalUsers)}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Memorias</p>
                <p className="text-2xl font-bold">{formatNumber(systemMetrics.totalMemories)}</p>
              </div>
              <FileText className="h-8 w-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Almacenamiento Total</p>
                <p className="text-2xl font-bold">{formatBytes(systemMetrics.totalStorageUsed)}</p>
              </div>
              <HardDrive className="h-8 w-8 text-purple-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tasa de Conversión</p>
                <p className="text-2xl font-bold">{(systemMetrics.conversionRate * 100).toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </Card>
        </div>

        {/* Active Users */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Usuarios Activos Hoy</p>
                <p className="text-2xl font-bold">{formatNumber(systemMetrics.activeUsersToday)}</p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Esta Semana</p>
                <p className="text-2xl font-bold">{formatNumber(systemMetrics.activeUsersThisWeek)}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Este Mes</p>
                <p className="text-2xl font-bold">{formatNumber(systemMetrics.activeUsersThisMonth)}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <Card className="p-6">
      <div className="text-center text-gray-600">
        <p>No hay datos disponibles</p>
      </div>
    </Card>
  );
}
