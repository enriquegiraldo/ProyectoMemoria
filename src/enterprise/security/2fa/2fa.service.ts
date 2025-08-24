import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export interface TwoFactorConfig {
  method: 'totp' | 'sms' | 'email';
  secret?: string;
  phoneNumber?: string;
  email?: string;
  enabled: boolean;
  createdAt: number;
  lastUsed?: number;
}

export interface TwoFactorSession {
  id: string;
  userId: string;
  method: string;
  expiresAt: number;
  verified: boolean;
}

export class TwoFactorService {
  private static instance: TwoFactorService;
  private sessions: Map<string, TwoFactorSession> = new Map();
  private userConfigs: Map<string, TwoFactorConfig> = new Map();

  static getInstance(): TwoFactorService {
    if (!TwoFactorService.instance) {
      TwoFactorService.instance = new TwoFactorService();
    }
    return TwoFactorService.instance;
  }

  // TOTP (Time-based One-Time Password)
  async setupTOTP(userId: string): Promise<{ secret: string; qrCode: string }> {
    const secret = crypto.randomBytes(20).toString('base32');
    const qrCode = this.generateTOTPQRCode(userId, secret);

    const config: TwoFactorConfig = {
      method: 'totp',
      secret,
      enabled: false,
      createdAt: Date.now()
    };

    this.userConfigs.set(userId, config);

    return { secret, qrCode };
  }

  async verifyTOTP(userId: string, token: string): Promise<boolean> {
    const config = this.userConfigs.get(userId);
    if (!config || config.method !== 'totp' || !config.secret) {
      return false;
    }

    const expectedToken = this.generateTOTPToken(config.secret);
    const isValid = token === expectedToken;

    if (isValid && !config.enabled) {
      config.enabled = true;
      this.userConfigs.set(userId, config);
    }

    return isValid;
  }

  private generateTOTPToken(secret: string): string {
    const time = Math.floor(Date.now() / 30000); // 30-second window
    const buffer = Buffer.alloc(8);
    buffer.writeBigUInt64BE(BigInt(time), 0);

    const hmac = crypto.createHmac('sha1', secret);
    hmac.update(buffer);
    const hash = hmac.digest();

    const offset = hash[hash.length - 1] & 0xf;
    const code = ((hash[offset] & 0x7f) << 24) |
                 ((hash[offset + 1] & 0xff) << 16) |
                 ((hash[offset + 2] & 0xff) << 8) |
                 (hash[offset + 3] & 0xff);

    return (code % 1000000).toString().padStart(6, '0');
  }

  private generateTOTPQRCode(userId: string, secret: string): string {
    const issuer = 'Memoria Eterna';
    const account = userId;
    const url = `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}`;
    return url;
  }

  // SMS 2FA
  async setupSMS(userId: string, phoneNumber: string): Promise<boolean> {
    try {
      const code = this.generateSMSCode();
      const success = await this.sendSMS(phoneNumber, code);

      if (success) {
        const config: TwoFactorConfig = {
          method: 'sms',
          phoneNumber,
          enabled: false,
          createdAt: Date.now()
        };

        this.userConfigs.set(userId, config);
        return true;
      }

      return false;
    } catch (error) {
      console.error('SMS setup error:', error);
      return false;
    }
  }

  async verifySMS(userId: string, code: string): Promise<boolean> {
    const config = this.userConfigs.get(userId);
    if (!config || config.method !== 'sms') {
      return false;
    }

    // In a real implementation, you would validate against the sent code
    // For now, we'll use a simple validation
    const isValid = code.length === 6 && /^\d+$/.test(code);

    if (isValid && !config.enabled) {
      config.enabled = true;
      this.userConfigs.set(userId, config);
    }

    return isValid;
  }

  private generateSMSCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async sendSMS(phoneNumber: string, code: string): Promise<boolean> {
    // In a real implementation, you would integrate with an SMS service
    // like Twilio, AWS SNS, etc.
    console.log(`SMS sent to ${phoneNumber}: Your verification code is ${code}`);
    return true;
  }

