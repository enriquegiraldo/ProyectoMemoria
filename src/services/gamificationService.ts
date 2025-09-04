// src/services/gamificationService.ts
import { supabase } from '../lib/supabase';

// Las interfaces (UserPoints, Badge, etc.) no necesitan cambios y se mantienen igual
export interface UserPoints {
  id: string;
  user_id: string;
  points: number;
  level: number;
  experience: number;
  total_points_earned: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    name?: string;
    avatarUrl?: string;
  };
}
// ... (resto de interfaces: Badge, UserBadge, Mission, etc.)
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
  // Puntos por actividades (sin cambios)
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

  // Niveles y experiencia requerida (sin cambios)
  private static readonly LEVELS = {
    1: { name: 'Novato', minExp: 0, maxExp: 100 },
    2: { name: 'Aprendiz', minExp: 101, maxExp: 500 },
    3: { name: 'Experto', minExp: 501, maxExp: 1000 },
    4: { name: 'Maestro', minExp: 1001, maxExp: 2500 },
    5: { name: 'Leyenda', minExp: 2501, maxExp: 5000 },
    6: { name: 'Inmortal', minExp: 5001, maxExp: 10000 },
    7: { name: 'Dios de las Memorias', minExp: 10001, maxExp: Infinity },
  };

  // --- FUNCIÓN addPoints COMPLETAMENTE CORREGIDA ---
  static async addPoints(userId: string, activity: keyof typeof this.POINTS_MAP, description: string): Promise<boolean> {
    try {
      // 1. Obtener puntos del mapa
      const pointsToAdd = this.POINTS_MAP[activity];
      if (!pointsToAdd) {
        console.warn(`El tipo de actividad "${activity}" no fue encontrado en POINTS_MAP.`);
        return false;
      }

      // 2. Obtener el estado actual de puntos del usuario
      const { data: userPoints, error: fetchError } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      // Si hay un error y no es "fila no encontrada", lanzamos el error
      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      const currentPoints = userPoints?.points || 0;
      const currentExp = userPoints?.experience || 0;
      const currentLevel = userPoints?.level || 1;
      const currentTotalEarned = userPoints?.total_points_earned || 0;

      // 3. Calcular los nuevos totales
      const newTotalPoints = currentPoints + pointsToAdd;
      const newTotalExp = currentExp + pointsToAdd;
      const newLevel = this.calculateLevel(newTotalExp);
      const newTotalEarned = currentTotalEarned + pointsToAdd;

      // 4. Actualizar la base de datos con los nuevos totales
      const { error: updateError } = await supabase
        .from('user_points')
        .upsert({
          user_id: userId,
          points: newTotalPoints,
          experience: newTotalExp,
          level: newLevel,
          total_points_earned: newTotalEarned,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' }); // 'upsert' crea la fila si no existe

      if (updateError) throw updateError;
      
      // 5. Manejar efectos secundarios (subida de nivel, badges)
      if (newLevel > currentLevel) {
        await this.handleLevelUp(userId, newLevel);
      }
      await this.checkAndAwardBadges(userId, newTotalPoints, activity);
      
      // 6. Registrar la transacción (esto es bueno para auditoría)
      await this.recordTransaction(userId, pointsToAdd, 'credit', activity, description);
      
      return true;

    } catch (error) {
      console.error('Error adding points:', error);
      return false; // Devolver false en caso de error
    }
  }

  // El resto de funciones (calculateLevel, handleLevelUp, etc.) se mantienen igual
  // ... (pega aquí el resto de tus funciones de la clase, desde `calculateLevel` hasta el final)
  private static calculateLevel(experience: number): number {
    // ... (sin cambios)
    for (let level = 1; level <= Object.keys(this.LEVELS).length; level++) {
      const levelData = this.LEVELS[level as keyof typeof this.LEVELS];
      if (experience >= levelData.minExp && experience <= levelData.maxExp) {
        return level;
      }
    }
    return 1;
  }

  private static async handleLevelUp(userId: string, newLevel: number): Promise<void> {
    // ... (sin cambios)
    try {
      const levelData = this.LEVELS[newLevel as keyof typeof this.LEVELS];
      await this.createLevelUpNotification(userId, newLevel, levelData.name);
      await this.addPoints(userId, 'memory_milestone', `Bonus por alcanzar nivel ${newLevel}`);
    } catch (error) {
      console.error('Error handling level up:', error);
    }
  }

  private static async createLevelUpNotification(userId: string, level: number, levelName: string): Promise<void> {
    // ... (sin cambios)
  }

  private static async recordTransaction(userId: string, points: number, type: string, activity: string, description: string): Promise<void> {
    // ... (sin cambios)
  }

  static async getAllBadges(): Promise<Badge[]> {
    // ... (sin cambios)
  }

  static async getUserBadges(userId: string): Promise<UserBadge[]> {
    // Esta función necesita devolver un UserBadge[] para que no falle checkAndAwardBadges
    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select(`*, badges (*)`)
        .eq('user_id', userId);
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user badges:', error);
      return [];
    }
  }

  private static async checkAndAwardBadges(userId: string, totalPoints: number, activity: string): Promise<void> {
    // ... (sin cambios)
  }

  private static async checkBadgeRequirements(userId: string, badge: Badge, totalPoints: number, activity: string): Promise<boolean> {
    // ... (sin cambios)
  }

  private static async getActivityCount(userId: string, activity: string): Promise<number> {
    // ... (sin cambios)
  }

  static async awardBadge(userId: string, badgeId: string) {
    // ... (sin cambios)
  }
  
  // (Y así sucesivamente para el resto de la clase...)
  // ...
  // Obtener puntos del usuario (función auxiliar que faltaba)
  static async getUserPoints(userId: string): Promise<UserPoints | null> {
    try {
      const { data, error } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user points:', error);
      return null;
    }
  }
}