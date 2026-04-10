import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, workoutId, communityId, rating, feedback } = body;

    if (!userId || !workoutId || !communityId) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const sessionId = crypto.randomUUID();

    // 1. Salva a Sessão de Treino com o Feedback
    await pool.query(
      `INSERT INTO workout_sessions (id, workout_id, user_id, status, completed_at, feedback_rating, feedback_notes) 
       VALUES (?, ?, ?, 'completed', NOW(), ?, ?)`,
      [sessionId, workoutId, userId, rating, feedback]
    );

    // 2. Atualiza a Gamificação Semanal
    const [weekRows]: any = await pool.query(
      `SELECT id, workouts_completed, total_workouts FROM weekly_progress 
       WHERE user_id = ? AND community_id = ? ORDER BY week_start_date DESC LIMIT 1`,
      [userId, communityId]
    );

    if (weekRows.length > 0) {
      const currentWeek = weekRows[0];
      const newCompleted = currentWeek.workouts_completed + 1;
      const newPercentage = Math.min((newCompleted / currentWeek.total_workouts) * 100, 100);

      await pool.query(
        `UPDATE weekly_progress SET workouts_completed = ?, completion_percentage = ? WHERE id = ?`,
        [newCompleted, newPercentage, currentWeek.id]
      );
    } else {
      // Cria a semana caso não exista
      const today = new Date();
      const day = today.getDay() || 7; 
      if(day !== 1) today.setHours(-24 * (day - 1)); 
      const startOfWeek = today.toISOString().split('T')[0];

      await pool.query(
        `INSERT INTO weekly_progress (id, user_id, community_id, week_start_date, workouts_completed, total_workouts, completion_percentage) 
         VALUES (?, ?, ?, ?, 1, 5, 20.00)`,
        [crypto.randomUUID(), userId, communityId, startOfWeek]
      );
    }

    return NextResponse.json({ success: true, message: 'Treino forjado', xpEarned: 150 });

  } catch (error) {
    console.error('Erro ao concluir treino:', error);
    return NextResponse.json({ error: 'Falha no servidor' }, { status: 500 });
  }
}