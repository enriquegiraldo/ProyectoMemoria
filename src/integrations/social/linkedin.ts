import { LinkedInApiError, LinkedInConfig, SocialUser, SocialPost, SocialPage, SocialInsights } from './types';

export interface LinkedInUser {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  profilePicture?: string;
  headline?: string;
}

export interface LinkedInPost {
  id: string;
  author: string;
  commentary: string;
  created_time: string;
  permalink_url: string;
  visibility: 'PUBLIC' | 'CONNECTIONS';
}

export interface LinkedInCompany {
  id: string;
  name: string;
  access_token: string;
  industry?: string;
  follower_count?: number;
}

export interface LinkedInShare {
  owner: string;
  subject: string;
  text: {
    text: string;
  };
  distribution: {
    linkedInDistributionTarget: {
      visibleToGuest: boolean;
    };
  };
  content?: {
    contentEntities?: Array<{
      entityLocation: string;
      thumbnails?: Array<{
        resolvedUrl: string;
      }>;
    }>;
  };
}

export class LinkedInIntegration {
  private clientId: string;
  private clientSecret: string;
  private baseUrl = 'https://api.linkedin.com/v2';

  constructor() {
    this.clientId = process.env.LINKEDIN_CLIENT_ID || '';
    this.clientSecret = process.env.LINKEDIN_CLIENT_SECRET || '';
    
    if (!this.clientId || !this.clientSecret) {
      throw new Error('LinkedIn credentials not configured');
    }
  }

  /**
   * Get OAuth 2.0 access token
   */
  async getAccessToken(code: string, redirectUri: string): Promise<string> {
    try {
      const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
      });

