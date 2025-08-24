import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
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

    // Obtener webhooks del usuario
    const { data: webhooks, error } = await supabase
      .from('webhooks')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching webhooks:', error);
      return NextResponse.json(
        { error: 'Failed to fetch webhooks' },
        { status: 500 }
      );
    }

    // Formatear respuesta (sin mostrar el secret completo por seguridad)
    const formattedWebhooks = webhooks?.map(webhook => ({
      id: webhook.id,
      url: webhook.url,
      events: webhook.events,
      secretPreview: `${webhook.secret.substring(0, 8)}...${webhook.secret.substring(webhook.secret.length - 4)}`,
      isActive: webhook.is_active,
      lastTriggered: webhook.last_triggered,
      createdAt: webhook.created_at
    })) || [];

    return NextResponse.json({
      data: formattedWebhooks
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
    const { url, events } = body;

    // Validaciones
    if (!url || !events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: 'URL and events are required' },
        { status: 400 }
      );
    }

    // Validar URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Generar secret único
    const secret = crypto.randomBytes(32).toString('hex');

    // Crear webhook en la base de datos
    const { data: newWebhook, error } = await supabase
      .from('webhooks')
      .insert({
        user_id: session.user.id,
        url,
        events,
        secret
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating webhook:', error);
      return NextResponse.json(
        { error: 'Failed to create webhook' },
        { status: 500 }
      );
    }

    // Retornar el webhook con el secret completo solo una vez
    return NextResponse.json({
      data: {
        id: newWebhook.id,
        url: newWebhook.url,
        events: newWebhook.events,
        secret, // Solo se muestra una vez
        isActive: newWebhook.is_active,
        createdAt: newWebhook.created_at
      },
      message: 'Webhook created successfully. Please save the secret securely as it won\'t be shown again.'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
