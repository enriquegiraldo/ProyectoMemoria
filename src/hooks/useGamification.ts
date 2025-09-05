// src/hooks/useGamification.ts
import { useState, useEffect, useCallback } from 'react';
import { GamificationService, type UserPoints, type Badge, type UserBadge, type Mission, type UserMission, type UserStats } from '../services/gamificationService';
import { useAuth } from './useAuth';

export interface UseGamificationReturn {
  userPoints: UserPoints | null;
  userBadges: UserBadge[];
  userMissions: UserMission[];
  activeMissions: Mission[];
  leaderboard: UserPoints[];
  userStats: UserStats | null;
  isLoading: boolean;
  error: string | null;
  addPoints: (activity: keyof typeof GamificationService['POINTS_MAP'], description?: string) => Promise<boolean>;
  startMission: (missionId: string) => Promise<boolean>;
  updateMissionProgress: (missionId: string, progress: number) => Promise<boolean>;
  refreshData: () => Promise<void>;
  getLevelName: (level: number) => string;
  getLevelProgress: (experience: number) => number;
  getBadgeIcon: (badge: Badge) => string;
  getBadgeColor: (badge: Badge) => string;
  formatPoints: (points: number) => string;
}

export function useGamification(): UseGamificationReturn {
  const { user } = useAuth();
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [userMissions, setUserMissions] = useState<UserMission[]>([]);
  const [activeMissions, setActiveMissions] = useState<Mission[]>([]);
  const [leaderboard, setLeaderboard] = useState<UserPoints[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      const [
        points,
        badges,
        missions,
        missionsList,
        leaderboardData,
        stats
      ] = await Promise.all([
        GamificationService.getUserPoints(user.id),
        GamificationService.getUserBadges(user.id),
        GamificationService.getUserMissions(user.id),
        GamificationService.getActiveMissions(),
        GamificationService.getLeaderboard(10),
        GamificationService.getUserStats(user.id),
      ]);

      setUserPoints(points);
      setUserBadges(badges);
      setUserMissions(missions);
      setActiveMissions(missionsList);
      setLeaderboard(leaderboardData);
      setUserStats(stats);
    } catch (err) {
      console.error('Error loading gamification data:', err);
      setError('Error al cargar los datos de gamificación');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addPoints = useCallback(async (activity: keyof typeof GamificationService['POINTS_MAP'], description?: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const success = await GamificationService.addPoints(user.id, activity, description || `Puntos por ${activity}`);

      if (success) {
        await loadData();
      }

      return success;
    } catch (err) {
      console.error('Error adding points:', err);
      return false;
    }
  }, [user?.id, loadData]);

  const startMission = useCallback(async (missionId: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const success = await GamificationService.startMission(user.id, missionId);
      
      if (success) {
        await loadData();
      }

      return success;
    } catch (err) {
      console.error('Error starting mission:', err);
      return false;
    }
  }, [user?.id, loadData]);

  const updateMissionProgress = useCallback(async (missionId: string, progress: number): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const success = await GamificationService.updateMissionProgress(user.id, missionId, progress);
      
      if (success) {
        await loadData();
      }

      return success;
    } catch (err) {
      console.error('Error updating mission progress:', err);
      return false;
    }
  }, [user?.id, loadData]);

  const refreshData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const getLevelName = useCallback((level: number): string => {
    const levelNames: Record<number, string> = {
      1: 'Novato',
      2: 'Aprendiz',
      3: 'Experto',
      4: 'Maestro',
      5: 'Leyenda',
      6: 'Inmortal',
      7: 'Dios de las Memorias',
    };
    return levelNames[level] || 'Desconocido';
  }, []);

  const getLevelProgress = useCallback((experience: number): number => {
    const currentLevel = Math.floor(experience / 100) + 1;
    const levelStartExp = (currentLevel - 1) * 100;
    const levelEndExp = currentLevel * 100;
    const progressInLevel = experience - levelStartExp;
    const levelRange = levelEndExp - levelStartExp;
    
    return Math.min(100, Math.max(0, (progressInLevel / levelRange) * 100));
  }, []);

  const getBadgeIcon = useCallback((badge: Badge): string => {
    const iconMap: Record<string, string> = {
      'Primera Memoria': '🎯',
      'Compartidor Activo': '📤',
      'Comentarista': '💬',
      'Fotógrafo': '📸',
      'Influencer': '⭐',
      'Colaborador': '🤝',
      'Memorioso': '🏆',
      'default': '🏅',
    };
    
    return iconMap[badge.name] || iconMap.default;
  }, []);

  const getBadgeColor = useCallback((badge: Badge): string => {
    return badge.color || '#6B7280';
  }, []);

  const formatPoints = useCallback((points: number): string => {
    if (points >= 1000000) {
      return `${(points / 1000000).toFixed(1)}M`;
    } else if (points >= 1000) {
      return `${(points / 1000).toFixed(1)}K`;
    }
    return points.toString();
  }, []);

  return {
    userPoints,
    userBadges,
    userMissions,
    activeMissions,
    leaderboard,
    userStats,
    isLoading,
    error,
    addPoints,
    startMission,
    updateMissionProgress,
    refreshData,
    getLevelName,
    getLevelProgress,
    getBadgeIcon,
    getBadgeColor,
    formatPoints,
  };
}// src/hooks/useGamification.ts
import { useState, useEffect, useCallback } from 'react';
import { GamificationService, type UserPoints, type Badge, type UserBadge, type Mission, type UserMission, type UserStats } from '../services/gamificationService';
import { useAuth } from './useAuth';

