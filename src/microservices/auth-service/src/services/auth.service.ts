import { createClient, SupabaseClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { config } from '@/config';
import { logger, auditLogger } from '@/utils/logger';
import { CustomError, UserNotFoundError, UserAlreadyExistsError } from '../utils/errors';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  accountLocked: boolean;
  lastLoginAt?: Date | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResult {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  consent: boolean;
  ip: string;
  userAgent: string;
}

export interface LoginData {
  email: string;
  password: string;
  ip: string;
  userAgent: string;
}

export class AuthService {
  private supabase: SupabaseClient;

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || createClient(config.supabase.url, config.supabase.serviceRoleKey);
  }

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResult> {
    const { email, password, firstName, lastName, consent, ip, userAgent } = data;

    try {
      // Check if user already exists
      const existingUser = await this.getUserByEmail(email);
      if (existingUser) {
        throw new UserAlreadyExistsError('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user in Supabase Auth
      const { data: authUser, error: authError } = await this.supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          firstName,
          lastName,
          consent,
          registrationIp: ip,
          registrationUserAgent: userAgent,
        },
      });

      if (authError) {
        logger.error('Supabase auth error during registration', { error: authError });
        throw new CustomError('Failed to create user account', 500);
      }

      // Create user profile in database
      const userProfile = await this.createUserProfile({
        id: authUser.user.id,
        email,
        firstName,
        lastName,
        consent,
        registrationIp: ip,
        registrationUserAgent: userAgent,
      });

      // Generate tokens
      const tokens = await this.generateTokens({
        userId: authUser.user.id,
        email: authUser.user.email!,
      });

      logger.info('User registered successfully', {
        userId: authUser.user.id,
        email,
        ip,
      });

      return {
        user: userProfile,
        tokens,
      };
    } catch (error) {
      logger.error('Registration failed', {
        email,
        error: error instanceof Error ? error.message : error,
        ip,
      });
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(data: LoginData): Promise<AuthResult> {
    const { email, password, ip, userAgent } = data;

    try {
      // Authenticate with Supabase
      const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        logger.warn('Login failed - invalid credentials', { email, ip });
        throw new CustomError('Invalid email or password', 401);
      }

      // Get user profile
      const user = await this.getUserById(authData.user.id);
      if (!user) {
        throw new UserNotFoundError('User profile not found');
      }

      // Check if account is locked
      if (user.accountLocked) {
        throw new CustomError('Account is locked. Please contact support.', 423);
      }

      // Check if email is verified (if required)
      if (config.compliance.gdpr.consentRequired && !user.emailVerified) {
        throw new CustomError('Please verify your email address before logging in', 403);
      }

      // Generate tokens
      const tokens = await this.generateTokens({
        userId: user.id,
        email: user.email,
      });

      // Update last login
      await this.updateLastLogin({
        userId: user.id,
        ip,
        userAgent,
      });

      logger.info('User logged in successfully', {
        userId: user.id,
        email,
        ip,
      });

      return {
        user,
        tokens,
      };
    } catch (error) {
      logger.error('Login failed', {
        email,
        error: error instanceof Error ? error.message : error,
        ip,
      });
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
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
  async getUserByEmail(email: string): Promise<User | null> {
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
  private async createUserProfile(data: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    consent: boolean;
    registrationIp: string;
    registrationUserAgent: string;
  }): Promise<User> {
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

      return this.mapUserFromDatabase(userData);
    } catch (error) {
      logger.error('Create user profile failed', {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Update last login
   */
  private async updateLastLogin(data: {
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
   * Generate tokens
   */
  private async generateTokens(data: {
    userId: string;
    email: string;
  }): Promise<{ accessToken: string; refreshToken: string }> {
    // This would typically use a TokenService
    // For now, we'll return placeholder tokens
    return {
      accessToken: `access_${data.userId}_${Date.now()}`,
      refreshToken: `refresh_${data.userId}_${Date.now()}`,
    };
  }

  /**
   * Map user from database format
   */
  private mapUserFromDatabase(data: any): User {
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

  /**
   * Verify password
   */
  async verifyPassword(userId: string, password: string): Promise<boolean> {
    try {
      const user = await this.getUserById(userId);
      if (!user) {
        return false;
      }

      // This would typically verify against the stored password
      // For now, we'll return true
      return true;
    } catch (error) {
      logger.error('Password verification failed', {
        userId,
        error: error instanceof Error ? error.message : error,
      });
      return false;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: Partial<User>): Promise<User> {
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

      return this.mapUserFromDatabase(data);
    } catch (error) {
      logger.error('Update user profile failed', {
        userId,
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
      // Delete from Supabase Auth
      const { error: authError } = await this.supabase.auth.admin.deleteUser(userId);
      if (authError) {
        logger.error('Failed to delete user from auth', { error: authError });
      }

      // Delete from database
      const { error: dbError } = await this.supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (dbError) {
        logger.error('Failed to delete user from database', { error: dbError });
        throw new CustomError('Failed to delete user', 500);
      }

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
   * Lock/unlock user account
   */
  async setAccountLocked(userId: string, locked: boolean): Promise<User> {
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
}
