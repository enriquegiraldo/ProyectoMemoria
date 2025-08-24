import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config';
import { logger } from '../utils/logger';
import { CustomError, TokenError, TokenExpiredError, TokenInvalidError } from '../utils/errors';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class TokenService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;

  constructor() {
    this.accessTokenSecret = config.jwt.secret;
    this.refreshTokenSecret = config.jwt.secret + '_refresh';
  }

  /**
   * Generate access token
   */
  generateAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
    try {
      const tokenPayload: TokenPayload = {
        ...payload,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + this.getAccessTokenExpiration(),
      };

      return jwt.sign(tokenPayload, this.accessTokenSecret, {
        algorithm: 'HS256',
        issuer: 'memoria-eterna-auth',
        audience: 'memoria-eterna-users',
      });
    } catch (error) {
      logger.error('Failed to generate access token', {
        error: error instanceof Error ? error.message : error,
        userId: payload.userId,
      });
      throw new TokenError('Failed to generate access token');
    }
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
    try {
      const tokenPayload: TokenPayload = {
        ...payload,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + this.getRefreshTokenExpiration(),
      };

      return jwt.sign(tokenPayload, this.refreshTokenSecret, {
        algorithm: 'HS256',
        issuer: 'memoria-eterna-auth',
        audience: 'memoria-eterna-users',
      });
    } catch (error) {
      logger.error('Failed to generate refresh token', {
        error: error instanceof Error ? error.message : error,
        userId: payload.userId,
      });
      throw new TokenError('Failed to generate refresh token');
    }
  }

  /**
   * Generate token pair (access + refresh)
   */
  generateTokenPair(payload: Omit<TokenPayload, 'iat' | 'exp'>): TokenPair {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): TokenPayload {
    try {
      const payload = jwt.verify(token, this.accessTokenSecret, {
        algorithms: ['HS256'],
        issuer: 'memoria-eterna-auth',
        audience: 'memoria-eterna-users',
      }) as TokenPayload;

      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new TokenExpiredError('Access token has expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new TokenInvalidError('Invalid access token');
      } else {
        logger.error('Token verification failed', {
          error: error instanceof Error ? error.message : error,
        });
        throw new TokenError('Token verification failed');
      }
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): TokenPayload {
    try {
      const payload = jwt.verify(token, this.refreshTokenSecret, {
        algorithms: ['HS256'],
        issuer: 'memoria-eterna-auth',
        audience: 'memoria-eterna-users',
      }) as TokenPayload;

      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new TokenExpiredError('Refresh token has expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new TokenInvalidError('Invalid refresh token');
      } else {
        logger.error('Refresh token verification failed', {
          error: error instanceof Error ? error.message : error,
        });
        throw new TokenError('Refresh token verification failed');
      }
    }
  }

  /**
   * Invalidate refresh token
   */
  async invalidateRefreshToken(token: string): Promise<void> {
    try {
      const payload = this.verifyRefreshToken(token);
      logger.info('Refresh token invalidated', {
        userId: payload.userId,
      });
    } catch (error) {
      logger.error('Failed to invalidate refresh token', {
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  /**
   * Invalidate all tokens for a user
   */
  async invalidateAllUserTokens(userId: string): Promise<void> {
    try {
      logger.info('All tokens invalidated for user', { userId });
    } catch (error) {
      logger.error('Failed to invalidate user tokens', {
        error: error instanceof Error ? error.message : error,
        userId,
      });
    }
  }

  /**
   * Get token expiration time in seconds
   */
  private getAccessTokenExpiration(): number {
    return 24 * 60 * 60; // 24 hours default
  }

  /**
   * Get refresh token expiration time in seconds
   */
  private getRefreshTokenExpiration(): number {
    return 7 * 24 * 60 * 60; // 7 days default
  }
}
