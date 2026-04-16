import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, workoutId, communityId, progresso } = body;

    // 1. Validação de Segurança
    if (!userId || !workoutId || !communityId) {
      return NextResponse.json({ error: 'Dados de sessão corrompidos.' }, { status: 400 });
    }

    // 2. Gerar ID único para a Sessão (Usando Node Crypto nativo)
    const sessionId = crypto.randomUUID();

    // 3. Salvar o Histórico do Treino (workout_sessions)
    await pool.query(
      `INSERT INTO workout_sessions (id, workout_id, user_id, status, completed_at) 
       VALUES (?, ?, ?, 'completed', NOW())`,
      [sessionId, workoutId, userId]
    );

    // 4. Atualizar a Constância Semanal (Gamificação)
    // Buscamos a semana atual do usuário
    const [weekRows]: any = await pool.query(
      `SELECT id, workouts_completed, total_workouts 
       FROM weekly_progress 
       WHERE user_id = ? AND community_id = ? 
       ORDER BY week_start_date DESC LIMIT 1`,
      [userId, communityId]
    );

    if (weekRows.length > 0) {
      // Se a semana já existe, somamos +1 no treino feito
      const currentWeek = weekRows[0];
      const newCompleted = currentWeek.workouts_completed + 1;
      // Garante que a porcentagem não passe de 100%
      const newPercentage = Math.min((newCompleted / currentWeek.total_workouts) * 100, 100);

      await pool.query(
        `UPDATE weekly_progress 
         SET workouts_completed = ?, completion_percentage = ? 
         WHERE id = ?`,
        [newCompleted, newPercentage, currentWeek.id]
      );
    } else {
      // Se for o primeiro treino da semana, cria o registro do zero
      const weekId = crypto.randomUUID();
      // Pega a data da segunda-feira mais próxima (início da semana)
      const today = new Date();
      const day = today.getDay() || 7; 
      if(day !== 1) today.setHours(-24 * (day - 1)); 
      const startOfWeek = today.toISOString().split('T')[0];

      await pool.query(
        `INSERT INTO weekly_progress (id, user_id, community_id, week_start_date, workouts_completed, total_workouts, completion_percentage) 
         VALUES (?, ?, ?, ?, 1, 5, 20.00)`,
        [weekId, userId, communityId, startOfWeek]
      );
    }

    // 5. Retornar Sucesso para o Frontend
    return NextResponse.json({ 
      success: true, 
      message: 'Treino concluído com sucesso!',
      xpEarned: 50 
    }, { status: 200 });

  } catch (error) {
    console.error('Erro ao concluir treino:', error);
    return NextResponse.json({ error: 'Falha ao concluir treino.' }, { status: 500 });
  }
}
