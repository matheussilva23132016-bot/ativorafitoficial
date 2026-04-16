import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const treinoId = searchParams.get('treinoId');

    if (!treinoId) {
      return NextResponse.json({ error: 'ID do treino não fornecido.' }, { status: 400 });
    }

    const treino = await prisma.treinos.findUnique({
      where: { id: treinoId },
      include: {
        exercicios_treino: {
          orderBy: { ordem: 'asc' }
        }
      }
    });

    if (!treino) {
      return NextResponse.json({ error: 'Treino não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: treino.id,
        titulo: treino.titulo,
        foco: treino.foco,
        descricao: treino.descricao,
        obs: treino.obs,
        exercicios: treino.exercicios_treino.map(ex => ({
          id: ex.id,
          nome: ex.nome,
          series: ex.series,
          reps: ex.reps,
          descanso: ex.descanso,
          cadencia: ex.cadencia,
          rpe: ex.rpe,
          videoUrl: ex.video_url,
          observacoes: ex.obs,
          ordem: ex.ordem
        }))
      }
    });

  } catch (error) {
    console.error(' [TREINOS_DETALHES_ERROR]:', error);
    return NextResponse.json({ error: 'Erro ao carregar detalhes do treino.' }, { status: 500 });
  }
}
