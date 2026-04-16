import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: Request) {
  const connection = await pool.getConnection();
  
  try {
    const { workouts, assignedTo, communityId, createdBy } = await request.json();

    if (!workouts || !assignedTo) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    await connection.beginTransaction();

    // 1. Limpar treinos antigos desse aluno nessa comunidade (Opcional - para manter o plano atualizado)
    await connection.query(
      `DELETE FROM workouts WHERE assigned_to_user_id = ? AND community_id = ?`,
      [assignedTo, communityId]
    );

    // 2. Loop de inserção das Sessões
    for (const treino of workouts) {
      const workoutId = crypto.randomUUID();
      
      // Inserir Sessão
      await connection.query(
        `INSERT INTO workouts (id, community_id, assigned_to_user_id, title, focus, estimated_minutes, day_of_week, sessao_numero, created_by, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'published')`,
        [workoutId, communityId, assignedTo, treino.titulo, treino.foco, parseInt(treino.tempo) || 45, treino.dia, treino.sessao_numero, createdBy]
      );

      // Inserir Exercícios da Sessão
      for (let i = 0; i < treino.exercicios.length; i++) {
        const ex = treino.exercicios[i];
        await connection.query(
          `INSERT INTO workout_exercises (id, workout_id, name, sets, reps, rest_time, notes, order_index) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [crypto.randomUUID(), workoutId, ex.nome, ex.series, ex.reps, ex.descanso, ex.obs || '', i]
        );
      }
    }

    // 3. Disparar Notificação para o HUB (Aparecerá no Dashboard principal do App)
    await connection.query(
      `INSERT INTO notifications (id, user_id, community_id, title, message, type, is_read) 
       VALUES (?, ?, ?, 'Novo treino disponível!', 'Seu treinador publicou um novo treino para você.', 'treino', false)`,
      [crypto.randomUUID(), assignedTo, communityId]
    );

    await connection.commit();
    return NextResponse.json({ success: true, message: 'Ciclo publicado e atleta notificado.' });

  } catch (error) {
    await connection.rollback();
    console.error('ERRO_SAVE_PLAN:', error);
    return NextResponse.json({ error: 'Falha ao salvar plano de treino.' }, { status: 500 });
  } finally {
    connection.release();
  }
}