  // Email 2FA
  async setupEmail(userId: string, email: string): Promise<boolean> {
    try {
      const code = this.generateEmailCode();
      const success = await this.sendEmail(email, code);

      if (success) {
        const config: TwoFactorConfig = {
          method: 'email',
          email,
          enabled: false,
          createdAt: Date.now()
        };

        this.userConfigs.set(userId, config);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Email setup error:', error);
      return false;
    }
  }

  async verifyEmail(userId: string, code: string): Promise<boolean> {
    const config = this.userConfigs.get(userId);
    if (!config || config.method !== 'email') {
      return false;
    }

    // In a real implementation, you would validate against the sent code
    const isValid = code.length === 6 && /^\d+$/.test(code);

    if (isValid && !config.enabled) {
      config.enabled = true;
      this.userConfigs.set(userId, config);
    }

    return isValid;
  }

  private generateEmailCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async sendEmail(email: string, code: string): Promise<boolean> {
    // In a real implementation, you would integrate with an email service
    console.log(`Email sent to ${email}: Your verification code is ${code}`);
    return true;
  }

  // Session Management
  async create2FASession(userId: string, method: string): Promise<string> {
    const sessionId = crypto.randomBytes(16).toString('hex');
    const session: TwoFactorSession = {
      id: sessionId,
      userId,
      method,
      expiresAt: Date.now() + 300000, // 5 minutes
      verified: false
    };

    this.sessions.set(sessionId, session);
    return sessionId;
  }

  async verify2FASession(sessionId: string, code: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session || Date.now() > session.expiresAt) {
      return false;
    }

    let isValid = false;

    switch (session.method) {
      case 'totp':
        isValid = await this.verifyTOTP(session.userId, code);
        break;
      case 'sms':
        isValid = await this.verifySMS(session.userId, code);
        break;
      case 'email':
        isValid = await this.verifyEmail(session.userId, code);
        break;
    }

    if (isValid) {
      session.verified = true;
      this.sessions.set(sessionId, session);
    }

    return isValid;
  }

  async get2FASession(sessionId: string): Promise<TwoFactorSession | null> {
    const session = this.sessions.get(sessionId);
    if (!session || Date.now() > session.expiresAt) {
      return null;
    }
    return session;
  }

  async is2FARequired(userId: string): Promise<boolean> {
    const config = this.userConfigs.get(userId);
    return config?.enabled || false;
  }

  async get2FAConfig(userId: string): Promise<TwoFactorConfig | null> {
    return this.userConfigs.get(userId) || null;
  }

  async disable2FA(userId: string): Promise<boolean> {
    const config = this.userConfigs.get(userId);
    if (config) {
      config.enabled = false;
      this.userConfigs.set(userId, config);
      return true;
    }
    return false;
  }

  async update2FAMethod(userId: string, method: 'totp' | 'sms' | 'email', value: string): Promise<boolean> {
    const config = this.userConfigs.get(userId);
    if (!config) {
      return false;
    }

    switch (method) {
      case 'totp':
        config.secret = value;
        break;
      case 'sms':
        config.phoneNumber = value;
        break;
      case 'email':
        config.email = value;
        break;
    }

    config.method = method;
    config.enabled = false;
    this.userConfigs.set(userId, config);
    return true;
  }

  // Cleanup expired sessions
  cleanupExpiredSessions(): void {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt <= now) {
        this.sessions.delete(sessionId);
      }
    }
  }

  // Get statistics
  getStats(): { totalUsers: number; enabledUsers: number; sessions: number } {
    const totalUsers = this.userConfigs.size;
    const enabledUsers = Array.from(this.userConfigs.values()).filter(config => config.enabled).length;
    const sessions = this.sessions.size;

    return { totalUsers, enabledUsers, sessions };
  }
}

export const twoFactorService = TwoFactorService.getInstance();
