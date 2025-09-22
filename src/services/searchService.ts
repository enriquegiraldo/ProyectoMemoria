import { supabase } from '../lib/supabase';
import { Memory, Reaction } from '../types';

export interface SearchFilters {
  query: string;
  pageId?: string;
  authorId?: string;
  mediaType?: 'IMAGE' | 'VIDEO' | 'AUDIO';
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'relevance' | 'date' | 'title' | 'author';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  memories: Memory[];
  total: number;
  suggestions: string[];
  facets: {
    mediaTypes: { [key: string]: number };
    tags: { [key: string]: number };
    authors: { [key: string]: number };
  };
}

export interface SearchResponse {
  success: boolean;
  data?: SearchResult;
  error?: string;
}

export class SearchService {
  // Búsqueda principal
  static async searchMemories(filters: SearchFilters): Promise<SearchResponse> {
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
        `);

      // Aplicar filtros de texto
      if (filters.query) {
        query = query.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
      }

      // Aplicar filtros adicionales
      if (filters.pageId) {
        query = query.eq('page_id', filters.pageId);
      }

      if (filters.authorId) {
        query = query.eq('author_id', filters.authorId);
      }

      if (filters.mediaType) {
        query = query.eq('media_type', filters.mediaType);
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      // Aplicar ordenamiento
      const sortBy = filters.sortBy || 'relevance';
      const sortOrder = filters.sortOrder || 'desc';

      if (sortBy === 'relevance' && filters.query) {
        // Ordenar por relevancia (simulado)
        query = query.order('created_at', { ascending: sortOrder === 'asc' });
      } else {
        const orderColumn = this.getOrderColumn(sortBy);
        query = query.order(orderColumn, { ascending: sortOrder === 'asc' });
      }

      // Aplicar paginación
      const limit = filters.limit || 20;
      const offset = filters.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      // Generar sugerencias
      const suggestions = await this.generateSuggestions(filters.query || '');

      // Generar facetas
      const facets = await this.generateFacets(filters);

      // Transformar datos
      const memories = (data || []).map(memory => ({
        ...memory,
        commentsCount: memory.comments?.length || 0,
        reactionsCount: memory.reactions?.length || 0,
        likesCount: memory.reactions?.filter((r:Reaction) => r.type === 'LIKE').length || 0,
        heartsCount: memory.reactions?.filter((r:Reaction) => r.type === 'HEART').length || 0,
        sadCount: memory.reactions?.filter((r:Reaction) => r.type === 'SAD').length || 0,
      }));

      return {
        success: true,
        data: {
          memories,
          total: count || 0,
          suggestions,
          facets
        }
      };
    } catch (error) {
      console.error('Error searching memories:', error);
      return {
        success: false,
        error: 'Error inesperado en la búsqueda'
      };
    }
  }

  // Búsqueda semántica mejorada
  static async semanticSearch(query: string, pageId?: string): Promise<SearchResponse> {
    try {
      // En una implementación real, aquí usarías un servicio de búsqueda semántica
      // como Elasticsearch, Algolia, o un modelo de embeddings
      
      // Por ahora, simulamos búsqueda semántica con búsqueda de texto mejorada
      const expandedQuery = await this.expandQuery(query);
      
      return this.searchMemories({
        query: expandedQuery,
        pageId,
        sortBy: 'relevance',
        limit: 20
      });
    } catch (error) {
      console.error('Error in semantic search:', error);
      return {
        success: false,
        error: 'Error en búsqueda semántica'
      };
    }
  }

  // Generar sugerencias de búsqueda
  static async generateSuggestions(query: string): Promise<string[]> {
    try {
      if (!query || query.length < 2) {
        return [];
      }

      // Buscar títulos y descripciones que coincidan
      const { data, error } = await supabase
        .from('memories')
        .select('title, description, tags')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(10);

      if (error || !data) {
        return [];
      }

      const suggestions = new Set<string>();

      // Extraer palabras clave de títulos y descripciones
      data.forEach(memory => {
        const words = [
          ...memory.title.split(' '),
          ...memory.description.split(' '),
          ...(memory.tags || [])
        ].filter(word => 
          word.toLowerCase().includes(query.toLowerCase()) && 
          word.length > 2
        );

        words.forEach(word => suggestions.add(word));
      });

      return Array.from(suggestions).slice(0, 5);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      return [];
    }
  }

  // Generar facetas para filtros
  static async generateFacets(filters: SearchFilters): Promise<SearchResult['facets']> {
    try {
      let query = supabase.from('memories').select('media_type, tags, author_id');

      // Aplicar filtros base (sin el query principal)
      if (filters.pageId) {
        query = query.eq('page_id', filters.pageId);
      }

      const { data, error } = await query;

      if (error || !data) {
        return {
          mediaTypes: {},
          tags: {},
          authors: {}
        };
      }

      // Contar tipos de medios
      const mediaTypes: { [key: string]: number } = {};
      data.forEach(memory => {
        mediaTypes[memory.media_type] = (mediaTypes[memory.media_type] || 0) + 1;
      });

      // Contar tags
      const tags: { [key: string]: number } = {};
      data.forEach(memory => {
        (memory.tags || []).forEach((tag: string) => {
          tags[tag] = (tags[tag] || 0) + 1;
        });
      });

      // Contar autores
      const authors: { [key: string]: number } = {};
      data.forEach(memory => {
        authors[memory.author_id] = (authors[memory.author_id] || 0) + 1;
      });

      return { mediaTypes, tags, authors };
    } catch (error) {
      console.error('Error generating facets:', error);
      return {
        mediaTypes: {},
        tags: {},
        authors: {}
      };
    }
  }

  // Búsqueda por ubicación (futuro)
  static async searchByLocation(lat: number, lng: number, radius: number): Promise<SearchResponse> {
    try {
      // En una implementación real, aquí usarías geolocalización
      // Por ahora, retornamos búsqueda vacía
      return {
        success: true,
        data: {
          memories: [],
          total: 0,
          suggestions: [],
          facets: {
            mediaTypes: {},
            tags: {},
            authors: {}
          }
        }
      };
    } catch (error) {
      console.error('Error searching by location:', error);
      return {
        success: false,
        error: 'Error en búsqueda por ubicación'
      };
    }
  }

  // Búsqueda por fecha
  static async searchByDateRange(dateFrom: string, dateTo: string, pageId?: string): Promise<SearchResponse> {
    try {
      return this.searchMemories({
        query: '',
        pageId,
        dateFrom,
        dateTo,
        sortBy: 'date',
        sortOrder: 'desc'
      });
    } catch (error) {
      console.error('Error searching by date range:', error);
      return {
        success: false,
        error: 'Error en búsqueda por fecha'
      };
    }
  }

  // Búsqueda por autor
  static async searchByAuthor(authorId: string, pageId?: string): Promise<SearchResponse> {
    try {
      return this.searchMemories({
        query: '',
        pageId,
        authorId,
        sortBy: 'date',
        sortOrder: 'desc'
      });
    } catch (error) {
      console.error('Error searching by author:', error);
      return {
        success: false,
        error: 'Error en búsqueda por autor'
      };
    }
  }

  // Búsqueda por tags
  static async searchByTags(tags: string[], pageId?: string): Promise<SearchResponse> {
    try {
      return this.searchMemories({
        query: '',
        pageId,
        tags,
        sortBy: 'date',
        sortOrder: 'desc'
      });
    } catch (error) {
      console.error('Error searching by tags:', error);
      return {
        success: false,
        error: 'Error en búsqueda por etiquetas'
      };
    }
  }

  // Métodos auxiliares privados
  private static getOrderColumn(sortBy: string): string {
    switch (sortBy) {
      case 'date':
        return 'created_at';
      case 'title':
        return 'title';
      case 'author':
        return 'author_id';
      default:
        return 'created_at';
    }
  }

  private static async expandQuery(query: string): Promise<string> {
    // En una implementación real, aquí expandirías la consulta con sinónimos
    // y términos relacionados usando un diccionario o API de sinónimos
    return query;
  }
}
