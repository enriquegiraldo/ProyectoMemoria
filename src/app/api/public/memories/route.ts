import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

// Middleware para validar API key
async function validateApiKey(request: NextRequest): Promise<{ valid: boolean; userId?: string; error?: string }> {
  const apiKey = request.headers.get('x-api-key');
  
  if (!apiKey) {
    return { valid: false, error: 'API key is required' };
  }

  try {
    const { data: apiKeyData, error } = await supabase
      .from('api_keys')
      .select('user_id, permissions, rate_limit, is_active, expires_at')
      .eq('key_hash', apiKey)
      .single();

    if (error || !apiKeyData) {
      return { valid: false, error: 'Invalid API key' };
    }

    if (!apiKeyData.is_active) {
      return { valid: false, error: 'API key is inactive' };
    }

    if (apiKeyData.expires_at && new Date(apiKeyData.expires_at) < new Date()) {
      return { valid: false, error: 'API key has expired' };
    }

    // Verificar permisos
    const permissions = apiKeyData.permissions as string[];
    if (!permissions.includes('memories:read')) {
      return { valid: false, error: 'Insufficient permissions' };
    }

    return { valid: true, userId: apiKeyData.user_id };
  } catch (error) {
    return { valid: false, error: 'Error validating API key' };
  }
}

export async function GET(request: NextRequest) {
  try {
    // Validar API key
    const apiKeyValidation = await validateApiKey(request);
    if (!apiKeyValidation.valid) {
      return NextResponse.json(
        { error: apiKeyValidation.error },
        { status: 401 }
      );
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = (page - 1) * limit;
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const isPublic = searchParams.get('public') !== 'false';

    // Construir consulta
    let query = supabase
      .from('memories')
      .select(`
        id,
        title,
        content,
        type,
        image_url,
        video_url,
        is_public,
        is_featured,
        published_at,
        event_date,
        location,
        created_at,
        updated_at,
        author:users!memories_author_id_fkey(
          id,
          name,
          avatar_url
        ),
        category:categories!memories_category_id_fkey(
          id,
          name,
          color
        ),
        tags:memory_tags(
          tag:tags(
            id,
            name
          )
        ),
        _count:comments(count),
        _count:likes(count)
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Aplicar filtros
    if (type) {
      query = query.eq('type', type);
    }

    if (category) {
      query = query.eq('category_id', category);
    }

    // Ejecutar consulta
    const { data: memories, error, count } = await query;

    if (error) {
      console.error('Error fetching memories:', error);
      return NextResponse.json(
        { error: 'Failed to fetch memories' },
        { status: 500 }
      );
    }

    // Formatear respuesta
    const formattedMemories = memories?.map(memory => ({
      id: memory.id,
      title: memory.title,
      content: memory.content,
      type: memory.type,
      media: {
        image: memory.image_url,
        video: memory.video_url
      },
      metadata: {
        isPublic: memory.is_public,
        isFeatured: memory.is_featured,
        publishedAt: memory.published_at,
        eventDate: memory.event_date,
        location: memory.location,
        createdAt: memory.created_at,
        updatedAt: memory.updated_at
      },
      author: memory.author ? {
        id: memory.author.id,
        name: memory.author.name,
        avatar: memory.author.avatar_url
      } : null,
      category: memory.category ? {
        id: memory.category.id,
        name: memory.category.name,
        color: memory.category.color
      } : null,
      tags: memory.tags?.map(t => t.tag) || [],
      stats: {
        comments: memory._count?.comments || 0,
        likes: memory._count?.likes || 0
      }
    })) || [];

    return NextResponse.json({
      data: formattedMemories,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
