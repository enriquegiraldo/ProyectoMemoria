import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '../../../lib/supabase';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Obtener API keys del usuario
    const { data: apiKeys, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching API keys:', error);
      return NextResponse.json(
        { error: 'Failed to fetch API keys' },
        { status: 500 }
      );
    }

    // Formatear respuesta (sin mostrar el hash completo por seguridad)
    const formattedApiKeys = apiKeys?.map(key => ({
      id: key.id,
      name: key.name,
      keyPreview: `${key.key_hash.substring(0, 8)}...${key.key_hash.substring(key.key_hash.length - 4)}`,
      permissions: key.permissions,
      rateLimit: key.rate_limit,
      isActive: key.is_active,
      lastUsed: key.last_used,
      expiresAt: key.expires_at,
      createdAt: key.created_at
    })) || [];

    return NextResponse.json({
      data: formattedApiKeys
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, permissions, rateLimit, expiresAt } = body;

    // Validaciones
    if (!name || !permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'Name and permissions are required' },
        { status: 400 }
      );
    }

    // Generar API key única
    const apiKey = `mem_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    // Crear API key en la base de datos
    const { data: newApiKey, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: session.user.id,
        name,
        key_hash: keyHash,
        permissions,
        rate_limit: rateLimit || 1000,
        expires_at: expiresAt || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating API key:', error);
      return NextResponse.json(
        { error: 'Failed to create API key' },
        { status: 500 }
      );
    }

    // Retornar la API key completa solo una vez
    return NextResponse.json({
      data: {
        id: newApiKey.id,
        name: newApiKey.name,
        apiKey, // Solo se muestra una vez
        permissions: newApiKey.permissions,
        rateLimit: newApiKey.rate_limit,
        expiresAt: newApiKey.expires_at,
        createdAt: newApiKey.created_at
      },
      message: 'API key created successfully. Please save it securely as it won\'t be shown again.'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
