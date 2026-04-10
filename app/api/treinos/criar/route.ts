import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: Request) {
  const connection = await pool.getConnection(); // Abre conexão dedicada
  
  try {
    const body = await request.json();
    const { titulo, foco, tempo, dia, publico, community_id, created_by, exercicios } = body;

    // 1. Validação Estrita
    if (!titulo || !community_id || !created_by || !exercicios || exercicios.length === 0) {
      return NextResponse.json({ error: 'Payload de dados inválido.' }, { status: 400 });
    }

    await connection.beginTransaction(); // Inicia a transação segura

    const workoutId = crypto.randomUUID();
    const assignedTo = publico === 'aluno_especifico' ? 'ALUNO_ID_AQUI' : null; 
    const targetGroup = publico !== 'aluno_especifico' ? publico : null;

    // 2. Inserção do Treino Base
    await connection.query(
      `INSERT INTO workouts (id, community_id, assigned_to_user_id, target_group, title, focus, estimated_minutes, day_of_week, created_by, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'published')`,
      [workoutId, community_id, assignedTo, targetGroup, titulo, foco, parseInt(tempo) || 45, dia, created_by]
    );

    // 3. Inserção dos Exercícios em Lote (Mais performático)
    for (let i = 0; i < exercicios.length; i++) {
      const ex = exercicios[i];
      await connection.query(
        `INSERT INTO workout_exercises (id, workout_id, name, sets, reps, rest_time, notes, media_url, order_index) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [crypto.randomUUID(), workoutId, ex.nome, ex.series, ex.reps, ex.descanso, ex.obs, ex.link, i]
      );
    }

    await connection.commit(); // Confirma e salva tudo no HD
    return NextResponse.json({ success: true, message: 'Protocolo publicado com sucesso!' }, { status: 201 });

  } catch (error) {
    await connection.rollback(); // Cancela tudo se der erro
    console.error('[API_TREINOS_CRIAR_ERROR]', error);
    return NextResponse.json({ error: 'Erro interno ao persistir dados.' }, { status: 500 });
  } finally {
    connection.release(); // Devolve a conexão pro Pool (Evita memory leak)
  }
}