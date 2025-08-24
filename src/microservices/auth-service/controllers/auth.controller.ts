import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config';
import { AuthService } from '../services/auth.service';
import { EmailService } from '../services/email.service';
import { TokenService } from '../services/token.service';
import { UserService } from '../services/user.service';
import { logger, auditLogger } from '../utils/logger';
import { CustomError } from '../utils/errors';

export class AuthController {
  private authService: AuthService;
  private emailService: EmailService;
  private tokenService: TokenService;
  private userService: UserService;
  private supabase: any;

  constructor() {
    this.supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);
    this.authService = new AuthService(this.supabase);
    this.emailService = new EmailService();
    this.tokenService = new TokenService();
    this.userService = new UserService(this.supabase);
  }

  /**
   * Register a new user
   */
  async register(params: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    consent: boolean;
    ip: string;
    userAgent: string;
  }) {
    const { email, password, firstName, lastName, consent, ip, userAgent } = params;

    try {
      // Check if user already exists
      const existingUser = await this.userService.getUserByEmail(email);
      if (existingUser) {
        throw new CustomError('User already exists', 409);
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
      const userProfile = await this.userService.createUserProfile({
        id: authUser.user.id,
        email,
        firstName,
        lastName,
        consent,
        registrationIp: ip,
        registrationUserAgent: userAgent,
      });

      // Generate tokens
      const tokens = await this.tokenService.generateTokens({
        userId: authUser.user.id,
        email: authUser.user.email!,
      });

      // Send welcome email
      await this.emailService.sendWelcomeEmail({
        email,
        firstName,
        lastName,
      });

      // Send verification email
      await this.emailService.sendVerificationEmail({
        email,
        firstName,
        verificationToken: tokens.verificationToken,
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
  async login(params: {
    email: string;
    password: string;
    ip: string;
    userAgent: string;
  }) {
    const { email, password, ip, userAgent } = params;

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
      const user = await this.userService.getUserById(authData.user.id);
      if (!user) {
        throw new CustomError('User profile not found', 404);
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
      const tokens = await this.tokenService.generateTokens({
        userId: user.id,
        email: user.email,
      });

      // Update last login
      await this.userService.updateLastLogin({
        userId: user.id,
        ip,
        userAgent,
      });

      // Log successful login
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
   * Logout user
   */
  async logout(params: {
    userId: string;
    refreshToken: string;
    ip: string;
  }) {
    const { userId, refreshToken, ip } = params;

    try {
      // Invalidate refresh token
      await this.tokenService.invalidateRefreshToken(refreshToken);

      // Log logout
      logger.info('User logged out', {
        userId,
        ip,
      });

      return { success: true };
    } catch (error) {
      logger.error('Logout failed', {
        userId,
        error: error instanceof Error ? error.message : error,
        ip,
      });
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(params: {
    refreshToken: string;
  }) {
    const { refreshToken } = params;

    try {
      // Verify refresh token
      const payload = await this.tokenService.verifyRefreshToken(refreshToken);

      // Get user
      const user = await this.userService.getUserById(payload.userId);
      if (!user) {
        throw new CustomError('User not found', 404);
      }

      // Generate new tokens
      const tokens = await this.tokenService.generateTokens({
        userId: user.id,
        email: user.email,
      });

      // Invalidate old refresh token
      await this.tokenService.invalidateRefreshToken(refreshToken);

      logger.info('Token refreshed successfully', {
        userId: user.id,
      });

      return { tokens };
    } catch (error) {
      logger.error('Token refresh failed', {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(params: {
    userId: string;
    currentPassword: string;
    newPassword: string;
    ip: string;
  }) {
    const { userId, currentPassword, newPassword, ip } = params;

    try {
      // Get user
      const user = await this.userService.getUserById(userId);
      if (!user) {
        throw new CustomError('User not found', 404);
      }

      // Verify current password
      const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (authError) {
        throw new CustomError('Current password is incorrect', 401);
      }

      // Update password in Supabase
      const { error: updateError } = await this.supabase.auth.admin.updateUserById(userId, {
        password: newPassword,
      });

      if (updateError) {
        logger.error('Failed to update password in Supabase', { error: updateError });
        throw new CustomError('Failed to update password', 500);
      }

      // Invalidate all refresh tokens for user
      await this.tokenService.invalidateAllUserTokens(userId);

      // Send password change notification email
      await this.emailService.sendPasswordChangeNotification({
        email: user.email,
        firstName: user.firstName,
        ip,
      });

      logger.info('Password changed successfully', {
        userId,
        ip,
      });

      return { success: true };
    } catch (error) {
      logger.error('Password change failed', {
        userId,
        error: error instanceof Error ? error.message : error,
        ip,
      });
      throw error;
    }
  }

  /**
   * Send forgot password email
   */
  async forgotPassword(params: {
    email: string;
    ip: string;
  }) {
    const { email, ip } = params;

    try {
      // Get user
      const user = await this.userService.getUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not
        logger.info('Password reset requested for non-existent email', { email, ip });
        return { success: true };
      }

      // Generate reset token
      const resetToken = await this.tokenService.generatePasswordResetToken({
        userId: user.id,
        email: user.email,
      });

      // Send reset email
      await this.emailService.sendPasswordResetEmail({
        email: user.email,
        firstName: user.firstName,
        resetToken,
      });

      logger.info('Password reset email sent', {
        userId: user.id,
        email,
        ip,
      });

      return { success: true };
    } catch (error) {
      logger.error('Password reset email failed', {
        email,
        error: error instanceof Error ? error.message : error,
        ip,
      });
      throw error;
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(params: {
    token: string;
    newPassword: string;
    ip: string;
  }) {
    const { token, newPassword, ip } = params;

    try {
      // Verify reset token
      const payload = await this.tokenService.verifyPasswordResetToken(token);

      // Get user
      const user = await this.userService.getUserById(payload.userId);
      if (!user) {
        throw new CustomError('User not found', 404);
      }

      // Update password in Supabase
      const { error: updateError } = await this.supabase.auth.admin.updateUserById(user.id, {
        password: newPassword,
      });

      if (updateError) {
        logger.error('Failed to update password in Supabase', { error: updateError });
        throw new CustomError('Failed to reset password', 500);
      }

      // Invalidate all refresh tokens for user
      await this.tokenService.invalidateAllUserTokens(user.id);

      // Generate new tokens
      const tokens = await this.tokenService.generateTokens({
        userId: user.id,
        email: user.email,
      });

      // Send password reset confirmation email
      await this.emailService.sendPasswordResetConfirmation({
        email: user.email,
        firstName: user.firstName,
        ip,
      });

      logger.info('Password reset successfully', {
        userId: user.id,
        ip,
      });

      return {
        user,
        tokens,
        userId: user.id,
      };
    } catch (error) {
      logger.error('Password reset failed', {
        error: error instanceof Error ? error.message : error,
        ip,
      });
      throw error;
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(params: {
    userId: string;
  }) {
    const { userId } = params;

    try {
      const user = await this.userService.getUserById(userId);
      if (!user) {
        throw new CustomError('User not found', 404);
      }

      return user;
    } catch (error) {
      logger.error('Get current user failed', {
        userId,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Verify email address
   */
  async verifyEmail(params: {
    token: string;
    ip: string;
  }) {
    const { token, ip } = params;

    try {
      // Verify email token
      const payload = await this.tokenService.verifyEmailToken(token);

      // Get user
      const user = await this.userService.getUserById(payload.userId);
      if (!user) {
        throw new CustomError('User not found', 404);
      }

      // Update email verification status
      await this.userService.verifyEmail(userId);

      // Generate new tokens
      const tokens = await this.tokenService.generateTokens({
        userId: user.id,
        email: user.email,
      });

      logger.info('Email verified successfully', {
        userId: user.id,
        ip,
      });

      return {
        user,
        tokens,
      };
    } catch (error) {
      logger.error('Email verification failed', {
        error: error instanceof Error ? error.message : error,
        ip,
      });
      throw error;
    }
  }

  /**
   * Resend verification email
   */
  async resendVerification(params: {
    email: string;
    ip: string;
  }) {
    const { email, ip } = params;

    try {
      // Get user
      const user = await this.userService.getUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not
        logger.info('Verification email requested for non-existent email', { email, ip });
        return { success: true };
      }

      if (user.emailVerified) {
        throw new CustomError('Email is already verified', 400);
      }

      // Generate new verification token
      const verificationToken = await this.tokenService.generateEmailVerificationToken({
        userId: user.id,
        email: user.email,
      });

      // Send verification email
      await this.emailService.sendVerificationEmail({
        email: user.email,
        firstName: user.firstName,
        verificationToken,
      });

      logger.info('Verification email resent', {
        userId: user.id,
        email,
        ip,
      });

      return { success: true };
    } catch (error) {
      logger.error('Resend verification email failed', {
        email,
        error: error instanceof Error ? error.message : error,
        ip,
      });
      throw error;
    }
  }
}
