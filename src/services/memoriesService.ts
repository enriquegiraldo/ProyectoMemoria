// services/memoriesService.ts
import { supabase } from '../lib/supabase';
import { Memory, Comment, Reaction, CreateMemoryData, UpdateMemoryData, CreateCommentData } from '../types';

export interface MemoriesFilter {
  pageId?: string;
  authorId?: string;
  mediaType?: 'IMAGE' | 'VIDEO' | 'AUDIO';
  tags?: string[];
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface MemoriesResponse {
  success: boolean;
  data?: Memory[] | Memory;
  error?: string;
  total?: number;
}

export interface CommentsResponse {
  success: boolean;
  data?: Comment[];
  error?: string;
}

export interface ReactionsResponse {
  success: boolean;
  data?: Reaction[];
  error?: string;
}

export class MemoriesService {
  // Obtener memorias con filtros
  static async getMemories(filter: MemoriesFilter = {}): Promise<MemoriesResponse> {
    try {
      let query = supabase
        .from('memories')
        .select(`
          *,
          author:users!memories_author_id_fkey(
            id,
            name,
            email,
            profile
          ),
          comments:comments(*),
          reactions:reactions(*)
        `)
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filter.pageId) {
        query = query.eq('page_id', filter.pageId);
      }

      if (filter.authorId) {
        query = query.eq('author_id', filter.authorId);
      }

      if (filter.mediaType) {
        query = query.eq('media_type', filter.mediaType);
      }

      if (filter.tags && filter.tags.length > 0) {
        query = query.overlaps('tags', filter.tags);
      }

      if (filter.search) {
        query = query.or(`title.ilike.%${filter.search}%,description.ilike.%${filter.search}%`);
      }

      if (filter.dateFrom) {
        query = query.gte('created_at', filter.dateFrom);
      }

      if (filter.dateTo) {
        query = query.lte('created_at', filter.dateTo);
      }

      const { data, error, count } = await query;

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      // Transformar datos para incluir conteos
      const memories = data?.map(memory => ({
        ...memory,
        commentsCount: memory.comments?.length || 0,
        reactionsCount: memory.reactions?.length || 0,
        likesCount: memory.reactions?.filter(r => r.type === 'LIKE').length || 0,
        heartsCount: memory.reactions?.filter(r => r.type === 'HEART').length || 0,
        sadCount: memory.reactions?.filter(r => r.type === 'SAD').length || 0,
      })) || [];

      return {
        success: true,
        data: memories,
        total: count || 0
      };
    } catch (error) {
      console.error('Error fetching memories:', error);
      return {
        success: false,
        error: 'Error inesperado al obtener las memorias'
      };
    }
  }

