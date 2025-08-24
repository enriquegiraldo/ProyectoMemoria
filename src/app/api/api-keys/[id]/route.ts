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

    // Verificar que la API key pertenece al usuario
    const { data: apiKey, error: fetchError } = await supabase
      .from('api_keys')
      .select('id, name')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (fetchError || !apiKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    // Eliminar la API key
    const { error: deleteError } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (deleteError) {
      console.error('Error deleting API key:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete API key' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `API key "${apiKey.name}" deleted successfully`
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
    const { name, permissions, rateLimit, isActive, expiresAt } = body;

    // Verificar que la API key pertenece al usuario
    const { data: apiKey, error: fetchError } = await supabase
      .from('api_keys')
      .select('id, name')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (fetchError || !apiKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    // Preparar datos de actualización
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (permissions !== undefined) updateData.permissions = permissions;
    if (rateLimit !== undefined) updateData.rate_limit = rateLimit;
    if (isActive !== undefined) updateData.is_active = isActive;
    if (expiresAt !== undefined) updateData.expires_at = expiresAt;

    // Actualizar la API key
    const { data: updatedApiKey, error: updateError } = await supabase
      .from('api_keys')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating API key:', updateError);
      return NextResponse.json(
        { error: 'Failed to update API key' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        id: updatedApiKey.id,
        name: updatedApiKey.name,
        keyPreview: `${updatedApiKey.key_hash.substring(0, 8)}...${updatedApiKey.key_hash.substring(updatedApiKey.key_hash.length - 4)}`,
        permissions: updatedApiKey.permissions,
        rateLimit: updatedApiKey.rate_limit,
        isActive: updatedApiKey.is_active,
        lastUsed: updatedApiKey.last_used,
        expiresAt: updatedApiKey.expires_at,
        createdAt: updatedApiKey.created_at
      },
      message: 'API key updated successfully'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