export interface UseGamificationReturn {
  userPoints: UserPoints | null;
  userBadges: UserBadge[];
  userMissions: UserMission[];
  activeMissions: Mission[];
  leaderboard: UserPoints[];
  userStats: UserStats | null;
  isLoading: boolean;
  error: string | null;
  addPoints: (activity: keyof typeof GamificationService['POINTS_MAP'], description?: string) => Promise<boolean>;
  startMission: (missionId: string) => Promise<boolean>;
  updateMissionProgress: (missionId: string, progress: number) => Promise<boolean>;
  refreshData: () => Promise<void>;
  getLevelName: (level: number) => string;
  getLevelProgress: (experience: number) => number;
  getBadgeIcon: (badge: Badge) => string;
  getBadgeColor: (badge: Badge) => string;
  formatPoints: (points: number) => string;
}

export function useGamification(): UseGamificationReturn {
  const { user } = useAuth();
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [userMissions, setUserMissions] = useState<UserMission[]>([]);
  const [activeMissions, setActiveMissions] = useState<Mission[]>([]);
  const [leaderboard, setLeaderboard] = useState<UserPoints[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      const [
        points,
        badges,
        missions,
        missionsList,
        leaderboardData,
        stats
      ] = await Promise.all([
        GamificationService.getUserPoints(user.id),
        GamificationService.getUserBadges(user.id),
        GamificationService.getUserMissions(user.id),
        GamificationService.getActiveMissions(),
        GamificationService.getLeaderboard(10),
        GamificationService.getUserStats(user.id),
      ]);

      setUserPoints(points);
      setUserBadges(badges);
      setUserMissions(missions);
      setActiveMissions(missionsList);
      setLeaderboard(leaderboardData);
      setUserStats(stats);
    } catch (err) {
      console.error('Error loading gamification data:', err);
      setError('Error al cargar los datos de gamificación');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addPoints = useCallback(async (activity: keyof typeof GamificationService['POINTS_MAP'], description?: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const success = await GamificationService.addPoints(user.id, activity, description || `Puntos por ${activity}`);

      if (success) {
        await loadData();
      }

      return success;
    } catch (err) {
      console.error('Error adding points:', err);
      return false;
    }
  }, [user?.id, loadData]);

  const startMission = useCallback(async (missionId: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const success = await GamificationService.startMission(user.id, missionId);
      
      if (success) {
        await loadData();
      }

      return success;
    } catch (err) {
      console.error('Error starting mission:', err);
      return false;
    }
  }, [user?.id, loadData]);

  const updateMissionProgress = useCallback(async (missionId: string, progress: number): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const success = await GamificationService.updateMissionProgress(user.id, missionId, progress);
      
      if (success) {
        await loadData();
      }

      return success;
    } catch (err) {
      console.error('Error updating mission progress:', err);
      return false;
    }
  }, [user?.id, loadData]);

  const refreshData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const getLevelName = useCallback((level: number): string => {
    const levelNames: Record<number, string> = {
      1: 'Novato',
      2: 'Aprendiz',
      3: 'Experto',
      4: 'Maestro',
      5: 'Leyenda',
      6: 'Inmortal',
      7: 'Dios de las Memorias',
    };
    return levelNames[level] || 'Desconocido';
  }, []);

  const getLevelProgress = useCallback((experience: number): number => {
    const currentLevel = Math.floor(experience / 100) + 1;
    const levelStartExp = (currentLevel - 1) * 100;
    const levelEndExp = currentLevel * 100;
    const progressInLevel = experience - levelStartExp;
    const levelRange = levelEndExp - levelStartExp;
    
    return Math.min(100, Math.max(0, (progressInLevel / levelRange) * 100));
  }, []);

  const getBadgeIcon = useCallback((badge: Badge): string => {
    const iconMap: Record<string, string> = {
      'Primera Memoria': '🎯',
      'Compartidor Activo': '📤',
      'Comentarista': '💬',
      'Fotógrafo': '📸',
      'Influencer': '⭐',
      'Colaborador': '🤝',
      'Memorioso': '🏆',
      'default': '🏅',
    };
    
    return iconMap[badge.name] || iconMap.default;
  }, []);

  const getBadgeColor = useCallback((badge: Badge): string => {
    return badge.color || '#6B7280';
  }, []);

  const formatPoints = useCallback((points: number): string => {
    if (points >= 1000000) {
      return `${(points / 1000000).toFixed(1)}M`;
    } else if (points >= 1000) {
      return `${(points / 1000).toFixed(1)}K`;
    }
    return points.toString();
  }, []);

  return {
    userPoints,
    userBadges,
    userMissions,
    activeMissions,
    leaderboard,
    userStats,
    isLoading,
    error,
    addPoints,
    startMission,
    updateMissionProgress,
    refreshData,
    getLevelName,
    getLevelProgress,
    getBadgeIcon,
    getBadgeColor,
    formatPoints,
  };
}