      if (!response.ok) {
        throw new LinkedInApiError('Failed to get access token', response.status);
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      throw new LinkedInApiError('Error getting access token', 500, error);
    }
  }

  /**
   * Get user profile information
   */
  async getUserProfile(accessToken: string): Promise<LinkedInUser> {
    try {
      const response = await fetch(
        `${this.baseUrl}/me?projection=(id,firstName,lastName,profilePicture(displayImage~:playableStreams),headline)`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      );

      if (!response.ok) {
        throw new LinkedInApiError('Failed to get user profile', response.status);
      }

      const data = await response.json();
      return {
        id: data.id,
        firstName: data.firstName.localized.en_US,
        lastName: data.lastName.localized.en_US,
        headline: data.headline?.localized?.en_US,
        profilePicture: data.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier,
      };
    } catch (error) {
      throw new LinkedInApiError('Error getting user profile', 500, error);
    }
  }

  /**
   * Get user's email address
   */
  async getUserEmail(accessToken: string): Promise<string> {
    try {
      const response = await fetch(
        `${this.baseUrl}/emailAddress?q=members&projection=(elements*(handle~))`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      );

      if (!response.ok) {
        throw new LinkedInApiError('Failed to get user email', response.status);
      }

      const data = await response.json();
      return data.elements[0]['handle~'].emailAddress;
    } catch (error) {
      throw new LinkedInApiError('Error getting user email', 500, error);
    }
  }

  /**
   * Share a post on LinkedIn
   */
  async sharePost(
    accessToken: string,
    text: string,
    visibility: 'PUBLIC' | 'CONNECTIONS' = 'PUBLIC',
    imageUrl?: string
  ): Promise<LinkedInPost> {
    try {
      const shareData: LinkedInShare = {
        owner: `urn:li:person:${await this.getUserId(accessToken)}`,
        subject: 'Memoria Eterna',
        text: {
          text,
        },
        distribution: {
          linkedInDistributionTarget: {
            visibleToGuest: visibility === 'PUBLIC',
          },
        },
      };

      if (imageUrl) {
        shareData.content = {
          contentEntities: [
            {
              entityLocation: imageUrl,
              thumbnails: [
                {
                  resolvedUrl: imageUrl,
                },
              ],
            },
          ],
        };
      }

      const response = await fetch(`${this.baseUrl}/ugcPosts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify(shareData),
      });

      if (!response.ok) {
        throw new LinkedInApiError('Failed to share post', response.status);
      }

      const result = await response.json();
      return {
        id: result.id,
        author: shareData.owner,
        commentary: text,
        created_time: new Date().toISOString(),
        permalink_url: `https://www.linkedin.com/feed/update/${result.id}/`,
        visibility,
      };
    } catch (error) {
      throw new LinkedInApiError('Error sharing post', 500, error);
    }
  }

  /**
   * Share to a company page
   */
  async shareToCompany(
    accessToken: string,
    companyId: string,
    text: string,
    imageUrl?: string
  ): Promise<LinkedInPost> {
    try {
      const shareData: LinkedInShare = {
        owner: `urn:li:organization:${companyId}`,
        subject: 'Memoria Eterna',
        text: {
          text,
        },
        distribution: {
          linkedInDistributionTarget: {
            visibleToGuest: true,
          },
        },
      };

      if (imageUrl) {
        shareData.content = {
          contentEntities: [
            {
              entityLocation: imageUrl,
              thumbnails: [
                {
                  resolvedUrl: imageUrl,
                },
              ],
            },
          ],
        };
      }

      const response = await fetch(`${this.baseUrl}/ugcPosts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify(shareData),
      });

      if (!response.ok) {
        throw new LinkedInApiError('Failed to share to company', response.status);
      }

      const result = await response.json();
      return {
        id: result.id,
        author: shareData.owner,
        commentary: text,
        created_time: new Date().toISOString(),
        permalink_url: `https://www.linkedin.com/feed/update/${result.id}/`,
        visibility: 'PUBLIC',
      };
    } catch (error) {
      throw new LinkedInApiError('Error sharing to company', 500, error);
    }
  }

  /**
   * Get user's companies
   */
  async getUserCompanies(accessToken: string): Promise<LinkedInCompany[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/organizationalEntityAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organizationalTarget~(id,name,industry,logoV2)))`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      );

      if (!response.ok) {
        throw new LinkedInApiError('Failed to get user companies', response.status);
      }

      const data = await response.json();
      return data.elements.map((element: any) => ({
        id: element['organizationalTarget~'].id,
        name: element['organizationalTarget~'].name,
        industry: element['organizationalTarget~'].industry,
        access_token: accessToken, // Note: This would need to be a page access token
      }));
    } catch (error) {
      throw new LinkedInApiError('Error getting user companies', 500, error);
    }
  }

  /**
   * Get company analytics
   */
  async getCompanyAnalytics(
    accessToken: string,
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<SocialInsights> {
    try {
      const response = await fetch(
        `${this.baseUrl}/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:${companyId}&timeIntervals.timeGranularityType=DAY&timeIntervals.timeRange.start=${startDate.getTime()}&timeIntervals.timeRange.end=${endDate.getTime()}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      );

      if (!response.ok) {
        throw new LinkedInApiError('Failed to get company analytics', response.status);
      }

      const data = await response.json();
      const totalShares = data.elements.reduce((sum: number, element: any) => sum + element.totalShareStatistics.shareCount, 0);

      return {
        platform: 'linkedin',
        metric: 'shares',
        value: totalShares,
        date: new Date().toISOString(),
      };
    } catch (error) {
      throw new LinkedInApiError('Error getting company analytics', 500, error);
    }
  }

  /**
   * Get user's network statistics
   */
  async getNetworkStats(accessToken: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/networkSizes/~?edgeType=FirstDegreeConnection`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      );

      if (!response.ok) {
        throw new LinkedInApiError('Failed to get network stats', response.status);
      }

      return await response.json();
    } catch (error) {
      throw new LinkedInApiError('Error getting network stats', 500, error);
    }
  }

  /**
   * Search for people
   */
  async searchPeople(
    accessToken: string,
    query: string,
    start: number = 0,
    count: number = 10
  ): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/people/search?q=people&keywords=${encodeURIComponent(query)}&start=${start}&count=${count}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      );

      if (!response.ok) {
        throw new LinkedInApiError('Failed to search people', response.status);
      }

      const data = await response.json();
      return data.elements || [];
    } catch (error) {
      throw new LinkedInApiError('Error searching people', 500, error);
    }
  }

  /**
   * Get user's posts
   */
  async getUserPosts(
    accessToken: string,
    userId: string,
    start: number = 0,
    count: number = 10
  ): Promise<LinkedInPost[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/ugcPosts?authors=List(${userId})&start=${start}&count=${count}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      );

      if (!response.ok) {
        throw new LinkedInApiError('Failed to get user posts', response.status);
      }

      const data = await response.json();
      return data.elements.map((element: any) => ({
        id: element.id,
        author: element.author,
        commentary: element.specificContent['com.linkedin.ugc.ShareContent'].text,
        created_time: element.created.time,
        permalink_url: `https://www.linkedin.com/feed/update/${element.id}/`,
        visibility: element.distribution.linkedInDistributionTarget.visibleToGuest ? 'PUBLIC' : 'CONNECTIONS',
      }));
    } catch (error) {
      throw new LinkedInApiError('Error getting user posts', 500, error);
    }
  }

  /**
   * Get user ID from access token
   */
  private async getUserId(accessToken: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      });

      if (!response.ok) {
        throw new LinkedInApiError('Failed to get user ID', response.status);
      }

      const data = await response.json();
      return data.id;
    } catch (error) {
      throw new LinkedInApiError('Error getting user ID', 500, error);
    }
  }

  /**
   * Schedule a post (LinkedIn doesn't have native scheduling, so this would need to be handled externally)
   */
  async schedulePost(
    accessToken: string,
    text: string,
    scheduledTime: Date,
    visibility: 'PUBLIC' | 'CONNECTIONS' = 'PUBLIC'
  ): Promise<LinkedInPost> {
    // LinkedIn doesn't support native scheduling, so we'll just create the post immediately
    // In a real implementation, you'd store this in a queue and post it at the scheduled time
    return this.sharePost(accessToken, text, visibility);
  }
}

export const linkedInIntegration = new LinkedInIntegration();
