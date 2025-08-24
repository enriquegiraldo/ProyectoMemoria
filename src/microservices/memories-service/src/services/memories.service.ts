import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { logger, audit } from '../utils/logger';
import { 
  CustomError, 
  MemoryNotFoundError, 
  MemoryAccessDeniedError, 
  MemoryValidationError,
  DatabaseError
} from '../utils/errors';
import {
  Memory,
  MemoryType,
  MemoryStatus,
  MemoryVisibility,
  CreateMemoryRequest,
  UpdateMemoryRequest,
  SearchFilters,
  SearchResult,
  MediaFile,
  MemoryMetadata
} from '../types';

export class MemoriesService {
  private supabase: SupabaseClient;

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || createClient(config.supabase.url, config.supabase.serviceRoleKey);
  }

  /**
   * Create a new memory
   */
  async createMemory(userId: string, data: CreateMemoryRequest, ip: string): Promise<Memory> {
    try {
      // Validate input data
      this.validateMemoryData(data);

      const memoryId = uuidv4();
      const now = new Date().toISOString();

      // Create memory record
      const memoryData = {
        id: memoryId,
        user_id: userId,
        title: data.title,
        description: data.description || '',
        content: data.content,
        type: data.type,
        status: 'draft' as MemoryStatus,
        visibility: data.visibility,
        tags: data.tags || [],
        location: data.location ? JSON.stringify(data.location) : null,
        date: data.date?.toISOString() || null,
        metadata: JSON.stringify(this.createInitialMetadata(data)),
        created_at: now,
        updated_at: now,
      };

      const { data: memory, error } = await this.supabase
        .from('memories')
        .insert(memoryData)
        .select()
        .single();

      if (error) {
        logger.error('Failed to create memory', { error, userId, memoryId });
        throw new DatabaseError('Failed to create memory');
      }

      // Process media files if provided
      if (data.media && data.media.length > 0) {
        await this.processMemoryMedia(memoryId, userId, data.media, ip);
      }

      // Get complete memory with media
      const completeMemory = await this.getMemoryById(memoryId, userId);

      // Log audit event
      audit.memoryCreated(userId, memoryId, ip, {
        type: data.type,
        visibility: data.visibility,
        mediaCount: data.media?.length || 0,
      });

      return completeMemory!;
    } catch (error) {
      logger.error('Create memory failed', {
        userId,
        error: error instanceof Error ? error.message : error,
        ip,
      });
      throw error;
    }
  }

  /**
   * Get memory by ID
   */
  async getMemoryById(memoryId: string, userId: string, ip?: string): Promise<Memory | null> {
    try {
      const { data, error } = await this.supabase
        .from('memories')
        .select(`
          *,
          media:memory_media(*)
        `)
        .eq('id', memoryId)
        .eq('deleted_at', null)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Memory not found
        }
        throw new DatabaseError('Failed to retrieve memory');
      }

      // Check access permissions
      if (!this.canAccessMemory(data, userId)) {
        throw new MemoryAccessDeniedError(memoryId);
      }

      const memory = this.mapMemoryFromDatabase(data);

      // Log access
      if (ip) {
        audit.dataAccess(userId, 'read', `memory:${memoryId}`, ip);
      }

      return memory;
    } catch (error) {
      logger.error('Get memory by ID failed', {
        memoryId,
        userId,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Update memory
   */
  async updateMemory(memoryId: string, userId: string, data: UpdateMemoryRequest, ip: string): Promise<Memory> {
    try {
      // Get existing memory
      const existingMemory = await this.getMemoryById(memoryId, userId);
      if (!existingMemory) {
        throw new MemoryNotFoundError(memoryId);
      }

      // Check edit permissions
      if (!this.canEditMemory(existingMemory, userId)) {
        throw new MemoryAccessDeniedError(memoryId);
      }

      // Validate update data
      this.validateMemoryUpdateData(data);

      // Prepare update data
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.content !== undefined) updateData.content = data.content;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.visibility !== undefined) updateData.visibility = data.visibility;
      if (data.tags !== undefined) updateData.tags = data.tags;
      if (data.location !== undefined) updateData.location = data.location ? JSON.stringify(data.location) : null;
      if (data.date !== undefined) updateData.date = data.date?.toISOString() || null;

      // Update memory
      const { data: updatedData, error } = await this.supabase
        .from('memories')
        .update(updateData)
        .eq('id', memoryId)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update memory', { error, memoryId, userId });
        throw new DatabaseError('Failed to update memory');
      }

      const updatedMemory = this.mapMemoryFromDatabase(updatedData);

      // Log audit event
      audit.memoryModified(userId, memoryId, 'update', ip, {
        fields: Object.keys(updateData).filter(key => key !== 'updated_at'),
      });

      return updatedMemory;
    } catch (error) {
      logger.error('Update memory failed', {
        memoryId,
        userId,
        error: error instanceof Error ? error.message : error,
        ip,
      });
      throw error;
    }
  }

  /**
   * Delete memory (soft delete)
   */
  async deleteMemory(memoryId: string, userId: string, ip: string): Promise<void> {
    try {
      // Get existing memory
      const existingMemory = await this.getMemoryById(memoryId, userId);
      if (!existingMemory) {
        throw new MemoryNotFoundError(memoryId);
      }

      // Check delete permissions
      if (!this.canDeleteMemory(existingMemory, userId)) {
        throw new MemoryAccessDeniedError(memoryId);
      }

      // Soft delete
      const { error } = await this.supabase
        .from('memories')
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', memoryId);

      if (error) {
        logger.error('Failed to delete memory', { error, memoryId, userId });
        throw new DatabaseError('Failed to delete memory');
      }

      // Log audit event
      audit.memoryDeleted(userId, memoryId, ip, {
        type: existingMemory.type,
        visibility: existingMemory.visibility,
      });
    } catch (error) {
      logger.error('Delete memory failed', {
        memoryId,
        userId,
        error: error instanceof Error ? error.message : error,
        ip,
      });
      throw error;
    }
  }

  /**
   * Search memories
   */
  async searchMemories(userId: string, filters: SearchFilters, ip: string): Promise<SearchResult> {
    try {
      let query = this.supabase
        .from('memories')
        .select(`
          *,
          media:memory_media(*)
        `, { count: 'exact' })
        .eq('deleted_at', null);

      // Apply filters
      query = this.applySearchFilters(query, filters, userId);

      // Apply pagination
      const page = filters.page || 1;
      const limit = Math.min(filters.limit || 10, 100); // Max 100 per page
      const offset = (page - 1) * limit;

      query = query.range(offset, offset + limit - 1);

      // Apply sorting
      if (filters.sortBy && filters.sortOrder) {
        query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error, count } = await query;

      if (error) {
        logger.error('Search memories failed', { error, userId, filters });
        throw new DatabaseError('Failed to search memories');
      }

      const memories = data?.map(memory => this.mapMemoryFromDatabase(memory)) || [];
      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        memories,
        total,
        page,
        limit,
        totalPages,
        facets: {
          types: [],
          tags: [],
          years: [],
          locations: [],
        },
      };
    } catch (error) {
      logger.error('Search memories failed', {
        userId,
        error: error instanceof Error ? error.message : error,
        ip,
      });
      throw error;
    }
  }

  // Private helper methods

  private validateMemoryData(data: CreateMemoryRequest): void {
    if (!data.title || data.title.trim().length === 0) {
      throw new MemoryValidationError('Title is required');
    }

    if (!data.content || data.content.trim().length === 0) {
      throw new MemoryValidationError('Content is required');
    }

    if (!data.type) {
      throw new MemoryValidationError('Memory type is required');
    }

    if (!data.visibility) {
      throw new MemoryValidationError('Visibility is required');
    }

    if (data.title.length > 200) {
      throw new MemoryValidationError('Title must be less than 200 characters');
    }

    if (data.content.length > 10000) {
      throw new MemoryValidationError('Content must be less than 10,000 characters');
    }
  }

  private validateMemoryUpdateData(data: UpdateMemoryRequest): void {
    if (data.title !== undefined && (data.title.length === 0 || data.title.length > 200)) {
      throw new MemoryValidationError('Title must be between 1 and 200 characters');
    }

    if (data.content !== undefined && data.content.length > 10000) {
      throw new MemoryValidationError('Content must be less than 10,000 characters');
    }
  }

  private createInitialMetadata(data: CreateMemoryRequest): MemoryMetadata {
    return {
      wordCount: data.content.split(/\s+/).length,
      readingTime: Math.ceil(data.content.split(/\s+/).length / 200), // 200 words per minute
      mediaCount: data.media?.length || 0,
      totalSize: 0, // Will be updated after media processing
      viewCount: 0,
      likeCount: 0,
      shareCount: 0,
      commentCount: 0,
      isFeatured: false,
      isPinned: false,
      language: 'es', // Default to Spanish
    };
  }

  private async processMemoryMedia(memoryId: string, userId: string, mediaFiles: File[], ip: string): Promise<void> {
    // Create placeholder media records
    for (const file of mediaFiles) {
      const mediaId = uuidv4();
      const mediaData = {
        id: mediaId,
        memory_id: memoryId,
        user_id: userId,
        file_name: `media_${mediaId}`,
        original_name: file.name,
        mime_type: file.type,
        size: file.size,
        url: `https://storage.example.com/${mediaId}`,
        type: this.getMediaType(file.type),
        metadata: JSON.stringify({}),
        processing_status: 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await this.supabase
        .from('memory_media')
        .insert(mediaData);

      if (error) {
        logger.error('Failed to create media record', { error, mediaId, memoryId });
      } else {
        audit.fileUploaded(userId, mediaId, file.name, file.size, ip, {
          memoryId,
          mimeType: file.type,
        });
      }
    }
  }

  private getMediaType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || mimeType.includes('document')) return 'document';
    return 'other';
  }

  private canAccessMemory(memory: any, userId: string): boolean {
    // Owner can always access
    if (memory.user_id === userId) return true;

    // Check visibility
    if (memory.visibility === 'public') return true;

    return false;
  }

  private canEditMemory(memory: Memory, userId: string): boolean {
    // Owner can always edit
    return memory.userId === userId;
  }

  private canDeleteMemory(memory: Memory, userId: string): boolean {
    // Only owner can delete
    return memory.userId === userId;
  }

  private applySearchFilters(query: any, filters: SearchFilters, userId: string): any {
    // Apply visibility filter
    if (filters.visibility) {
      query = query.in('visibility', filters.visibility);
    } else {
      // Default to user's accessible memories
      query = query.or(`user_id.eq.${userId},visibility.eq.public`);
    }

    // Apply type filter
    if (filters.type && filters.type.length > 0) {
      query = query.in('type', filters.type);
    }

    // Apply status filter
    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    }

    // Apply tags filter
    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }

    // Apply text search
    if (filters.query) {
      query = query.or(`title.ilike.%${filters.query}%,content.ilike.%${filters.query}%`);
    }

    return query;
  }

  private mapMemoryFromDatabase(data: any): Memory {
    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      description: data.description,
      content: data.content,
      type: data.type,
      status: data.status,
      visibility: data.visibility,
      tags: data.tags || [],
      location: data.location ? JSON.parse(data.location) : undefined,
      date: data.date ? new Date(data.date) : undefined,
      media: data.media?.map((m: any) => this.mapMediaFromDatabase(m)) || [],
      metadata: data.metadata ? JSON.parse(data.metadata) : {},
      permissions: [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      deletedAt: data.deleted_at ? new Date(data.deleted_at) : undefined,
    };
  }

  private mapMediaFromDatabase(data: any): MediaFile {
    return {
      id: data.id,
      memoryId: data.memory_id,
      userId: data.user_id,
      fileName: data.file_name,
      originalName: data.original_name,
      mimeType: data.mime_type,
      size: data.size,
      url: data.url,
      thumbnailUrl: data.thumbnail_url,
      type: data.type,
      metadata: data.metadata ? JSON.parse(data.metadata) : {},
      processingStatus: data.processing_status,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}
