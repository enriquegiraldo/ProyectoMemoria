import { FacebookApiError } from './types';

export interface FacebookUser {
  id: string;
  name: string;
  email: string;
  picture?: {
    data: {
      url: string;
    };
  };
}

export interface FacebookPost {
  id: string;
  message: string;
  created_time: string;
  permalink_url: string;
}

export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  category: string;
  fan_count?: number;
}

export class FacebookIntegration {
  private appId: string;
  private appSecret: string;
  private baseUrl = 'https://graph.facebook.com/v18.0';

  constructor() {
    this.appId = process.env.FACEBOOK_APP_ID || '';
    this.appSecret = process.env.FACEBOOK_APP_SECRET || '';
    
    if (!this.appId || !this.appSecret) {
      throw new Error('Facebook credentials not configured');
    }
  }

  /**
   * Get user access token from authorization code
   */
  async getAccessToken(code: string, redirectUri: string): Promise<string> {
    try {
      const response = await fetch(
        `${this.baseUrl}/oauth/access_token?` +
        `client_id=${this.appId}&` +
        `client_secret=${this.appSecret}&` +
        `code=${code}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}`
      );

      if (!response.ok) {
        throw new FacebookApiError('Failed to get access token', response.status);
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      throw new FacebookApiError('Error getting access token', 500, error);
    }
  }

  /**
   * Get user profile information
   */
  async getUserProfile(accessToken: string): Promise<FacebookUser> {
    try {
      const response = await fetch(
        `${this.baseUrl}/me?` +
        `fields=id,name,email,picture&` +
        `access_token=${accessToken}`
      );

      if (!response.ok) {
        throw new FacebookApiError('Failed to get user profile', response.status);
      }

      return await response.json();
    } catch (error) {
      throw new FacebookApiError('Error getting user profile', 500, error);
    }
  }

  /**
   * Get user's Facebook pages
   */
  async getUserPages(accessToken: string): Promise<FacebookPage[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/me/accounts?` +
        `access_token=${accessToken}`
      );

      if (!response.ok) {
        throw new FacebookApiError('Failed to get user pages', response.status);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      throw new FacebookApiError('Error getting user pages', 500, error);
    }
  }

  /**
   * Post content to Facebook
   */
  async postToFacebook(
    accessToken: string,
    message: string,
    link?: string,
    imageUrl?: string
  ): Promise<FacebookPost> {
    try {
      const postData: any = {
        message,
        access_token: accessToken
      };

      if (link) {
        postData.link = link;
      }

      if (imageUrl) {
        postData.picture = imageUrl;
      }

      const response = await fetch(
        `${this.baseUrl}/me/feed`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData)
        }
      );

      if (!response.ok) {
        throw new FacebookApiError('Failed to post to Facebook', response.status);
      }

      const result = await response.json();
      return {
        id: result.id,
        message,
        created_time: new Date().toISOString(),
        permalink_url: `https://www.facebook.com/permalink.php?story_fbid=${result.id.split('_')[1]}`
      };
    } catch (error) {
      throw new FacebookApiError('Error posting to Facebook', 500, error);
    }
  }

  /**
   * Post to a specific Facebook page
   */
  async postToPage(
    pageId: string,
    pageAccessToken: string,
    message: string,
    link?: string,
    imageUrl?: string
  ): Promise<FacebookPost> {
    try {
      const postData: any = {
        message,
        access_token: pageAccessToken
      };

      if (link) {
        postData.link = link;
      }

      if (imageUrl) {
        postData.picture = imageUrl;
      }

      const response = await fetch(
        `${this.baseUrl}/${pageId}/feed`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData)
        }
      );

      if (!response.ok) {
        throw new FacebookApiError('Failed to post to page', response.status);
      }

      const result = await response.json();
      return {
        id: result.id,
        message,
        created_time: new Date().toISOString(),
        permalink_url: `https://www.facebook.com/permalink.php?story_fbid=${result.id.split('_')[1]}`
      };
    } catch (error) {
      throw new FacebookApiError('Error posting to page', 500, error);
    }
  }

  /**
   * Get page insights
   */
  async getPageInsights(
    pageId: string,
    pageAccessToken: string,
    metric: string = 'page_impressions'
  ): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${pageId}/insights?` +
        `metric=${metric}&` +
        `access_token=${pageAccessToken}`
      );

      if (!response.ok) {
        throw new FacebookApiError('Failed to get page insights', response.status);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      throw new FacebookApiError('Error getting page insights', 500, error);
    }
  }

  /**
   * Schedule a post
   */
  async schedulePost(
    accessToken: string,
    message: string,
    scheduledPublishTime: Date,
    link?: string,
    imageUrl?: string
  ): Promise<FacebookPost> {
    try {
      const postData: any = {
        message,
        published: false,
        scheduled_publish_time: Math.floor(scheduledPublishTime.getTime() / 1000),
        access_token: accessToken
      };

      if (link) {
        postData.link = link;
      }

      if (imageUrl) {
        postData.picture = imageUrl;
      }

      const response = await fetch(
        `${this.baseUrl}/me/feed`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData)
        }
      );

      if (!response.ok) {
        throw new FacebookApiError('Failed to schedule post', response.status);
      }

      const result = await response.json();
      return {
        id: result.id,
        message,
        created_time: scheduledPublishTime.toISOString(),
        permalink_url: `https://www.facebook.com/permalink.php?story_fbid=${result.id.split('_')[1]}`
      };
    } catch (error) {
      throw new FacebookApiError('Error scheduling post', 500, error);
    }
  }

  /**
   * Get long-lived access token
   */
  async getLongLivedToken(shortLivedToken: string): Promise<string> {
    try {
      const response = await fetch(
        `${this.baseUrl}/oauth/access_token?` +
        `grant_type=fb_exchange_token&` +
        `client_id=${this.appId}&` +
        `client_secret=${this.appSecret}&` +
        `fb_exchange_token=${shortLivedToken}`
      );

      if (!response.ok) {
        throw new FacebookApiError('Failed to get long-lived token', response.status);
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      throw new FacebookApiError('Error getting long-lived token', 500, error);
    }
  }
}

export const facebookIntegration = new FacebookIntegration();
