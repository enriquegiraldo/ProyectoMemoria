// Export all social media integrations
export { facebookIntegration, FacebookIntegration } from './facebook';
export { twitterIntegration, TwitterIntegration } from './twitter';
export { linkedInIntegration, LinkedInIntegration } from './linkedin';
export { instagramIntegration, InstagramIntegration } from './instagram';

// Export types
export * from './types';

// Unified social media manager
import { 
  SocialUser, 
  SocialPost, 
  SocialPage, 
  SocialInsights, 
  CreatePostData, 
  PostResult, 
  ShareMemoryData, 
  ShareMemoryResult,
  IntegrationStatus,
  SocialApiError
} from './types';
import { facebookIntegration } from './facebook';
import { twitterIntegration } from './twitter';
import { linkedInIntegration } from './linkedin';
import { instagramIntegration } from './instagram';

export class SocialMediaManager {
  private integrations: Map<string, any> = new Map();

  constructor() {
    this.integrations.set('facebook', facebookIntegration);
    this.integrations.set('twitter', twitterIntegration);
    this.integrations.set('linkedin', linkedInIntegration);
    this.integrations.set('instagram', instagramIntegration);
  }

  /**
   * Get integration status for all platforms
   */
  async getIntegrationStatus(userId: string): Promise<IntegrationStatus[]> {
    const statuses: IntegrationStatus[] = [];
    
    for (const [platform, integration] of this.integrations) {
      try {
        // This would typically check against a database to see if user has connected accounts
        const connected = false; // Placeholder - would check user's connected accounts
        statuses.push({
          platform: platform as any,
          connected,
          lastSync: connected ? new Date().toISOString() : undefined,
        });
      } catch (error) {
        statuses.push({
          platform: platform as any,
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return statuses;
  }

  /**
   * Share a memory across multiple platforms
   */
  async shareMemory(data: ShareMemoryData): Promise<ShareMemoryResult> {
    const shares: ShareMemoryResult['shares'] = [];

    for (const platform of data.platforms) {
      try {
        const integration = this.integrations.get(platform);
        if (!integration) {
          shares.push({
            platform,
            success: false,
            error: `Integration not available for ${platform}`,
          });
          continue;
        }

        // This would typically get the user's access token from the database
        const accessToken = ''; // Placeholder - would get from user's connected accounts

        if (!accessToken) {
          shares.push({
            platform,
            success: false,
            error: `No access token found for ${platform}`,
          });
          continue;
        }

        // Create platform-specific post data
        const postData = this.createPlatformPostData(platform, data);

        // Post to platform
        const result = await this.postToPlatform(platform, integration, accessToken, postData);

        shares.push({
          platform,
          success: result.success,
          postId: result.post?.id,
          url: result.post?.permalink_url,
          error: result.error,
        });
      } catch (error) {
        shares.push({
          platform,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      memoryId: data.memoryId,
      shares,
    };
  }

  /**
   * Create platform-specific post data
   */
  private createPlatformPostData(platform: string, data: ShareMemoryData): CreatePostData {
    const baseMessage = data.customMessage || `Compartiendo un recuerdo especial en Memoria Eterna`;
    
    switch (platform) {
      case 'facebook':
        return {
          message: `${baseMessage}\n\n#MemoriaEterna #Recuerdos`,
          link: `${process.env.NEXT_PUBLIC_APP_URL}/memories/${data.memoryId}`,
          imageUrls: data.includeMedia ? [] : undefined, // Would get actual image URLs
          platform: 'facebook',
        };
      
      case 'twitter':
        return {
          message: `${baseMessage}\n\n#MemoriaEterna #Recuerdos`,
          link: `${process.env.NEXT_PUBLIC_APP_URL}/memories/${data.memoryId}`,
          imageUrls: data.includeMedia ? [] : undefined,
          platform: 'twitter',
        };
      
      case 'linkedin':
        return {
          message: `${baseMessage}\n\nCompartiendo un momento significativo en Memoria Eterna.`,
          link: `${process.env.NEXT_PUBLIC_APP_URL}/memories/${data.memoryId}`,
          imageUrls: data.includeMedia ? [] : undefined,
          platform: 'linkedin',
        };
      
      case 'instagram':
        return {
          message: `${baseMessage}\n\n#MemoriaEterna #Recuerdos #Memories`,
          imageUrls: data.includeMedia ? [] : undefined,
          platform: 'instagram',
        };
      
      default:
        return {
          message: baseMessage,
          platform: 'facebook',
        };
    }
  }

  /**
   * Post to a specific platform
   */
  private async postToPlatform(
    platform: string,
    integration: any,
    accessToken: string,
    postData: CreatePostData
  ): Promise<PostResult> {
    try {
      let post: SocialPost | undefined;

      switch (platform) {
        case 'facebook':
          post = await integration.postToFacebook(
            accessToken,
            postData.message,
            postData.link,
            postData.imageUrls?.[0]
          );
          break;

        case 'twitter':
          // For Twitter, we need to handle media upload separately
          let mediaIds: string[] | undefined;
          if (postData.imageUrls && postData.imageUrls.length > 0) {
            mediaIds = [];
            for (const imageUrl of postData.imageUrls) {
              // This would download the image and upload to Twitter
              // For now, we'll skip media upload
            }
          }
          
          const tweet = await integration.postTweet(accessToken, postData.message, mediaIds);
          post = {
            id: tweet.id,
            message: tweet.text,
            created_time: tweet.created_at,
            permalink_url: `https://twitter.com/user/status/${tweet.id}`,
            platform: 'twitter',
          };
          break;

        case 'linkedin':
          const linkedInPost = await integration.sharePost(
            accessToken,
            postData.message,
            'PUBLIC',
            postData.imageUrls?.[0]
          );
          post = {
            id: linkedInPost.id,
            message: linkedInPost.commentary,
            created_time: linkedInPost.created_time,
            permalink_url: linkedInPost.permalink_url,
            platform: 'linkedin',
          };
          break;

        case 'instagram':
          // Instagram Basic Display API doesn't support posting
          throw new Error('Instagram posting requires Business/Creator account');

        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }

      return {
        success: true,
        post,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get analytics for all connected platforms
   */
  async getAnalytics(userId: string, startDate: Date, endDate: Date): Promise<SocialInsights[]> {
    const insights: SocialInsights[] = [];
    
    // This would get user's connected accounts and their access tokens
    const connectedAccounts = []; // Placeholder - would get from database

    for (const account of connectedAccounts) {
      try {
        const integration = this.integrations.get(account.platform);
        if (!integration) continue;

        // Get platform-specific analytics
        const platformInsights = await this.getPlatformAnalytics(
          account.platform,
          integration,
          account.accessToken,
          startDate,
          endDate
        );

        insights.push(...platformInsights);
      } catch (error) {
        console.error(`Error getting analytics for ${account.platform}:`, error);
      }
    }

    return insights;
  }

  /**
   * Get analytics for a specific platform
   */
  private async getPlatformAnalytics(
    platform: string,
    integration: any,
    accessToken: string,
    startDate: Date,
    endDate: Date
  ): Promise<SocialInsights[]> {
    try {
      switch (platform) {
        case 'facebook':
          // This would get Facebook page insights
          return [];

        case 'twitter':
          // This would get Twitter analytics
          return [];

        case 'linkedin':
          // This would get LinkedIn analytics
          return [];

        case 'instagram':
          // This would get Instagram insights
          return [];

        default:
          return [];
      }
    } catch (error) {
      console.error(`Error getting ${platform} analytics:`, error);
      return [];
    }
  }

  /**
   * Schedule a post across multiple platforms
   */
  async schedulePost(
    userId: string,
    platforms: string[],
    message: string,
    scheduledTime: Date,
    imageUrls?: string[]
  ): Promise<PostResult[]> {
    const results: PostResult[] = [];

    for (const platform of platforms) {
      try {
        const integration = this.integrations.get(platform);
        if (!integration) {
          results.push({
            success: false,
            error: `Integration not available for ${platform}`,
          });
          continue;
        }

        // This would get the user's access token from the database
        const accessToken = ''; // Placeholder

        if (!accessToken) {
          results.push({
            success: false,
            error: `No access token found for ${platform}`,
          });
          continue;
        }

        // Schedule post based on platform
        const result = await this.schedulePlatformPost(
          platform,
          integration,
          accessToken,
          message,
          scheduledTime,
          imageUrls
        );

        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Schedule a post for a specific platform
   */
  private async schedulePlatformPost(
    platform: string,
    integration: any,
    accessToken: string,
    message: string,
    scheduledTime: Date,
    imageUrls?: string[]
  ): Promise<PostResult> {
    try {
      let post: SocialPost | undefined;

      switch (platform) {
        case 'facebook':
          post = await integration.schedulePost(
            accessToken,
            message,
            scheduledTime,
            undefined, // link
            imageUrls?.[0]
          );
          break;

        case 'twitter':
          const tweet = await integration.scheduleTweet(
            accessToken,
            message,
            scheduledTime
          );
          post = {
            id: tweet.id,
            message: tweet.text,
            created_time: tweet.created_at,
            permalink_url: `https://twitter.com/user/status/${tweet.id}`,
            platform: 'twitter',
          };
          break;

        case 'linkedin':
          const linkedInPost = await integration.schedulePost(
            accessToken,
            message,
            scheduledTime,
            'PUBLIC'
          );
          post = {
            id: linkedInPost.id,
            message: linkedInPost.commentary,
            created_time: linkedInPost.created_time,
            permalink_url: linkedInPost.permalink_url,
            platform: 'linkedin',
          };
          break;

        case 'instagram':
          throw new Error('Instagram scheduling requires Business/Creator account');

        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }

      return {
        success: true,
        post,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export the unified manager
export const socialMediaManager = new SocialMediaManager();
