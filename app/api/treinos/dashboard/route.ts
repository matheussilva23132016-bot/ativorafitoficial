import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const communityId = searchParams.get('communityId');

    if (!userId || !communityId) {
      return NextResponse.json({ error: 'Parâmetros ausentes.' }, { status: 400 });
    }

    // 1. Busca Progresso Semanal
    const [progressRows]: any = await pool.query(
      `SELECT workouts_completed, total_workouts, completion_percentage 
       FROM weekly_progress 
       WHERE user_id = ? AND community_id = ? 
       ORDER BY week_start_date DESC LIMIT 1`,
      [userId, communityId]
    );

    const statsSemana = progressRows.length > 0 ? {
      concluidos: progressRows[0].workouts_completed,
      total: progressRows[0].total_workouts,
      porcentagem: parseFloat(progressRows[0].completion_percentage)
    } : { concluidos: 0, total: 5, porcentagem: 0 };

    // 2. Busca o Treino de Hoje
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const diaAtual = diasSemana[new Date().getDay()];

    const [workoutRows]: any = await pool.query(
      `SELECT id, title, focus, estimated_minutes 
       FROM workouts 
       WHERE community_id = ? AND day_of_week = ? AND status = 'published'
       AND (assigned_to_user_id IS NULL OR assigned_to_user_id = ?)
       LIMIT 1`,
      [communityId, diaAtual, userId]
    );

    let treinoDeHoje = null;
    if (workoutRows.length > 0) {
      // Verifica se o aluno já fez este treino hoje
      const [sessionRows]: any = await pool.query(
        `SELECT status FROM workout_sessions 
         WHERE workout_id = ? AND user_id = ? AND DATE(created_at) = CURDATE()`,
        [workoutRows[0].id, userId]
      );

      let statusTreino = 'nao_iniciado';
      if (sessionRows.length > 0) {
        statusTreino = sessionRows[0].status; // 'in_progress' ou 'completed'
      }

      treinoDeHoje = {
        id: workoutRows[0].id,
        titulo: workoutRows[0].title,
        foco: workoutRows[0].focus,
        tempo: `${workoutRows[0].estimated_minutes} min`,
        status: statusTreino
      };
    }

    // 3. (Opcional) Busca Notificações
    const [notificacoes]: any = await pool.query(
      `SELECT id, title, message as msg, type, is_read as 'read', created_at as time 
       FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 5`,
      [userId]
    );

    return NextResponse.json({ statsSemana, treinoDeHoje, notificacoes });

  } catch (error) {
    console.error('Erro na API de Dashboard:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}