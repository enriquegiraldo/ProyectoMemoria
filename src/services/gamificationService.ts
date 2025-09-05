// src/services/gamificationService.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

export interface UserStats {
  totalPoints: number;
  totalBadges: number;
  completedMissions: number;
  currentLevel: number;
  levelProgress: number;
}

export class GamificationService {
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

  private static readonly LEVELS = {
    1: { name: 'Novato', minExp: 0, maxExp: 100 },
    2: { name: 'Aprendiz', minExp: 101, maxExp: 500 },
    3: { name: 'Experto', minExp: 501, maxExp: 1000 },
    4: { name: 'Maestro', minExp: 1001, maxExp: 2500 },
    5: { name: 'Leyenda', minExp: 2501, maxExp: 5000 },
    6: { name: 'Inmortal', minExp: 5001, maxExp: 10000 },
    7: { name: 'Dios de las Memorias', minExp: 10001, maxExp: Infinity },
  };

  static async addPoints(userId: string, activity: keyof typeof this.POINTS_MAP, description: string): Promise<boolean> {
    try {
      const pointsToAdd = this.POINTS_MAP[activity];
      if (!pointsToAdd) {
        console.warn(`El tipo de actividad "${activity}" no fue encontrado en POINTS_MAP.`);
        return false;
      }

      const userPoints = await prisma.userPoints.findUnique({
        where: { user_id: userId },
      });

      const currentPoints = userPoints?.points || 0;
      const currentExp = userPoints?.experience || 0;
      const currentLevel = userPoints?.level || 1;
      const currentTotalEarned = userPoints?.total_points_earned || 0;

      const newTotalPoints = currentPoints + pointsToAdd;
      const newTotalExp = currentExp + pointsToAdd;
      const newLevel = this.calculateLevel(newTotalExp);
      const newTotalEarned = currentTotalEarned + pointsToAdd;

      await prisma.userPoints.upsert({
        where: { user_id: userId },
        update: {
          points: newTotalPoints,
          experience: newTotalExp,
          level: newLevel,
          total_points_earned: newTotalEarned,
          updated_at: new Date(),
        },
        create: {
          id: crypto.randomUUID(),
          user_id: userId,
          points: newTotalPoints,
          experience: newTotalExp,
          level: newLevel,
          total_points_earned: newTotalEarned,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      if (newLevel > currentLevel) {
        await this.handleLevelUp(userId, newLevel);
      }
      await this.checkAndAwardBadges(userId, newTotalPoints, activity);

      await this.recordTransaction(userId, pointsToAdd, 'credit', activity, description);

      return true;
    } catch (error) {
      console.error('Error adding points:', error);
      return false;
    }
  }

  private static calculateLevel(experience: number): number {
    for (let level = 1; level <= Object.keys(this.LEVELS).length; level++) {
      const levelData = this.LEVELS[level as keyof typeof this.LEVELS];
      if (experience >= levelData.minExp && experience <= levelData.maxExp) {
        return level;
      }
    }
    return 1;
  }

  private static async handleLevelUp(userId: string, newLevel: number): Promise<void> {
    try {
      const levelData = this.LEVELS[newLevel as keyof typeof this.LEVELS];
      await this.createLevelUpNotification(userId, newLevel, levelData.name);
      await this.addPoints(userId, 'memory_milestone', `Bonus por alcanzar nivel ${newLevel}`);
    } catch (error) {
      console.error('Error handling level up:', error);
    }
  }

  private static async createLevelUpNotification(userId: string, level: number, levelName: string): Promise<void> {
    try {
      await prisma.notification.create({
        data: {
          id: crypto.randomUUID(),
          user_id: userId,
          title: `¡Subiste de nivel!`,
          message: `Felicidades, has alcanzado el nivel ${level}: ${levelName}`,
          type: 'success',
          category: 'gamification',
          is_read: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
    } catch (error) {
      console.error('Error creating level up notification:', error);
    }
  }

  private static async recordTransaction(userId: string, points: number, type: string, activity: string, description: string): Promise<void> {
    try {
      await prisma.pointTransaction.create({
        data: {
          id: crypto.randomUUID(),
          user_id: userId,
          points,
          type,
          activity,
          description,
          created_at: new Date(),
        },
      });
    } catch (error) {
      console.error('Error recording transaction:', error);
    }
  }

  static async getAllBadges(): Promise<Badge[]> {
    try {
      const badges = await prisma.badge.findMany();
      return badges.map(badge => ({
        id: badge.id,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        color: badge.color,
        points_required: badge.points_required,
        category: badge.category,
        is_hidden: badge.is_hidden,
        created_at: badge.created_at.toISOString(),
      }));
    } catch (error) {
      console.error('Error getting all badges:', error);
      return [];
    }
  }

  static async getUserBadges(userId: string): Promise<UserBadge[]> {
    try {
      const badges = await prisma.userBadge.findMany({
        where: { user_id: userId },
        include: { badge: true },
      });
      return badges.map(badge => ({
        id: badge.id,
        user_id: badge.user_id,
        badge_id: badge.badge_id,
        earned_at: badge.earned_at.toISOString(),
        is_featured: badge.is_featured,
        badge: badge.badge ? {
          id: badge.badge.id,
          name: badge.badge.name,
          description: badge.badge.description,
          icon: badge.badge.icon,
          color: badge.badge.color,
          points_required: badge.badge.points_required,
          category: badge.badge.category,
          is_hidden: badge.badge.is_hidden,
          created_at: badge.badge.created_at.toISOString(),
        } : undefined,
      }));
    } catch (error) {
      console.error('Error getting user badges:', error);
      return [];
    }
  }

  private static async checkAndAwardBadges(userId: string, totalPoints: number, activity: string): Promise<void> {
    try {
      const badges = await this.getAllBadges();
      for (const badge of badges) {
        if (await this.checkBadgeRequirements(userId, badge, totalPoints, activity)) {
          await this.awardBadge(userId, badge.id);
        }
      }
    } catch (error) {
      console.error('Error checking and awarding badges:', error);
    }
  }

  private static async checkBadgeRequirements(userId: string, badge: Badge, totalPoints: number, activity: string): Promise<boolean> {
    try {
      const existingBadge = await prisma.userBadge.findFirst({
        where: { user_id: userId, badge_id: badge.id },
      });
      if (existingBadge) return false;

      if (totalPoints < badge.points_required) return false;

      const activityCount = await this.getActivityCount(userId, activity);
      if (badge.category === activity && activityCount < 1) return false;

      return true;
    } catch (error) {
      console.error('Error checking badge requirements:', error);
      return false;
    }
  }

  private static async getActivityCount(userId: string, activity: string): Promise<number> {
    try {
      const count = await prisma.pointTransaction.count({
        where: { user_id: userId, activity },
      });
      return count;
    } catch (error) {
      console.error('Error getting activity count:', error);
      return 0;
    }
  }

  static async awardBadge(userId: string, badgeId: string): Promise<void> {
    try {
      await prisma.userBadge.create({
        data: {
          id: crypto.randomUUID(),
          user_id: userId,
          badge_id: badgeId,
          earned_at: new Date(),
          is_featured: false,
        },
      });

      const badge = await prisma.badge.findUnique({
        where: { id: badgeId },
        select: { name: true, description: true },
      });
      if (badge) {
        await prisma.notification.create({
          data: {
            id: crypto.randomUUID(),
            user_id: userId,
            title: `¡Nueva insignia desbloqueada!`,
            message: `Has ganado la insignia "${badge.name}": ${badge.description}`,
            type: 'success',
            category: 'gamification',
            is_read: false,
            created_at: new Date(),
            updated_at: new Date(),
          },
        });
      }
    } catch (error) {
      console.error('Error awarding badge:', error);
    }
  }

  static async getUserPoints(userId: string): Promise<UserPoints | null> {
    try {
      const data = await prisma.userPoints.findUnique({
        where: { user_id: userId },
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      });
      if (!data) return null;
      return {
        id: data.id,
        user_id: data.user_id,
        points: data.points,
        level: data.level,
        experience: data.experience,
        total_points_earned: data.total_points_earned,
        created_at: data.created_at.toISOString(),
        updated_at: data.updated_at.toISOString(),
        user: data.user ? {
          id: data.user.id,
          name: data.user.name || undefined,
          avatarUrl: data.user.avatarUrl || undefined,
        } : undefined,
      };
    } catch (error) {
      console.error('Error fetching user points:', error);
      return null;
    }
  }

  static async getUserMissions(userId: string): Promise<UserMission[]> {
    try {
      const missions = await prisma.userMission.findMany({
        where: { user_id: userId },
        include: { mission: true },
      });
      return missions.map(mission => ({
        id: mission.id,
        user_id: mission.user_id,
        mission_id: mission.mission_id,
        progress: mission.progress,
        completed: mission.completed,
        completed_at: mission.completed_at?.toISOString(),
        started_at: mission.started_at.toISOString(),
        mission: mission.mission ? {
          id: mission.mission.id,
          name: mission.mission.name,
          description: mission.mission.description,
          type: mission.mission.type,
          target: mission.mission.target,
          points_reward: mission.mission.points_reward,
          badge_reward: mission.mission.badge_reward,
          is_active: mission.mission.is_active,
          created_at: mission.mission.created_at.toISOString(),
        } : undefined,
      }));
    } catch (error) {
      console.error('Error fetching user missions:', error);
      return [];
    }
  }

  static async getActiveMissions(): Promise<Mission[]> {
    try {
      const missions = await prisma.mission.findMany({
        where: { is_active: true },
      });
      return missions.map(mission => ({
        id: mission.id,
        name: mission.name,
        description: mission.description,
        type: mission.type,
        target: mission.target,
        points_reward: mission.points_reward,
        badge_reward: mission.badge_reward,
        is_active: mission.is_active,
        created_at: mission.created_at.toISOString(),
      }));
    } catch (error) {
      console.error('Error fetching active missions:', error);
      return [];
    }
  }

  static async getLeaderboard(limit: number = 10): Promise<UserPoints[]> {
    try {
      const users = await prisma.userPoints.findMany({
        orderBy: { total_points_earned: 'desc' },
        take: limit,
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      });
      return users.map(user => ({
        id: user.id,
        user_id: user.user_id,
        points: user.points,
        level: user.level,
        experience: user.experience,
        total_points_earned: user.total_points_earned,
        created_at: user.created_at.toISOString(),
        updated_at: user.updated_at.toISOString(),
        user: user.user ? {
          id: user.user.id,
          name: user.user.name || undefined,
          avatarUrl: user.user.avatarUrl || undefined,
        } : undefined,
      }));
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
  }

  static async getUserStats(userId: string): Promise<UserStats | null> {
    try {
      const [pointsData, badgesData, missionsData] = await Promise.all([
        this.getUserPoints(userId),
        this.getUserBadges(userId),
        this.getUserMissions(userId),
      ]);

      if (!pointsData) return null;

      const completedMissions = missionsData.filter(mission => mission.completed).length;
      const totalBadges = badgesData.length;
      const currentLevel = pointsData.level;
      const experience = pointsData.experience;
      const levelData = this.LEVELS[currentLevel as keyof typeof this.LEVELS];
      const levelProgress = ((experience - levelData.minExp) / (levelData.maxExp - levelData.minExp)) * 100;

      return {
        totalPoints: pointsData.total_points_earned,
        totalBadges,
        completedMissions,
        currentLevel,
        levelProgress: Math.min(100, Math.max(0, levelProgress)),
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return null;
    }
  }

  static async startMission(userId: string, missionId: string): Promise<boolean> {
    try {
      const existingMission = await prisma.userMission.findFirst({
        where: { user_id: userId, mission_id: missionId },
      });
      if (existingMission) return false;

      await prisma.userMission.create({
        data: {
          id: crypto.randomUUID(),
          user_id: userId,
          mission_id: missionId,
          progress: 0,
          completed: false,
          started_at: new Date(),
        },
      });
      return true;
    } catch (error) {
      console.error('Error starting mission:', error);
      return false;
    }
  }

  static async updateMissionProgress(userId: string, missionId: string, progress: number): Promise<boolean> {
    try {
      const userMission = await prisma.userMission.findFirst({
        where: { user_id: userId, mission_id: missionId },
        include: { mission: true },
      });
      if (!userMission) throw new Error('Mission not found');

      const mission = userMission.mission;
      const newProgress = Math.min(progress, mission.target);
      const completed = newProgress >= mission.target;

      await prisma.userMission.update({
        where: { id: userMission.id },
        data: {
          progress: newProgress,
          completed,
          completed_at: completed ? new Date() : userMission.completed_at,
          updated_at: new Date(),
        },
      });

      if (completed && !userMission.completed) {
        await this.addPoints(userId, 'memory_milestone', `Completaste la misión: ${mission.name}`);
        if (mission.badge_reward) {
          await this.awardBadge(userId, mission.badge_reward);
        }
      }

      return true;
    } catch (error) {
      console.error('Error updating mission progress:', error);
      return false;
    }
  }
}
