import { supabase } from '../lib/supabase';

export interface UserPoints {
  id: string;
  user_id: string;
  points: number;
  level: number;
  experience: number;
  total_points_earned: number;
  created_at: string;
  updated_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  points_required: number;
  category: string;
  is_hidden: boolean;
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  is_featured: boolean;
  badge?: Badge;
}

export interface Mission {
  id: string;
  name: string;
  description: string;
  type: string;
  target: number;
  points_reward: number;
  badge_reward?: string;
  is_active: boolean;
  created_at: string;
}

export interface UserMission {
  id: string;
  user_id: string;
  mission_id: string;
  progress: number;
  completed: boolean;
  completed_at?: string;
  started_at: string;
  mission?: Mission;
}

export interface PointTransaction {
  id: string;
  user_id: string;
  points: number;
  type: string;
  activity: string;
  description: string;
  created_at: string;
}

export class GamificationService {
  // Puntos por actividades
  private static readonly POINTS_MAP = {
    create_memory: 10,
    comment: 5,
    share: 3,
    receive_like: 2,
    complete_profile: 20,
    upload_photo: 15,
    invite_friend: 25,
    daily_login: 1,
    weekly_streak: 10,
    first_memory: 50,
    memory_milestone: 100,
  };

  // Niveles y experiencia requerida
  private static readonly LEVELS = {
    1: { name: 'Novato', minExp: 0, maxExp: 100 },
    2: { name: 'Aprendiz', minExp: 101, maxExp: 500 },
    3: { name: 'Experto', minExp: 501, maxExp: 1000 },
    4: { name: 'Maestro', minExp: 1001, maxExp: 2500 },
    5: { name: 'Leyenda', minExp: 2501, maxExp: 5000 },
    6: { name: 'Inmortal', minExp: 5001, maxExp: 10000 },
    7: { name: 'Dios de las Memorias', minExp: 10001, maxExp: Infinity },
  };

  // Obtener puntos del usuario
  static async getUserPoints(userId: string): Promise<UserPoints | null> {
    try {
      const { data, error } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user points:', error);
      return null;
    }
  }

  // Crear o actualizar puntos del usuario
  static async createOrUpdateUserPoints(userId: string): Promise<UserPoints | null> {
    try {
      let userPoints = await this.getUserPoints(userId);
      
      if (!userPoints) {
        const { data, error } = await supabase
          .from('user_points')
          .insert({
            user_id: userId,
            points: 0,
            level: 1,
            experience: 0,
            total_points_earned: 0,
          })
          .select()
          .single();

        if (error) throw error;
        userPoints = data;
      }

      return userPoints;
    } catch (error) {
      console.error('Error creating/updating user points:', error);
      return null;
    }
  }