  // Obtener memoria por ID
  static async getMemoryById(id: string): Promise<MemoriesResponse> {
    try {
      const { data, error } = await supabase
        .from('memories')
        .select(`
          *,
          author:users!memories_author_id_fkey(
            id,
            name,
            email,
            profile
          ),
          comments:comments(
            *,
            author:users!comments_author_id_fkey(
              id,
              name,
              email,
              profile
            )
          ),
          reactions:reactions(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      if (!data) {
        return {
          success: false,
          error: 'Memoria no encontrada'
        };
      }

      // Transformar datos
      const memory = {
        ...data,
        commentsCount: data.comments?.length || 0,
        reactionsCount: data.reactions?.length || 0,
        likesCount: data.reactions?.filter(r => r.type === 'LIKE').length || 0,
        heartsCount: data.reactions?.filter(r => r.type === 'HEART').length || 0,
        sadCount: data.reactions?.filter(r => r.type === 'SAD').length || 0,
      };

      return {
        success: true,
        data: memory
      };
    } catch (error) {
      console.error('Error fetching memory:', error);
      return {
        success: false,
        error: 'Error inesperado al obtener la memoria'
      };
    }
  }

  // Crear nueva memoria
  static async createMemory(memoryData: CreateMemoryData): Promise<MemoriesResponse> {
    try {
      const { data, error } = await supabase
        .from('memories')
        .insert({
          title: memoryData.title,
          description: memoryData.description,
          media_url: memoryData.mediaUrl,
          media_type: memoryData.mediaType,
          author_id: memoryData.authorId,
          page_id: memoryData.pageId,
          tags: memoryData.tags || [],
        })
        .select(`
          *,
          author:users!memories_author_id_fkey(
            id,
            name,
            email,
            profile
          )
        `)
        .single();

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: {
          ...data,
          commentsCount: 0,
          reactionsCount: 0,
          likesCount: 0,
          heartsCount: 0,
          sadCount: 0,
        }
      };
    } catch (error) {
      console.error('Error creating memory:', error);
      return {
        success: false,
        error: 'Error inesperado al crear la memoria'
      };
    }
  }

  // Actualizar memoria
  static async updateMemory(id: string, updates: UpdateMemoryData): Promise<MemoriesResponse> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.mediaUrl !== undefined) updateData.media_url = updates.mediaUrl;
      if (updates.mediaType !== undefined) updateData.media_type = updates.mediaType;
      if (updates.tags !== undefined) updateData.tags = updates.tags;

      const { data, error } = await supabase
        .from('memories')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          author:users!memories_author_id_fkey(
            id,
            name,
            email,
            profile
          )
        `)
        .single();

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: {
          ...data,
          commentsCount: 0,
          reactionsCount: 0,
          likesCount: 0,
          heartsCount: 0,
          sadCount: 0,
        }
      };
    } catch (error) {
      console.error('Error updating memory:', error);
      return {
        success: false,
        error: 'Error inesperado al actualizar la memoria'
      };
    }
  }

  // Eliminar memoria
  static async deleteMemory(id: string): Promise<MemoriesResponse> {
    try {
      // Primero obtener la memoria para obtener la URL del medio
      const { data: memory, error: fetchError } = await supabase
        .from('memories')
        .select('media_url')
        .eq('id', id)
        .single();

      if (fetchError) {
        return {
          success: false,
          error: fetchError.message
        };
      }

      // Eliminar comentarios y reacciones relacionados
      await supabase.from('comments').delete().eq('memory_id', id);
      await supabase.from('reactions').delete().eq('reference_id', id);

      // Eliminar la memoria
      const { error } = await supabase
        .from('memories')
        .delete()
        .eq('id', id);

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      // TODO: Eliminar archivo de medio si es necesario
      // if (memory.media_url) {
      //   await MediaService.deleteFromCloudinary(memory.media_url);
      // }

      return {
        success: true
      };
    } catch (error) {
      console.error('Error deleting memory:', error);
      return {
        success: false,
        error: 'Error inesperado al eliminar la memoria'
      };
    }
  }

  // Obtener comentarios de una memoria
  static async getComments(memoryId: string): Promise<CommentsResponse> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          author:users!comments_author_id_fkey(
            id,
            name,
            email,
            profile
          ),
          reactions:reactions(*)
        `)
        .eq('memory_id', memoryId)
        .order('created_at', { ascending: true });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('Error fetching comments:', error);
      return {
        success: false,
        error: 'Error inesperado al obtener los comentarios'
      };
    }
  }

  // Crear comentario
  static async createComment(commentData: CreateCommentData): Promise<CommentsResponse> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          content: commentData.content,
          author_id: commentData.authorId,
          memory_id: commentData.memoryId,
          parent_comment_id: commentData.parentCommentId || null,
        })
        .select(`
          *,
          author:users!comments_author_id_fkey(
            id,
            name,
            email,
            profile
          )
        `)
        .single();

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: [data]
      };
    } catch (error) {
      console.error('Error creating comment:', error);
      return {
        success: false,
        error: 'Error inesperado al crear el comentario'
      };
    }
  }

  // Eliminar comentario
  static async deleteComment(id: string): Promise<CommentsResponse> {
    try {
      // Eliminar reacciones del comentario
      await supabase.from('reactions').delete().eq('reference_id', id);

      // Eliminar comentarios hijos
      await supabase.from('comments').delete().eq('parent_comment_id', id);

      // Eliminar el comentario
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', id);

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true
      };
    } catch (error) {
      console.error('Error deleting comment:', error);
      return {
        success: false,
        error: 'Error inesperado al eliminar el comentario'
      };
    }
  }

  // Obtener reacciones de una memoria o comentario
  static async getReactions(referenceId: string, referenceType: 'MEMORY' | 'COMMENT'): Promise<ReactionsResponse> {
    try {
      const { data, error } = await supabase
        .from('reactions')
        .select(`
          *,
          user:users!reactions_user_id_fkey(
            id,
            name,
            email,
            profile
          )
        `)
        .eq('reference_id', referenceId)
        .eq('reference_type', referenceType)
        .order('created_at', { ascending: true });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('Error fetching reactions:', error);
      return {
        success: false,
        error: 'Error inesperado al obtener las reacciones'
      };
    }
  }

  // Agregar reacción
  static async addReaction(
    type: 'LIKE' | 'HEART' | 'SAD',
    userId: string,
    referenceId: string,
    referenceType: 'MEMORY' | 'COMMENT'
  ): Promise<ReactionsResponse> {
    try {
      // Verificar si ya existe una reacción del mismo tipo
      const { data: existingReaction, error: checkError } = await supabase
        .from('reactions')
        .select('id')
        .eq('user_id', userId)
        .eq('reference_id', referenceId)
        .eq('reference_type', referenceType)
        .eq('type', type)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        return {
          success: false,
          error: checkError.message
        };
      }

      // Si ya existe, eliminarla (toggle)
      if (existingReaction) {
        const { error: deleteError } = await supabase
          .from('reactions')
          .delete()
          .eq('id', existingReaction.id);

        if (deleteError) {
          return {
            success: false,
            error: deleteError.message
          };
        }

        return {
          success: true,
          data: []
        };
      }

      // Si no existe, crearla
      const { data, error } = await supabase
        .from('reactions')
        .insert({
          type,
          user_id: userId,
          reference_id: referenceId,
          reference_type: referenceType,
        })
        .select(`
          *,
          user:users!reactions_user_id_fkey(
            id,
            name,
            email,
            profile
          )
        `)
        .single();

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: [data]
      };
    } catch (error) {
      console.error('Error adding reaction:', error);
      return {
        success: false,
        error: 'Error inesperado al agregar la reacción'
      };
    }
  }

  // Obtener estadísticas de una memoria
  static async getMemoryStats(memoryId: string): Promise<{
    commentsCount: number;
    reactionsCount: number;
    likesCount: number;
    heartsCount: number;
    sadCount: number;
  }> {
    try {
      const [commentsResult, reactionsResult] = await Promise.all([
        supabase.from('comments').select('id').eq('memory_id', memoryId),
        supabase.from('reactions').select('type').eq('reference_id', memoryId).eq('reference_type', 'MEMORY')
      ]);

      const reactions = reactionsResult.data || [];
      
      return {
        commentsCount: commentsResult.data?.length || 0,
        reactionsCount: reactions.length,
        likesCount: reactions.filter(r => r.type === 'LIKE').length,
        heartsCount: reactions.filter(r => r.type === 'HEART').length,
        sadCount: reactions.filter(r => r.type === 'SAD').length,
      };
    } catch (error) {
      console.error('Error getting memory stats:', error);
      return {
        commentsCount: 0,
        reactionsCount: 0,
        likesCount: 0,
        heartsCount: 0,
        sadCount: 0,
      };
    }
  }

  // Buscar memorias por texto
  static async searchMemories(searchTerm: string, pageId?: string): Promise<MemoriesResponse> {
    try {
      let query = supabase
        .from('memories')
        .select(`
          *,
          author:users!memories_author_id_fkey(
            id,
            name,
            email,
            profile
          )
        `)
        .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (pageId) {
        query = query.eq('page_id', pageId);
      }

      const { data, error } = await query;

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('Error searching memories:', error);
      return {
        success: false,
        error: 'Error inesperado al buscar memorias'
      };
    }
  }
}
//


