import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { supabase } from '../../../../lib/supabase';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Verificar que el webhook pertenece al usuario
    const { data: webhook, error: fetchError } = await supabase
      .from('webhooks')
      .select('id, url')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (fetchError || !webhook) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    // Eliminar el webhook
    const { error: deleteError } = await supabase
      .from('webhooks')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (deleteError) {
      console.error('Error deleting webhook:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete webhook' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `Webhook "${webhook.url}" deleted successfully`
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { url, events, isActive } = body;

    // Verificar que el webhook pertenece al usuario
    const { data: webhook, error: fetchError } = await supabase
      .from('webhooks')
      .select('id, url')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (fetchError || !webhook) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    // Validar URL si se proporciona
    if (url) {
      try {
        new URL(url);
      } catch {
        return NextResponse.json(
          { error: 'Invalid URL format' },
          { status: 400 }
        );
      }
    }

    // Preparar datos de actualización
    const updateData: any = {};
    if (url !== undefined) updateData.url = url;
    if (events !== undefined) updateData.events = events;
    if (isActive !== undefined) updateData.is_active = isActive;

    // Actualizar el webhook
    const { data: updatedWebhook, error: updateError } = await supabase
      .from('webhooks')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating webhook:', updateError);
      return NextResponse.json(
        { error: 'Failed to update webhook' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        id: updatedWebhook.id,
        url: updatedWebhook.url,
        events: updatedWebhook.events,
        secretPreview: `${updatedWebhook.secret.substring(0, 8)}...${updatedWebhook.secret.substring(updatedWebhook.secret.length - 4)}`,
        isActive: updatedWebhook.is_active,
        lastTriggered: updatedWebhook.last_triggered,
        createdAt: updatedWebhook.created_at
      },
      message: 'Webhook updated successfully'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