  // Agregar puntos al usuario
  static async addPoints(
    userId: string, 
    activity: keyof typeof GamificationService.POINTS_MAP,
    description?: string
  ): Promise<boolean> {
    try {
      const points = this.POINTS_MAP[activity];
      if (!points) return false;

      // Obtener puntos actuales del usuario
      let userPoints = await this.getUserPoints(userId);
      if (!userPoints) {
        userPoints = await this.createOrUpdateUserPoints(userId);
        if (!userPoints) return false;
      }

      // Calcular nuevos puntos y nivel
      const newPoints = userPoints.points + points;
      const newTotalEarned = userPoints.total_points_earned + points;
      const newExperience = userPoints.experience + points;
      
      // Calcular nuevo nivel
      const newLevel = this.calculateLevel(newExperience);

      // Actualizar puntos del usuario
      const { error: updateError } = await supabase
        .from('user_points')
        .update({
          points: newPoints,
          level: newLevel,
          experience: newExperience,
          total_points_earned: newTotalEarned,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      // Registrar transacción
      await this.recordTransaction(userId, points, 'earned', activity, description || `Puntos por ${activity}`);

      // Verificar si subió de nivel
      if (newLevel > userPoints.level) {
        await this.handleLevelUp(userId, newLevel);
      }

      // Verificar badges
      await this.checkAndAwardBadges(userId, newPoints, activity);

      return true;
    } catch (error) {
      console.error('Error adding points:', error);
      return false;
    }
  }

  // Calcular nivel basado en experiencia
  private static calculateLevel(experience: number): number {
    for (let level = 1; level <= Object.keys(this.LEVELS).length; level++) {
      const levelData = this.LEVELS[level as keyof typeof this.LEVELS];
      if (experience >= levelData.minExp && experience <= levelData.maxExp) {
        return level;
      }
    }
    return 1;
  }

  // Manejar subida de nivel
  private static async handleLevelUp(userId: string, newLevel: number): Promise<void> {
    try {
      // Crear notificación de subida de nivel
      const levelData = this.LEVELS[newLevel as keyof typeof this.LEVELS];
      await this.createLevelUpNotification(userId, newLevel, levelData.name);
      
      // Otorgar bonus por subida de nivel
      const bonusPoints = newLevel * 10;
      await this.addPoints(userId, 'memory_milestone', `Bonus por alcanzar nivel ${newLevel}`);
    } catch (error) {
      console.error('Error handling level up:', error);
    }
  }

  // Crear notificación de subida de nivel
  private static async createLevelUpNotification(userId: string, level: number, levelName: string): Promise<void> {
    try {
      // Aquí usarías el NotificationService
      // await NotificationService.createNotification({
      //   user_id: userId,
      //   title: `¡Subiste al nivel ${level}!`,
      //   message: `Felicidades, ahora eres ${levelName}`,
      //   type: 'success',
      //   category: 'achievement',
      //   data: { level, levelName }
      // });
    } catch (error) {
      console.error('Error creating level up notification:', error);
    }
  }

  // Registrar transacción de puntos
  private static async recordTransaction(
    userId: string,
    points: number,
    type: string,
    activity: string,
    description: string
  ): Promise<void> {
    try {
      await supabase
        .from('point_transactions')
        .insert({
          user_id: userId,
          points,
          type,
          activity,
          description,
        });
    } catch (error) {
      console.error('Error recording transaction:', error);
    }
  }

  // Obtener todos los badges
  static async getAllBadges(): Promise<Badge[]> {
    try {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .order('points_required', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching badges:', error);
      return [];
    }
  }

  // Obtener badges del usuario
  static async getUserBadges(userId: string): Promise<UserBadge[]> {
    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          *,
          badge:badges(*)
        `)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user badges:', error);
      return [];
    }
  }

  // Verificar y otorgar badges
  private static async checkAndAwardBadges(userId: string, totalPoints: number, activity: string): Promise<void> {
    try {
      const allBadges = await this.getAllBadges();
      const userBadges = await this.getUserBadges(userId);
      const userBadgeIds = userBadges.map(ub => ub.badge_id);

      for (const badge of allBadges) {
        // Verificar si ya tiene el badge
        if (userBadgeIds.includes(badge.id)) continue;

        // Verificar si cumple los requisitos
        if (await this.checkBadgeRequirements(userId, badge, totalPoints, activity)) {
          await this.awardBadge(userId, badge.id);
        }
      }
    } catch (error) {
      console.error('Error checking badges:', error);
    }
  }

  // Verificar requisitos de un badge
  private static async checkBadgeRequirements(
    userId: string, 
    badge: Badge, 
    totalPoints: number, 
    activity: string
  ): Promise<boolean> {
    try {
      switch (badge.name) {
        case 'Primera Memoria':
          return activity === 'create_memory';
        
        case 'Compartidor Activo':
          const shares = await this.getActivityCount(userId, 'share');
          return shares >= 10;
        
        case 'Comentarista':
          const comments = await this.getActivityCount(userId, 'comment');
          return comments >= 50;
        
        case 'Fotógrafo':
          const photos = await this.getActivityCount(userId, 'upload_photo');
          return photos >= 20;
        
        case 'Influencer':
          const likes = await this.getActivityCount(userId, 'receive_like');
          return likes >= 100;
        
        case 'Colaborador':
          const invites = await this.getActivityCount(userId, 'invite_friend');
          return invites >= 5;
        
        case 'Memorioso':
          const memories = await this.getActivityCount(userId, 'create_memory');
          return memories >= 100;
        
        default:
          return totalPoints >= badge.points_required;
      }
    } catch (error) {
      console.error('Error checking badge requirements:', error);
      return false;
    }
  }

  // Obtener conteo de una actividad
  private static async getActivityCount(userId: string, activity: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('point_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('activity', activity);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting activity count:', error);
      return 0;
    }
  }

  // Otorgar badge al usuario
  private static async awardBadge(userId: string, badgeId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_badges')
        .insert({
          user_id: userId,
          badge_id: badgeId,
          earned_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Crear notificación de badge
      // await NotificationService.createNotification({
      //   user_id: userId,
      //   title: '¡Nuevo Badge Desbloqueado!',
      //   message: `Has ganado un nuevo badge`,
      //   type: 'success',
      //   category: 'achievement',
      //   data: { badgeId }
      // });

      return true;
    } catch (error) {
      console.error('Error awarding badge:', error);
      return false;
    }
  }

  // Obtener misiones activas
  static async getActiveMissions(): Promise<Mission[]> {
    try {
      const { data, error } = await supabase
        .from('missions')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching active missions:', error);
      return [];
    }
  }

  // Obtener misiones del usuario
  static async getUserMissions(userId: string): Promise<UserMission[]> {
    try {
      const { data, error } = await supabase
        .from('user_missions')
        .select(`
          *,
          mission:missions(*)
        `)
        .eq('user_id', userId)
        .order('started_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user missions:', error);
      return [];
    }
  }

  // Iniciar misión para el usuario
  static async startMission(userId: string, missionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_missions')
        .insert({
          user_id: userId,
          mission_id: missionId,
          progress: 0,
          completed: false,
          started_at: new Date().toISOString(),
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error starting mission:', error);
      return false;
    }
  }

  // Actualizar progreso de misión
  static async updateMissionProgress(userId: string, missionId: string, progress: number): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_missions')
        .update({
          progress,
          completed: progress >= 100,
          completed_at: progress >= 100 ? new Date().toISOString() : null,
        })
        .eq('user_id', userId)
        .eq('mission_id', missionId)
        .select()
        .single();

      if (error) throw error;

      // Si completó la misión, otorgar recompensa
      if (data.completed && !data.completed_at) {
        await this.awardMissionReward(userId, missionId);
      }

      return true;
    } catch (error) {
      console.error('Error updating mission progress:', error);
      return false;
    }
  }

  // Otorgar recompensa de misión
  private static async awardMissionReward(userId: string, missionId: string): Promise<void> {
    try {
      const { data: mission, error } = await supabase
        .from('missions')
        .select('*')
        .eq('id', missionId)
        .single();

      if (error || !mission) return;

      // Otorgar puntos
      if (mission.points_reward > 0) {
        await this.addPoints(userId, 'memory_milestone', `Recompensa por completar misión: ${mission.name}`);
      }

      // Otorgar badge si corresponde
      if (mission.badge_reward) {
        await this.awardBadge(userId, mission.badge_reward);
      }
    } catch (error) {
      console.error('Error awarding mission reward:', error);
    }
  }

  // Obtener leaderboard
  static async getLeaderboard(limit: number = 10): Promise<UserPoints[]> {
    try {
      const { data, error } = await supabase
        .from('user_points')
        .select(`
          *,
          user:users(id, name, avatarUrl)
        `)
        .order('points', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
  }

  // Obtener estadísticas del usuario
  static async getUserStats(userId: string): Promise<any> {
    try {
      const userPoints = await this.getUserPoints(userId);
      const userBadges = await this.getUserBadges(userId);
      const userMissions = await this.getUserMissions(userId);
      const completedMissions = userMissions.filter(um => um.completed);

      return {
        points: userPoints?.points || 0,
        level: userPoints?.level || 1,
        experience: userPoints?.experience || 0,
        totalPointsEarned: userPoints?.total_points_earned || 0,
        badgesCount: userBadges.length,
        missionsCompleted: completedMissions.length,
        totalMissions: userMissions.length,
        levelProgress: this.calculateLevelProgress(userPoints?.experience || 0),
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return null;
    }
  }

  // Calcular progreso del nivel actual
  private static calculateLevelProgress(experience: number): number {
    const currentLevel = this.calculateLevel(experience);
    const levelData = this.LEVELS[currentLevel as keyof typeof this.LEVELS];
    const levelRange = levelData.maxExp - levelData.minExp;
    const progressInLevel = experience - levelData.minExp;
    
    return Math.min(100, Math.max(0, (progressInLevel / levelRange) * 100));
  }
}
