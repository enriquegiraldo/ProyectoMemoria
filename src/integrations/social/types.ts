// Base error class for social media API errors
export class SocialApiError extends Error {
  public statusCode: number;
  public originalError?: any;

  constructor(message: string, statusCode: number = 500, originalError?: any) {
    super(message);
    this.name = 'SocialApiError';
    this.statusCode = statusCode;
    this.originalError = originalError;
  }
}

// Specific error classes for each platform
export class FacebookApiError extends SocialApiError {
  constructor(message: string, statusCode: number = 500, originalError?: any) {
    super(message, statusCode, originalError);
    this.name = 'FacebookApiError';
  }
}

export class TwitterApiError extends SocialApiError {
  constructor(message: string, statusCode: number = 500, originalError?: any) {
    super(message, statusCode, originalError);
    this.name = 'TwitterApiError';
  }
}

export class InstagramApiError extends SocialApiError {
  constructor(message: string, statusCode: number = 500, originalError?: any) {
    super(message, statusCode, originalError);
    this.name = 'InstagramApiError';
  }
}

export class LinkedInApiError extends SocialApiError {
  constructor(message: string, statusCode: number = 500, originalError?: any) {
    super(message, statusCode, originalError);
    this.name = 'LinkedInApiError';
  }
}

// Common interfaces for social media data
export interface SocialUser {
  id: string;
  name: string;
  email?: string;
  picture?: string;
  platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin';
}

export interface SocialPost {
  id: string;
  message: string;
  created_time: string;
  permalink_url: string;
  platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin';
  media_urls?: string[];
}

export interface SocialPage {
  id: string;
  name: string;
  access_token: string;
  category?: string;
  fan_count?: number;
  platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin';
}

export interface SocialInsights {
  platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin';
  metric: string;
  value: number;
  date: string;
}

// Authentication interfaces
export interface SocialAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope?: string[];
}

export interface SocialAuthResult {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  user: SocialUser;
}

// Post creation interfaces
export interface CreatePostData {
  message: string;
  link?: string;
  imageUrls?: string[];
  scheduledTime?: Date;
  platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin';
}

export interface PostResult {
  success: boolean;
  post?: SocialPost;
  error?: string;
}

// Analytics interfaces
export interface SocialAnalytics {
  platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin';
  metrics: {
    impressions?: number;
    reach?: number;
    engagement?: number;
    clicks?: number;
    shares?: number;
    likes?: number;
    comments?: number;
  };
  period: {
    start: string;
    end: string;
  };
}

// Webhook interfaces
export interface SocialWebhook {
  id: string;
  platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin';
  url: string;
  events: string[];
  secret?: string;
  active: boolean;
}

export interface WebhookPayload {
  platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin';
  event: string;
  data: any;
  timestamp: string;
}

// Rate limiting interfaces
export interface RateLimitInfo {
  remaining: number;
  reset: number;
  limit: number;
  platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin';
}

// Platform-specific configurations
export interface FacebookConfig extends SocialAuthConfig {
  appId: string;
  appSecret: string;
  version: string;
}

export interface TwitterConfig extends SocialAuthConfig {
  apiKey: string;
  apiSecret: string;
  bearerToken?: string;
}

export interface InstagramConfig extends SocialAuthConfig {
  appId: string;
  appSecret: string;
  basicDisplayApi: boolean;
}

export interface LinkedInConfig extends SocialAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

// Integration status
export interface IntegrationStatus {
  platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin';
  connected: boolean;
  lastSync?: string;
  error?: string;
  permissions?: string[];
}

// Memory sharing interfaces
export interface ShareMemoryData {
  memoryId: string;
  platforms: ('facebook' | 'twitter' | 'instagram' | 'linkedin')[];
  customMessage?: string;
  includeMedia: boolean;
  scheduledTime?: Date;
}

export interface ShareMemoryResult {
  memoryId: string;
  shares: {
    platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin';
    success: boolean;
    postId?: string;
    url?: string;
    error?: string;
  }[];
}
