import { TwitterApiError, TwitterConfig, SocialUser, SocialPost, SocialPage, SocialInsights } from './types';

export interface TwitterUser {
  id: string;
  username: string;
  name: string;
  profile_image_url?: string;
  email?: string;
}

export interface TwitterTweet {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
  public_metrics?: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
  };
}

export interface TwitterMedia {
  media_key: string;
  type: 'photo' | 'video' | 'animated_gif';
  url?: string;
  preview_image_url?: string;
}

export class TwitterIntegration {
  private apiKey: string;
  private apiSecret: string;
  private bearerToken?: string;
  private baseUrl = 'https://api.twitter.com/2';

  constructor() {
    this.apiKey = process.env.TWITTER_API_KEY || '';
    this.apiSecret = process.env.TWITTER_API_SECRET || '';
    this.bearerToken = process.env.TWITTER_BEARER_TOKEN;
    
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('Twitter credentials not configured');
    }
  }

  /**
   * Get OAuth 2.0 access token
   */
  async getAccessToken(code: string, redirectUri: string): Promise<string> {
    try {
      const credentials = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64');
      
      const response = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          code_verifier: 'challenge', // In production, use proper PKCE
        }),
      });

      if (!response.ok) {
        throw new TwitterApiError('Failed to get access token', response.status);
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      throw new TwitterApiError('Error getting access token', 500, error);
    }
  }

  /**
   * Get user profile information
   */
  async getUserProfile(accessToken: string): Promise<TwitterUser> {
    try {
      const response = await fetch(
        `${this.baseUrl}/users/me?user.fields=id,username,name,profile_image_url,email`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new TwitterApiError('Failed to get user profile', response.status);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      throw new TwitterApiError('Error getting user profile', 500, error);
    }
  }

  /**
   * Post a tweet
   */
  async postTweet(
    accessToken: string,
    text: string,
    mediaIds?: string[]
  ): Promise<TwitterTweet> {
    try {
      const tweetData: any = {
        text,
      };

      if (mediaIds && mediaIds.length > 0) {
        tweetData.media = {
          media_ids: mediaIds,
        };
      }

      const response = await fetch(`${this.baseUrl}/tweets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tweetData),
      });

      if (!response.ok) {
        throw new TwitterApiError('Failed to post tweet', response.status);
      }

      const result = await response.json();
      return {
        id: result.data.id,
        text: result.data.text,
        created_at: result.data.created_at,
        author_id: result.data.author_id,
      };
    } catch (error) {
      throw new TwitterApiError('Error posting tweet', 500, error);
    }
  }

  /**
   * Upload media to Twitter
   */
  async uploadMedia(
    accessToken: string,
    mediaBuffer: Buffer,
    mediaType: string
  ): Promise<string> {
    try {
      const response = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          media_category: 'tweet_image',
          media_data: mediaBuffer.toString('base64'),
        }),
      });

      if (!response.ok) {
        throw new TwitterApiError('Failed to upload media', response.status);
      }

      const data = await response.json();
      return data.media_id_string;
    } catch (error) {
      throw new TwitterApiError('Error uploading media', 500, error);
    }
  }

  /**
   * Get user's tweets
   */
  async getUserTweets(
    accessToken: string,
    userId: string,
    maxResults: number = 10
  ): Promise<TwitterTweet[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/users/${userId}/tweets?max_results=${maxResults}&tweet.fields=created_at,public_metrics`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new TwitterApiError('Failed to get user tweets', response.status);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      throw new TwitterApiError('Error getting user tweets', 500, error);
    }
  }

  /**
   * Get tweet analytics
   */
  async getTweetAnalytics(
    accessToken: string,
    tweetId: string
  ): Promise<SocialInsights> {
    try {
      const response = await fetch(
        `${this.baseUrl}/tweets/${tweetId}?tweet.fields=public_metrics`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new TwitterApiError('Failed to get tweet analytics', response.status);
      }

      const data = await response.json();
      const metrics = data.data.public_metrics;

      return {
        platform: 'twitter',
        metric: 'engagement',
        value: metrics.like_count + metrics.retweet_count + metrics.reply_count,
        date: new Date().toISOString(),
      };
    } catch (error) {
      throw new TwitterApiError('Error getting tweet analytics', 500, error);
    }
  }

  /**
   * Create a thread of tweets
   */
  async createThread(
    accessToken: string,
    tweets: string[]
  ): Promise<TwitterTweet[]> {
    try {
      const thread: TwitterTweet[] = [];
      let previousTweetId: string | undefined;

      for (const tweetText of tweets) {
        const tweetData: any = {
          text: tweetText,
        };

        if (previousTweetId) {
          tweetData.reply = {
            in_reply_to_tweet_id: previousTweetId,
          };
        }

        const response = await fetch(`${this.baseUrl}/tweets`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tweetData),
        });

        if (!response.ok) {
          throw new TwitterApiError('Failed to create thread', response.status);
        }

        const result = await response.json();
        const tweet: TwitterTweet = {
          id: result.data.id,
          text: result.data.text,
          created_at: result.data.created_at,
          author_id: result.data.author_id,
        };

        thread.push(tweet);
        previousTweetId = result.data.id;
      }

      return thread;
    } catch (error) {
      throw new TwitterApiError('Error creating thread', 500, error);
    }
  }

  /**
   * Schedule a tweet (using Twitter's scheduled tweets feature)
   */
  async scheduleTweet(
    accessToken: string,
    text: string,
    scheduledTime: Date,
    mediaIds?: string[]
  ): Promise<TwitterTweet> {
    try {
      const tweetData: any = {
        text,
        scheduled_at: scheduledTime.toISOString(),
      };

      if (mediaIds && mediaIds.length > 0) {
        tweetData.media = {
          media_ids: mediaIds,
        };
      }

      const response = await fetch(`${this.baseUrl}/tweets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tweetData),
      });

      if (!response.ok) {
        throw new TwitterApiError('Failed to schedule tweet', response.status);
      }

      const result = await response.json();
      return {
        id: result.data.id,
        text: result.data.text,
        created_at: result.data.created_at,
        author_id: result.data.author_id,
      };
    } catch (error) {
      throw new TwitterApiError('Error scheduling tweet', 500, error);
    }
  }

  /**
   * Get user's followers count
   */
  async getFollowersCount(accessToken: string, userId: string): Promise<number> {
    try {
      const response = await fetch(
        `${this.baseUrl}/users/${userId}?user.fields=public_metrics`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new TwitterApiError('Failed to get followers count', response.status);
      }

      const data = await response.json();
      return data.data.public_metrics.followers_count;
    } catch (error) {
      throw new TwitterApiError('Error getting followers count', 500, error);
    }
  }

  /**
   * Search tweets
   */
  async searchTweets(
    accessToken: string,
    query: string,
    maxResults: number = 10
  ): Promise<TwitterTweet[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=${maxResults}&tweet.fields=created_at,public_metrics`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new TwitterApiError('Failed to search tweets', response.status);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      throw new TwitterApiError('Error searching tweets', 500, error);
    }
  }

  /**
   * Get rate limit information
   */
  async getRateLimitInfo(accessToken: string): Promise<any> {
    try {
      const response = await fetch('https://api.twitter.com/1.1/application/rate_limit_status.json', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new TwitterApiError('Failed to get rate limit info', response.status);
      }

      return await response.json();
    } catch (error) {
      throw new TwitterApiError('Error getting rate limit info', 500, error);
    }
  }
}

export const twitterIntegration = new TwitterIntegration();
