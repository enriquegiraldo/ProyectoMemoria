import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]/route';
import { supabase } from '../../../../../lib/supabase';
import { GamificationService } from '../../../../../services/gamificationService';

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

    const { id: missionId } = params;
    const body = await request.json();
    const { progress } = body;

    if (typeof progress !== 'number' || progress < 0) {
      return NextResponse.json(
        { error: 'Progress must be a non-negative number' },
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

    // Verificar que el usuario tiene esta misión
    const { data: userMission, error: userMissionError } = await supabase
      .from('user_missions')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('mission_id', missionId)
      .single();

    if (userMissionError || !userMission) {
      return NextResponse.json(
        { error: 'Mission not started' },
        { status: 404 }
      );
    }

    if (userMission.completed) {
      return NextResponse.json(
        { error: 'Mission already completed' },
        { status: 400 }
      );
    }

    // Actualizar progreso
    const newProgress = Math.min(progress, mission.target);
    const isCompleted = newProgress >= mission.target;

    const { data: updatedUserMission, error: updateError } = await supabase
      .from('user_missions')
      .update({
        progress: newProgress,
        completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null
      })
      .eq('user_id', session.user.id)
      .eq('mission_id', missionId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating mission progress:', updateError);
      return NextResponse.json(
        { error: 'Failed to update mission progress' },
        { status: 500 }
      );
    }

    // Si la misión se completó, otorgar recompensas
    if (isCompleted && !userMission.completed) {
      try {
        // Otorgar puntos
        if (mission.points_reward > 0) {
          await GamificationService.addPoints(
            session.user.id,
            'mission_completion' as any,
            `Completed mission: ${mission.name}`
          );
        }

        // Otorgar badge si existe
        if (mission.badge_reward) {
          await GamificationService.awardBadge(session.user.id, mission.badge_reward);
        }
      } catch (rewardError) {
        console.error('Error awarding mission rewards:', rewardError);
        // No fallar la actualización por errores en las recompensas
      }
    }

    return NextResponse.json({
      data: {
        id: updatedUserMission.id,
        missionId: updatedUserMission.mission_id,
        progress: updatedUserMission.progress,
        completed: updatedUserMission.completed,
        completedAt: updatedUserMission.completed_at,
        startedAt: updatedUserMission.started_at
      },
      mission: {
        id: mission.id,
        name: mission.name,
        target: mission.target,
        pointsReward: mission.points_reward,
        badgeReward: mission.badge_reward
      },
      message: isCompleted ? 'Mission completed!' : 'Progress updated successfully'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
