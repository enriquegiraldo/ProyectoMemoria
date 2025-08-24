import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config';
import { logger, auditLogger } from '../utils/logger';
import { CustomError, UserNotFoundError } from '../utils/errors';
import { User } from './auth.service';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  accountLocked: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  consent: boolean;
  registrationIp: string;
  registrationUserAgent: string;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  role?: string;
  permissions?: string[];
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
  accountLocked?: boolean;
}

export class UserService {
  private supabase: SupabaseClient;

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || createClient(config.supabase.url, config.supabase.serviceRoleKey);
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // User not found
        }
        throw new CustomError('Database error', 500);
      }

      return this.mapUserFromDatabase(data);
    } catch (error) {
      logger.error('Get user by ID failed', {
        userId,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // User not found
        }
        throw new CustomError('Database error', 500);
      }

      return this.mapUserFromDatabase(data);
    } catch (error) {
      logger.error('Get user by email failed', {
        email,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Create user profile
   */
  async createUserProfile(data: CreateUserData): Promise<UserProfile> {
    try {
      const { data: userData, error } = await this.supabase
        .from('users')
        .insert({
          id: data.id,
          email: data.email,
          first_name: data.firstName,
          last_name: data.lastName,
          role: 'user',
          permissions: ['read:own', 'write:own'],
          email_verified: false,
          two_factor_enabled: false,
          account_locked: false,
          consent_given: data.consent,
          registration_ip: data.registrationIp,
          registration_user_agent: data.registrationUserAgent,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to create user profile', { error });
        throw new CustomError('Failed to create user profile', 500);
      }

      const user = this.mapUserFromDatabase(userData);
      
      auditLogger.dataAccess('system', 'create', `user:${user.id}`, 'system');
      
      return user;
    } catch (error) {
      logger.error('Create user profile failed', {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: UpdateUserData): Promise<UserProfile> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.firstName) updateData.first_name = updates.firstName;
      if (updates.lastName) updateData.last_name = updates.lastName;
      if (updates.role) updateData.role = updates.role;
      if (updates.permissions) updateData.permissions = updates.permissions;
      if (updates.emailVerified !== undefined) updateData.email_verified = updates.emailVerified;
      if (updates.twoFactorEnabled !== undefined) updateData.two_factor_enabled = updates.twoFactorEnabled;
      if (updates.accountLocked !== undefined) updateData.account_locked = updates.accountLocked;

      const { data, error } = await this.supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update user profile', { error });
        throw new CustomError('Failed to update user profile', 500);
      }

      const user = this.mapUserFromDatabase(data);
      
      auditLogger.dataAccess('system', 'update', `user:${user.id}`, 'system');
      
      return user;
    } catch (error) {
      logger.error('Update user profile failed', {
        userId,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Update last login
   */
  async updateLastLogin(data: {
    userId: string;
    ip: string;
    userAgent: string;
  }): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('users')
        .update({
          last_login_at: new Date().toISOString(),
          last_login_ip: data.ip,
          last_login_user_agent: data.userAgent,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.userId);

      if (error) {
        logger.error('Failed to update last login', { error });
      }
    } catch (error) {
      logger.error('Update last login failed', {
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  /**
   * Verify email
   */
  async verifyEmail(userId: string): Promise<UserProfile> {
    try {
      const user = await this.updateUserProfile(userId, { emailVerified: true });
      
      auditLogger.dataAccess('system', 'verify_email', `user:${userId}`, 'system');
      
      return user;
    } catch (error) {
      logger.error('Verify email failed', {
        userId,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Enable/disable 2FA
   */
  async setTwoFactorEnabled(userId: string, enabled: boolean): Promise<UserProfile> {
    try {
      const user = await this.updateUserProfile(userId, { twoFactorEnabled: enabled });
      
      if (enabled) {
        auditLogger.twoFactorEnabled(userId, 'totp', 'system');
      } else {
        auditLogger.twoFactorDisabled(userId, 'system');
      }
      
      return user;
    } catch (error) {
      logger.error('Set 2FA enabled failed', {
        userId,
        enabled,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Lock/unlock account
   */
  async setAccountLocked(userId: string, locked: boolean): Promise<UserProfile> {
    try {
      const user = await this.updateUserProfile(userId, { accountLocked: locked });
      
      if (locked) {
        auditLogger.suspiciousActivity(userId, 'account_locked', 'system', { reason: 'manual_lock' });
      } else {
        auditLogger.suspiciousActivity(userId, 'account_unlocked', 'system', { reason: 'manual_unlock' });
      }
      
      return user;
    } catch (error) {
      logger.error('Set account locked failed', {
        userId,
        locked,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Update user role
   */
  async updateUserRole(userId: string, role: string): Promise<UserProfile> {
    try {
      const user = await this.updateUserProfile(userId, { role });
      
      auditLogger.dataAccess('system', 'update_role', `user:${userId}`, 'system');
      
      return user;
    } catch (error) {
      logger.error('Update user role failed', {
        userId,
        role,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Update user permissions
   */
  async updateUserPermissions(userId: string, permissions: string[]): Promise<UserProfile> {
    try {
      const user = await this.updateUserProfile(userId, { permissions });
      
      auditLogger.dataAccess('system', 'update_permissions', `user:${userId}`, 'system');
      
      return user;
    } catch (error) {
      logger.error('Update user permissions failed', {
        userId,
        permissions,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        logger.error('Failed to delete user from database', { error });
        throw new CustomError('Failed to delete user', 500);
      }

      auditLogger.dataAccess('system', 'delete', `user:${userId}`, 'system');
      
      logger.info('User deleted successfully', { userId });
    } catch (error) {
      logger.error('Delete user failed', {
        userId,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Get users with pagination
   */
  async getUsers(page: number = 1, limit: number = 10, filters?: any): Promise<{
    users: UserProfile[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      let query = this.supabase
        .from('users')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters) {
        if (filters.role) {
          query = query.eq('role', filters.role);
        }
        if (filters.emailVerified !== undefined) {
          query = query.eq('email_verified', filters.emailVerified);
        }
        if (filters.twoFactorEnabled !== undefined) {
          query = query.eq('two_factor_enabled', filters.twoFactorEnabled);
        }
        if (filters.accountLocked !== undefined) {
          query = query.eq('account_locked', filters.accountLocked);
        }
        if (filters.search) {
          query = query.or(`email.ilike.%${filters.search}%,first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%`);
        }
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        logger.error('Failed to get users', { error });
        throw new CustomError('Failed to get users', 500);
      }

      const users = data?.map(user => this.mapUserFromDatabase(user)) || [];
      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        users,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      logger.error('Get users failed', {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    total: number;
    active: number;
    verified: number;
    with2FA: number;
    locked: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
  }> {
    try {
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const { data, error } = await this.supabase
        .from('users')
        .select('created_at, email_verified, two_factor_enabled, account_locked, last_login_at');

      if (error) {
        logger.error('Failed to get user stats', { error });
        throw new CustomError('Failed to get user stats', 500);
      }

      const users = data || [];
      const now = new Date();

      const stats = {
        total: users.length,
        active: users.filter(user => {
          const lastLogin = user.last_login_at ? new Date(user.last_login_at) : null;
          return lastLogin && (now.getTime() - lastLogin.getTime()) < 30 * 24 * 60 * 60 * 1000; // 30 days
        }).length,
        verified: users.filter(user => user.email_verified).length,
        with2FA: users.filter(user => user.two_factor_enabled).length,
        locked: users.filter(user => user.account_locked).length,
        newToday: users.filter(user => {
          const createdAt = new Date(user.created_at);
          return createdAt.toDateString() === today.toDateString();
        }).length,
        newThisWeek: users.filter(user => {
          const createdAt = new Date(user.created_at);
          return createdAt >= weekAgo;
        }).length,
        newThisMonth: users.filter(user => {
          const createdAt = new Date(user.created_at);
          return createdAt >= monthAgo;
        }).length,
      };

      return stats;
    } catch (error) {
      logger.error('Get user stats failed', {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Map user from database format
   */
  private mapUserFromDatabase(data: any): UserProfile {
    return {
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      role: data.role,
      permissions: data.permissions || [],
      emailVerified: data.email_verified || false,
      twoFactorEnabled: data.two_factor_enabled || false,
      accountLocked: data.account_locked || false,
      lastLoginAt: data.last_login_at ? new Date(data.last_login_at) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}
