import { InstagramApiError, InstagramConfig, SocialUser, SocialPost, SocialPage, SocialInsights } from './types';

export interface InstagramUser {
  id: string;
  username: string;
  account_type: 'BUSINESS' | 'CREATOR' | 'PERSONAL';
  media_count?: number;
  followers_count?: number;
  follows_count?: number;
  profile_picture_url?: string;
}

export interface InstagramMedia {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
}

export interface InstagramStory {
  id: string;
  media_type: 'IMAGE' | 'VIDEO';
  media_url: string;
  permalink: string;
  timestamp: string;
}

export interface InstagramReel {
  id: string;
  caption?: string;
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
  play_count?: number;
}

export class InstagramIntegration {
  private appId: string;
  private appSecret: string;
  private baseUrl = 'https://graph.instagram.com/v18.0';

  constructor() {
    this.appId = process.env.INSTAGRAM_APP_ID || '';
    this.appSecret = process.env.INSTAGRAM_APP_SECRET || '';
    
    if (!this.appId || !this.appSecret) {
      throw new Error('Instagram credentials not configured');
    }
  }

  /**
   * Get OAuth 2.0 access token
   */
  async getAccessToken(code: string, redirectUri: string): Promise<string> {
    try {
      const response = await fetch('https://api.instagram.com/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.appId,
          client_secret: this.appSecret,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
          code,
        }),
      });

      if (!response.ok) {
        throw new InstagramApiError('Failed to get access token', response.status);
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      throw new InstagramApiError('Error getting access token', 500, error);
    }
  }

  /**
   * Get long-lived access token
   */
  async getLongLivedToken(shortLivedToken: string): Promise<string> {
    try {
      const response = await fetch(
        `${this.baseUrl}/access_token?grant_type=ig_exchange_token&client_secret=${this.appSecret}&access_token=${shortLivedToken}`
      );

      if (!response.ok) {
        throw new InstagramApiError('Failed to get long-lived token', response.status);
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      throw new InstagramApiError('Error getting long-lived token', 500, error);
    }
  }

  /**
   * Refresh long-lived access token
   */
  async refreshLongLivedToken(longLivedToken: string): Promise<string> {
    try {
      const response = await fetch(
        `${this.baseUrl}/refresh_access_token?grant_type=ig_refresh_token&access_token=${longLivedToken}`
      );

      if (!response.ok) {
        throw new InstagramApiError('Failed to refresh token', response.status);
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      throw new InstagramApiError('Error refreshing token', 500, error);
    }
  }

  /**
   * Get user profile information
   */
  async getUserProfile(accessToken: string): Promise<InstagramUser> {
    try {
      const response = await fetch(
        `${this.baseUrl}/me?fields=id,username,account_type,media_count,followers_count,follows_count,profile_picture_url&access_token=${accessToken}`
      );

      if (!response.ok) {
        throw new InstagramApiError('Failed to get user profile', response.status);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw new InstagramApiError('Error getting user profile', 500, error);
    }
  }

  /**
   * Get user's media
   */
  async getUserMedia(
    accessToken: string,
    limit: number = 25,
    after?: string
  ): Promise<{ data: InstagramMedia[]; paging?: { cursors?: { after?: string } } }> {
    try {
      let url = `${this.baseUrl}/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=${limit}&access_token=${accessToken}`;
      
      if (after) {
        url += `&after=${after}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new InstagramApiError('Failed to get user media', response.status);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw new InstagramApiError('Error getting user media', 500, error);
    }
  }

  /**
   * Get specific media by ID
   */
  async getMediaById(accessToken: string, mediaId: string): Promise<InstagramMedia> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${mediaId}?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&access_token=${accessToken}`
      );

      if (!response.ok) {
        throw new InstagramApiError('Failed to get media by ID', response.status);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw new InstagramApiError('Error getting media by ID', 500, error);
    }
  }

  /**
   * Get media insights (requires Business or Creator account)
   */
  async getMediaInsights(
    accessToken: string,
    mediaId: string,
    metrics: string[] = ['impressions', 'reach', 'engagement', 'saved']
  ): Promise<SocialInsights[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${mediaId}/insights?metric=${metrics.join(',')}&access_token=${accessToken}`
      );

      if (!response.ok) {
        throw new InstagramApiError('Failed to get media insights', response.status);
      }

      const data = await response.json();
      return data.data.map((insight: any) => ({
        platform: 'instagram',
        metric: insight.name,
        value: insight.values[0].value,
        date: insight.values[0].end_time,
      }));
    } catch (error) {
      throw new InstagramApiError('Error getting media insights', 500, error);
    }
  }

  /**
   * Get user insights (requires Business or Creator account)
   */
  async getUserInsights(
    accessToken: string,
    metrics: string[] = ['impressions', 'reach', 'profile_views', 'follower_count']
  ): Promise<SocialInsights[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/me/insights?metric=${metrics.join(',')}&period=day&access_token=${accessToken}`
      );

      if (!response.ok) {
        throw new InstagramApiError('Failed to get user insights', response.status);
      }

      const data = await response.json();
      return data.data.map((insight: any) => ({
        platform: 'instagram',
        metric: insight.name,
        value: insight.values[0].value,
        date: insight.values[0].end_time,
      }));
    } catch (error) {
      throw new InstagramApiError('Error getting user insights', 500, error);
    }
  }

  /**
   * Get hashtag ID
   */
  async getHashtagId(accessToken: string, hashtag: string): Promise<string> {
    try {
      const response = await fetch(
        `${this.baseUrl}/ig_hashtag_search?user_token=${accessToken}&q=${encodeURIComponent(hashtag)}`
      );

      if (!response.ok) {
        throw new InstagramApiError('Failed to get hashtag ID', response.status);
      }

      const data = await response.json();
      return data.data[0].id;
    } catch (error) {
      throw new InstagramApiError('Error getting hashtag ID', 500, error);
    }
  }

  /**
   * Get hashtag media
   */
  async getHashtagMedia(
    accessToken: string,
    hashtagId: string,
    limit: number = 25
  ): Promise<InstagramMedia[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${hashtagId}/top_media?user_token=${accessToken}&fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=${limit}`
      );

      if (!response.ok) {
        throw new InstagramApiError('Failed to get hashtag media', response.status);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      throw new InstagramApiError('Error getting hashtag media', 500, error);
    }
  }

  /**
   * Get user's stories (requires Business or Creator account)
   */
  async getUserStories(accessToken: string): Promise<InstagramStory[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/me/stories?fields=id,media_type,media_url,permalink,timestamp&access_token=${accessToken}`
      );

      if (!response.ok) {
        throw new InstagramApiError('Failed to get user stories', response.status);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      throw new InstagramApiError('Error getting user stories', 500, error);
    }
  }

  /**
   * Get user's reels (requires Business or Creator account)
   */
  async getUserReels(
    accessToken: string,
    limit: number = 25
  ): Promise<InstagramReel[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/me/media?media_type=REELS&fields=id,caption,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count,play_count&limit=${limit}&access_token=${accessToken}`
      );

      if (!response.ok) {
        throw new InstagramApiError('Failed to get user reels', response.status);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      throw new InstagramApiError('Error getting user reels', 500, error);
    }
  }

  /**
   * Search for users
   */
  async searchUsers(
    accessToken: string,
    query: string,
    limit: number = 10
  ): Promise<InstagramUser[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/ig_hashtag_search?user_token=${accessToken}&q=${encodeURIComponent(query)}&type=user&limit=${limit}`
      );

      if (!response.ok) {
        throw new InstagramApiError('Failed to search users', response.status);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      throw new InstagramApiError('Error searching users', 500, error);
    }
  }

  /**
   * Get comments for a media item
   */
  async getMediaComments(
    accessToken: string,
    mediaId: string,
    limit: number = 25
  ): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${mediaId}/comments?fields=id,text,timestamp,username&limit=${limit}&access_token=${accessToken}`
      );

      if (!response.ok) {
        throw new InstagramApiError('Failed to get media comments', response.status);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      throw new InstagramApiError('Error getting media comments', 500, error);
    }
  }

  /**
   * Get likes for a media item
   */
  async getMediaLikes(
    accessToken: string,
    mediaId: string,
    limit: number = 25
  ): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${mediaId}/likes?limit=${limit}&access_token=${accessToken}`
      );

      if (!response.ok) {
        throw new InstagramApiError('Failed to get media likes', response.status);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      throw new InstagramApiError('Error getting media likes', 500, error);
    }
  }

  /**
   * Note: Instagram Basic Display API doesn't support posting content
   * This would require Instagram Graph API with Business/Creator accounts
   */
  async postMedia(
    accessToken: string,
    imageUrl: string,
    caption?: string
  ): Promise<InstagramMedia> {
    throw new InstagramApiError(
      'Posting to Instagram requires Instagram Graph API with Business/Creator accounts. Basic Display API only supports reading data.',
      400
    );
  }

  /**
   * Note: Instagram Basic Display API doesn't support posting stories
   * This would require Instagram Graph API with Business/Creator accounts
   */
  async postStory(
    accessToken: string,
    imageUrl: string,
    caption?: string
  ): Promise<InstagramStory> {
    throw new InstagramApiError(
      'Posting stories to Instagram requires Instagram Graph API with Business/Creator accounts. Basic Display API only supports reading data.',
      400
    );
  }

  /**
   * Note: Instagram Basic Display API doesn't support posting reels
   * This would require Instagram Graph API with Business/Creator accounts
   */
  async postReel(
    accessToken: string,
    videoUrl: string,
    caption?: string
  ): Promise<InstagramReel> {
    throw new InstagramApiError(
      'Posting reels to Instagram requires Instagram Graph API with Business/Creator accounts. Basic Display API only supports reading data.',
      400
    );
  }
}

export const instagramIntegration = new InstagramIntegration();
