import React, { useEffect } from 'react';
import { useAnalytics } from '../../hooks/useAnalytics';
import { Card } from '../ui/Card';
import { 
  BarChart3, 
  FileText, 
  HardDrive, 
  Calendar,
  TrendingUp,
  Activity
} from 'lucide-react';

export function UserMetrics() {
  const {
    userMetrics,
    isLoading,
    error,
    loadUserMetrics,
    formatBytes,
    formatNumber,
  } = useAnalytics();

  useEffect(() => {
    loadUserMetrics();
  }, []);

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

  if (error || !userMetrics) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-600">
          <p>No se pudieron cargar las métricas</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Memorias</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatNumber(userMetrics.totalMemories)}
              </p>
            </div>
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Almacenamiento</p>
              <p className="text-2xl font-bold text-green-600">
                {formatBytes(userMetrics.totalStorageUsed)}
              </p>
            </div>
            <HardDrive className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Este Mes</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatNumber(userMetrics.memoriesThisMonth)}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tamaño Promedio</p>
              <p className="text-2xl font-bold text-orange-600">
                {formatBytes(userMetrics.averageMemorySize)}
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Gráfico de Actividad */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Actividad de los Últimos 30 Días</h3>
          <Activity className="h-5 w-5 text-gray-400" />
        </div>
        
        <div className="h-48 flex items-end justify-between space-x-1">
          {userMetrics.activityByDay.map((day, index) => {
            const maxCount = Math.max(...userMetrics.activityByDay.map(d => d.count));
            const height = maxCount > 0 ? (day.count / maxCount) * 160 : 4;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all hover:from-blue-600 hover:to-blue-500"
                  style={{ height: `${Math.max(height, 4)}px` }}
                  title={`${day.count} memorias el ${new Date(day.date).toLocaleDateString()}`}
                />
                <span className="text-xs text-gray-500 mt-2">
                  {new Date(day.date).getDate()}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Etiquetas Más Usadas */}
      {userMetrics.mostUsedTags.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Etiquetas Más Usadas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userMetrics.mostUsedTags.slice(0, 6).map((tag, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-3"></div>
                  <span className="font-medium text-gray-700">{tag.tag}</span>
                </div>
                <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded">
                  {tag.count} memorias
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Resumen de Uso */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Resumen de Uso</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {formatNumber(userMetrics.totalMemories)}
            </div>
            <p className="text-sm text-gray-600">Memorias Creadas</p>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {formatBytes(userMetrics.totalStorageUsed)}
            </div>
            <p className="text-sm text-gray-600">Almacenamiento Usado</p>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {formatNumber(userMetrics.memoriesThisMonth)}
            </div>
            <p className="text-sm text-gray-600">Este Mes</p>
          </div>
        </div>
        
        {userMetrics.memoriesThisMonth > 0 && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm text-green-700">
                ¡Excelente! Has creado {userMetrics.memoriesThisMonth} memorias este mes.
              </span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
