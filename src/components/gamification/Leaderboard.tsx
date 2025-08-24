import React from 'react';
import { useGamification } from '../../hooks/useGamification';
import { Card } from '../ui/Card';
import { 
  Trophy, 
  Medal, 
  Award,
  Crown,
  Star,
  TrendingUp
} from 'lucide-react';

export function Leaderboard() {
  const {
    leaderboard,
    isLoading,
    error,
    getLevelName,
    formatPoints,
  } = useGamification();

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4 mt-1"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </Card>
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

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-orange-500" />;
      default:
        return <span className="w-6 h-6 text-gray-400 font-bold text-sm flex items-center justify-center">
          {position}
        </span>;
    }
  };

  const getPositionColor = (position: number) => {
    switch (position) {
      case 1:
        return 'bg-gradient-to-r from-yellow-100 to-yellow-200 border-yellow-300';
      case 2:
        return 'bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300';
      case 3:
        return 'bg-gradient-to-r from-orange-100 to-orange-200 border-orange-300';
      default:
        return 'bg-white border-gray-200';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
          Leaderboard
        </h3>
        <div className="text-sm text-gray-500">
          Top {leaderboard.length} jugadores
        </div>
      </div>

      {leaderboard.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Crown className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>No hay datos del leaderboard</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((user, index) => (
            <div
              key={user.id}
              className={`flex items-center space-x-4 p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${getPositionColor(index + 1)}`}
            >
              {/* Posición */}
              <div className="flex-shrink-0">
                {getPositionIcon(index + 1)}
              </div>

              {/* Avatar y nombre */}
              <div className="flex items-center space-x-3 flex-1">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {user.user?.name || 'Usuario Anónimo'}
                  </div>
                  <div className="text-sm text-gray-600 flex items-center">
                    <Star className="w-3 h-3 mr-1 text-yellow-500" />
                    {getLevelName(user.level)}
                  </div>
                </div>
              </div>

              {/* Puntos */}
              <div className="text-right">
                <div className="font-bold text-lg text-gray-900">
                  {formatPoints(user.points)}
                </div>
                <div className="text-xs text-gray-500">
                  {formatPoints(user.experience)} exp
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Información adicional */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <div className="font-medium text-gray-900">
              {leaderboard.length > 0 ? formatPoints(leaderboard[0]?.points || 0) : '0'}
            </div>
            <div className="text-gray-500">Máximo</div>
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {leaderboard.length > 0 
                ? formatPoints(Math.round(leaderboard.reduce((sum, user) => sum + user.points, 0) / leaderboard.length))
                : '0'
              }
            </div>
            <div className="text-gray-500">Promedio</div>
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {leaderboard.length}
            </div>
            <div className="text-gray-500">Jugadores</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
