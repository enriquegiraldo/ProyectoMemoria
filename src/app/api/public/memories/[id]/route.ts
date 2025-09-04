// src/app/api/public/memories/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/supabase';

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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validar API key
    const apiKeyValidation = await validateApiKey(request);
    if (!apiKeyValidation.valid) {
      return NextResponse.json(
        { error: apiKeyValidation.error },
        { status: 401 }
      );
    }

    const { id } = params;

    // Obtener la memoria con todas sus relaciones
    const { data: memory, error } = await supabase
      .from('memories')
      .select(`
        id,
        title,
        content,
        type,
        image_url,
        video_url,
        file_size,
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
          avatar_url,
          bio,
          relationship
        ),
        category:categories!memories_category_id_fkey(
          id,
          name,
          description,
          color
        ),
        tags:memory_tags(
          tag:tags(
            id,
            name
          )
        ),
        comments(
          id,
          content,
          created_at,
          author:users!comments_author_id_fkey(
            id,
            name,
            avatar_url
          )
        ),
        testimonials(
          id,
          content,
          relationship,
          is_approved,
          created_at,
          author:users!testimonials_author_id_fkey(
            id,
            name,
            avatar_url
          )
        ),
        _count:likes(count)
      `)
      .eq('id', id)
      .eq('is_public', true)
      .single();

    if (error || !memory) {
      return NextResponse.json(
        { error: 'Memory not found' },
        { status: 404 }
      );
    }

    // Formatear respuesta
    const formattedMemory = {
      id: memory.id,
      title: memory.title,
      content: memory.content,
      type: memory.type,
      media: {
        image: memory.image_url,
        video: memory.video_url,
        fileSize: memory.file_size
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
      author: memory.author && memory.author.length > 0 ? {
        id: memory.author[0].id,
        name: memory.author[0].name,
        avatar: memory.author[0].avatar_url,
        bio: memory.author[0].bio,
        relationship: memory.author[0].relationship
      } : null,
      category: memory.category && memory.category.length > 0 ? {
        id: memory.category[0].id,
        name: memory.category[0].name,
        description: memory.category[0].description,
        color: memory.category[0].color
      } : null,
      tags: memory.tags?.map(t => t.tag) || [],
      comments: memory.comments?.map(comment => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.created_at,
        author: comment.author && comment.author.length > 0 ? {
          id: comment.author[0].id,
          name: comment.author[0].name,
          avatar: comment.author[0].avatar_url
        } : null
      })) || [],
      testimonials: memory.testimonials?.map(testimonial => ({
        id: testimonial.id,
        content: testimonial.content,
        relationship: testimonial.relationship,
        isApproved: testimonial.is_approved,
        createdAt: testimonial.created_at,
        author: testimonial.author && testimonial.author.length > 0 ? {
          id: testimonial.author[0].id,
          name: testimonial.author[0].name,
          avatar: testimonial.author[0].avatar_url
        } : null
      })) || [],
      stats: {
        likes: memory._count && memory._count.length > 0 ? memory._count[0].count : 0,
        comments: memory.comments?.length || 0,
        testimonials: memory.testimonials?.length || 0
      }
    };

    return NextResponse.json({
      data: formattedMemory
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
