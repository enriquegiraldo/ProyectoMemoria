import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = (page - 1) * limit;
    const timeframe = searchParams.get('timeframe') || 'all'; // all, week, month

    // Construir consulta base
    let query = supabase
      .from('user_points')
      .select(`
        points,
        level,
        experience,
        total_points_earned,
        user:users!user_points_user_id_fkey(
          id,
          name,
          avatar_url
        )
      `)
      .order('points', { ascending: false })
      .order('level', { ascending: false })
      .order('experience', { ascending: false });

    // Aplicar filtro de tiempo si se especifica
    if (timeframe === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      query = query.gte('updated_at', weekAgo.toISOString());
    } else if (timeframe === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      query = query.gte('updated_at', monthAgo.toISOString());
    }

    // Aplicar paginación
    query = query.range(offset, offset + limit - 1);

    // Ejecutar consulta
    const { data: leaderboard, error, count } = await query;

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard' },
        { status: 500 }
      );
    }

    // Formatear respuesta
    const formattedLeaderboard = leaderboard?.map((entry, index) => ({
      rank: offset + index + 1,
      user: entry.user ? {
        id: entry.user.id,
        name: entry.user.name,
        avatar: entry.user.avatar_url
      } : null,
      stats: {
        points: entry.points,
        level: entry.level,
        experience: entry.experience,
        totalPointsEarned: entry.total_points_earned
      }
    })) || [];

    return NextResponse.json({
      data: formattedLeaderboard,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      timeframe
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
