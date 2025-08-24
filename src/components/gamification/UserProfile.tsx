import React from 'react';
import { useGamification } from '../../hooks/useGamification';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  Trophy, 
  Star, 
  Target, 
  TrendingUp,
  Award,
  Zap,
  Crown,
  Medal
} from 'lucide-react';

export function UserProfile() {
  const {
    userPoints,
    userBadges,
    userStats,
    isLoading,
    error,
    getLevelName,
    getLevelProgress,
    getBadgeIcon,
    getBadgeColor,
    formatPoints,
  } = useGamification();

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 rounded-lg"></div>
        <div className="h-24 bg-gray-200 rounded-lg"></div>
        <div className="h-48 bg-gray-200 rounded-lg"></div>
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

  if (!userPoints) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-600">
          <p>No se encontraron datos de gamificación</p>
        </div>
      </Card>
    );
  }

  const levelProgress = getLevelProgress(userPoints.experience);
  const levelName = getLevelName(userPoints.level);

  return (
    <div className="space-y-6">
      {/* Header del Perfil */}
      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold">
              {userPoints.level}
            </div>
          </div>
          
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{levelName}</h2>
            <p className="text-gray-600">
              {formatPoints(userPoints.points)} puntos • {formatPoints(userPoints.experience)} experiencia
            </p>
            
            {/* Barra de progreso del nivel */}
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Nivel {userPoints.level}</span>
                <span>{levelProgress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${levelProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Estadísticas */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
          Estadísticas
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatPoints(userPoints.total_points_earned)}
            </div>
            <div className="text-sm text-gray-600">Total Ganados</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {userStats?.badgesCount || 0}
            </div>
            <div className="text-sm text-gray-600">Badges</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {userStats?.missionsCompleted || 0}
            </div>
            <div className="text-sm text-gray-600">Misiones</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {userPoints.level}
            </div>
            <div className="text-sm text-gray-600">Nivel</div>
          </div>
        </div>
      </Card>

      {/* Badges */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Award className="w-5 h-5 mr-2 text-yellow-600" />
          Badges ({userBadges.length})
        </h3>
        
        {userBadges.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Medal className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No tienes badges aún</p>
            <p className="text-sm">¡Completa actividades para desbloquear badges!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {userBadges.map((userBadge) => (
              <div
                key={userBadge.id}
                className="text-center p-4 rounded-lg border-2 border-gray-200 hover:border-yellow-300 transition-colors"
                style={{ borderColor: getBadgeColor(userBadge.badge!) }}
              >
                <div className="text-3xl mb-2">
                  {getBadgeIcon(userBadge.badge!)}
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {userBadge.badge?.name}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(userBadge.earned_at).toLocaleDateString()}
                </div>
                {userBadge.is_featured && (
                  <div className="mt-2">
                    <Star className="w-4 h-4 text-yellow-500 mx-auto" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Logros Recientes */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Trophy className="w-5 h-5 mr-2 text-yellow-600" />
          Logros Recientes
        </h3>
        
        <div className="space-y-3">
          {userBadges.slice(0, 3).map((userBadge) => (
            <div
              key={userBadge.id}
              className="flex items-center space-x-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg"
            >
              <div className="text-2xl">
                {getBadgeIcon(userBadge.badge!)}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">
                  {userBadge.badge?.name}
                </div>
                <div className="text-sm text-gray-600">
                  {userBadge.badge?.description}
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {new Date(userBadge.earned_at).toLocaleDateString()}
              </div>
            </div>
          ))}
          
          {userBadges.length === 0 && (
            <div className="text-center py-6 text-gray-500">
              <Target className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>No hay logros recientes</p>
            </div>
          )}
        </div>
      </Card>

      {/* Próximos Objetivos */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Target className="w-5 h-5 mr-2 text-green-600" />
          Próximos Objetivos
        </h3>
        
        <div className="space-y-4">
          {/* Próximo nivel */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Zap className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium text-gray-900">
                  Próximo Nivel: {getLevelName(userPoints.level + 1)}
                </div>
                <div className="text-sm text-gray-600">
                  {formatPoints(userPoints.experience)} / {formatPoints((userPoints.level + 1) * 100)} exp
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-blue-600">
                {((userPoints.experience % 100) / 100 * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Próximo badge */}
          {userBadges.length < 5 && (
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Award className="w-5 h-5 text-yellow-600" />
                <div>
                  <div className="font-medium text-gray-900">
                    Próximo Badge
                  </div>
                  <div className="text-sm text-gray-600">
                    Completa más actividades para desbloquear badges
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-yellow-600">
                  {userBadges.length}/5
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
