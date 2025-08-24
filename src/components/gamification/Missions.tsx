import React from 'react';
import { useGamification } from '../../hooks/useGamification';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  Target, 
  CheckCircle, 
  Circle,
  Play,
  Award,
  Clock,
  Star,
  Zap
} from 'lucide-react';

export function Missions() {
  const {
    userMissions,
    activeMissions,
    isLoading,
    error,
    startMission,
    updateMissionProgress,
    formatPoints,
  } = useGamification();

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-2 bg-gray-200 rounded w-full"></div>
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

  const getMissionIcon = (type: string) => {
    switch (type) {
      case 'daily':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'weekly':
        return <Star className="w-5 h-5 text-purple-600" />;
      case 'monthly':
        return <Award className="w-5 h-5 text-green-600" />;
      case 'special':
        return <Zap className="w-5 h-5 text-yellow-600" />;
      default:
        return <Target className="w-5 h-5 text-gray-600" />;
    }
  };

  const getMissionColor = (type: string) => {
    switch (type) {
      case 'daily':
        return 'border-blue-200 bg-blue-50';
      case 'weekly':
        return 'border-purple-200 bg-purple-50';
      case 'monthly':
        return 'border-green-200 bg-green-50';
      case 'special':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const handleStartMission = async (missionId: string) => {
    await startMission(missionId);
  };

  const handleUpdateProgress = async (missionId: string, currentProgress: number) => {
    const newProgress = Math.min(100, currentProgress + 25);
    await updateMissionProgress(missionId, newProgress);
  };

  const getAvailableMissions = () => {
    const userMissionIds = userMissions.map(um => um.mission_id);
    return activeMissions.filter(mission => !userMissionIds.includes(mission.id));
  };

  const getCompletedMissions = () => {
    return userMissions.filter(um => um.completed);
  };

  const getInProgressMissions = () => {
    return userMissions.filter(um => !um.completed);
  };

  return (
    <div className="space-y-6">
      {/* Misiones Disponibles */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Target className="w-5 h-5 mr-2 text-blue-600" />
          Misiones Disponibles
        </h3>

        {getAvailableMissions().length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Target className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No hay misiones disponibles</p>
          </div>
        ) : (
          <div className="space-y-4">
            {getAvailableMissions().map((mission) => (
              <div
                key={mission.id}
                className={`border-2 rounded-lg p-4 ${getMissionColor(mission.type)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {getMissionIcon(mission.type)}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{mission.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{mission.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>Objetivo: {mission.target}</span>
                        <span>Recompensa: {formatPoints(mission.points_reward)} pts</span>
                        {mission.badge_reward && (
                          <span className="flex items-center">
                            <Award className="w-3 h-3 mr-1" />
                            Badge
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleStartMission(mission.id)}
                    size="sm"
                    className="ml-4"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Iniciar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Misiones en Progreso */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Circle className="w-5 h-5 mr-2 text-orange-600" />
          Misiones en Progreso ({getInProgressMissions().length})
        </h3>

        {getInProgressMissions().length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Circle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No tienes misiones en progreso</p>
          </div>
        ) : (
          <div className="space-y-4">
            {getInProgressMissions().map((userMission) => (
              <div
                key={userMission.id}
                className={`border-2 rounded-lg p-4 ${getMissionColor(userMission.mission?.type || '')}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {getMissionIcon(userMission.mission?.type || '')}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{userMission.mission?.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{userMission.mission?.description}</p>
                      
                      {/* Barra de progreso */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progreso</span>
                          <span>{userMission.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${userMission.progress}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>Objetivo: {userMission.mission?.target}</span>
                        <span>Recompensa: {formatPoints(userMission.mission?.points_reward || 0)} pts</span>
                        {userMission.mission?.badge_reward && (
                          <span className="flex items-center">
                            <Award className="w-3 h-3 mr-1" />
                            Badge
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleUpdateProgress(userMission.mission_id, userMission.progress)}
                    size="sm"
                    variant="outline"
                    className="ml-4"
                    disabled={userMission.progress >= 100}
                  >
                    +25%
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Misiones Completadas */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
          Misiones Completadas ({getCompletedMissions().length})
        </h3>

        {getCompletedMissions().length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No has completado misiones aún</p>
          </div>
        ) : (
          <div className="space-y-4">
            {getCompletedMissions().slice(0, 5).map((userMission) => (
              <div
                key={userMission.id}
                className="border-2 border-green-200 bg-green-50 rounded-lg p-4"
              >
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      {userMission.mission?.name}
                      <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        Completada
                      </span>
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">{userMission.mission?.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>Recompensa: {formatPoints(userMission.mission?.points_reward || 0)} pts</span>
                      <span>Completada: {new Date(userMission.completed_at!).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Estadísticas de Misiones */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Award className="w-5 h-5 mr-2 text-purple-600" />
          Estadísticas de Misiones
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {getAvailableMissions().length}
            </div>
            <div className="text-sm text-gray-600">Disponibles</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {getInProgressMissions().length}
            </div>
            <div className="text-sm text-gray-600">En Progreso</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {getCompletedMissions().length}
            </div>
            <div className="text-sm text-gray-600">Completadas</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {userMissions.length > 0 
                ? Math.round((getCompletedMissions().length / userMissions.length) * 100)
                : 0
              }%
            </div>
            <div className="text-sm text-gray-600">Tasa de Éxito</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
