import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { supabase } from '../../../../lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // daily, weekly, monthly, special
    const status = searchParams.get('status'); // active, completed, all

    // Construir consulta para misiones activas
    let missionsQuery = supabase
      .from('missions')
      .select('*')
      .eq('is_active', true);

    if (type) {
      missionsQuery = missionsQuery.eq('type', type);
    }

    const { data: missions, error: missionsError } = await missionsQuery;

    if (missionsError) {
      console.error('Error fetching missions:', missionsError);
      return NextResponse.json(
        { error: 'Failed to fetch missions' },
        { status: 500 }
      );
    }

    // Si se solicita solo misiones activas, obtener el progreso del usuario
    if (status !== 'completed') {
      const { data: userMissions, error: userMissionsError } = await supabase
        .from('user_missions')
        .select('*')
        .eq('user_id', session.user.id);

      if (userMissionsError) {
        console.error('Error fetching user missions:', userMissionsError);
        return NextResponse.json(
          { error: 'Failed to fetch user missions' },
          { status: 500 }
        );
      }

      // Combinar misiones con el progreso del usuario
      const missionsWithProgress = missions?.map(mission => {
        const userMission = userMissions?.find(um => um.mission_id === mission.id);
        return {
          id: mission.id,
          name: mission.name,
          description: mission.description,
          type: mission.type,
          target: mission.target,
          pointsReward: mission.points_reward,
          badgeReward: mission.badge_reward,
          isActive: mission.is_active,
          createdAt: mission.created_at,
          userProgress: userMission ? {
            progress: userMission.progress,
            completed: userMission.completed,
            completedAt: userMission.completed_at,
            startedAt: userMission.started_at
          } : null
        };
      }) || [];

      // Filtrar por estado si se especifica
      let filteredMissions = missionsWithProgress;
      if (status === 'active') {
        filteredMissions = missionsWithProgress.filter(m => 
          !m.userProgress || !m.userProgress.completed
        );
      } else if (status === 'completed') {
        filteredMissions = missionsWithProgress.filter(m => 
          m.userProgress && m.userProgress.completed
        );
      }

      return NextResponse.json({
        data: filteredMissions
      });
    }

    // Si se solicita solo misiones completadas, obtener solo las completadas
    const { data: completedMissions, error: completedError } = await supabase
      .from('user_missions')
      .select(`
        progress,
        completed,
        completed_at,
        started_at,
        mission:missions(*)
      `)
      .eq('user_id', session.user.id)
      .eq('completed', true);

    if (completedError) {
      console.error('Error fetching completed missions:', completedError);
      return NextResponse.json(
        { error: 'Failed to fetch completed missions' },
        { status: 500 }
      );
    }

    const formattedCompletedMissions = completedMissions?.map(um => ({
      id: um.mission.id,
      name: um.mission.name,
      description: um.mission.description,
      type: um.mission.type,
      target: um.mission.target,
      pointsReward: um.mission.points_reward,
      badgeReward: um.mission.badge_reward,
      isActive: um.mission.is_active,
      createdAt: um.mission.created_at,
      userProgress: {
        progress: um.progress,
        completed: um.completed,
        completedAt: um.completed_at,
        startedAt: um.started_at
      }
    })) || [];

    return NextResponse.json({
      data: formattedCompletedMissions
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
    const { missionId } = body;

    if (!missionId) {
      return NextResponse.json(
        { error: 'Mission ID is required' },
        { status: 400 }
      );
    }

    // Verificar que la misión existe y está activa
    const { data: mission, error: missionError } = await supabase
      .from('missions')
      .select('*')
      .eq('id', missionId)
      .eq('is_active', true)
      .single();

    if (missionError || !mission) {
      return NextResponse.json(
        { error: 'Mission not found or inactive' },
        { status: 404 }
      );
    }

    // Verificar si el usuario ya tiene esta misión
    const { data: existingUserMission, error: existingError } = await supabase
      .from('user_missions')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('mission_id', missionId)
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing user mission:', existingError);
      return NextResponse.json(
        { error: 'Failed to check existing mission' },
        { status: 500 }
      );
    }

    if (existingUserMission) {
      return NextResponse.json(
        { error: 'Mission already started' },
        { status: 400 }
      );
    }

    // Iniciar la misión
    const { data: newUserMission, error: startError } = await supabase
      .from('user_missions')
      .insert({
        user_id: session.user.id,
        mission_id: missionId,
        progress: 0,
        completed: false
      })
      .select()
      .single();

    if (startError) {
      console.error('Error starting mission:', startError);
      return NextResponse.json(
        { error: 'Failed to start mission' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        id: newUserMission.id,
        missionId: newUserMission.mission_id,
        progress: newUserMission.progress,
        completed: newUserMission.completed,
        startedAt: newUserMission.started_at
      },
      message: 'Mission started successfully'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
