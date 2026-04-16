import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, treinoId, exerciciosConcluidos, totalExercicios, nota, feedback } = body;

    if (!userId || !treinoId) {
      return NextResponse.json({ error: 'Dados de sessão incompletos.' }, { status: 400 });
    }

    // 1. Localiza a execução mais recente não concluída deste treino para o usuário
    let execucao = await prisma.treino_execucoes.findFirst({
      where: {
        user_id: userId,
        treino_id: treinoId,
        concluido: false
      },
      orderBy: { created_at: 'desc' }
    });

    // 2. Se não houver execução aberta, criamos uma instantânea (fallback premium)
    if (!execucao) {
      execucao = await prisma.treino_execucoes.create({
        data: {
          user_id: userId,
          treino_id: treinoId,
          iniciado_em: new Date(),
          total_exercicios: totalExercicios || 0
        }
      });
    }

    // 3. Cálculos de gamificação.
    const baseXP = 100;
    const bonusNota = (nota || 0) * 10; // Bonus por intensidade
    const bonusPerfeicao = exerciciosConcluidos === totalExercicios ? 50 : 0;
    const totalXP = baseXP + bonusNota + bonusPerfeicao;

    // 4. Update de Execução (Prisma Atomic Transaction)
    const result = await prisma.$transaction(async (tx) => {
      // Finaliza a execução de treino
      const updatedExec = await tx.treino_execucoes.update({
        where: { id: execucao.id },
        data: {
          concluido: true,
          concluido_em: new Date(),
          exercicios_concluidos: exerciciosConcluidos || totalExercicios,
          feedback_nota: nota,
          feedback_obs: feedback,
          xp_ganho: totalXP
        }
      });

      // Evolui o Usuário (XP e Streak)
      const user = await tx.ativora_users.update({
        where: { id: userId },
        data: {
          xp: { increment: totalXP },
          current_streak: { increment: 1 } // Lógica simplificada, futuramente checar intervalo de datas
        }
      });

      return { updatedExec, user };
    });

    return NextResponse.json({
      success: true,
      message: 'Treino finalizado. Progresso salvo.',
      data: {
        xpGained: totalXP,
        newStreak: result.user.current_streak,
        newTotalXP: result.user.xp
      }
    });

  } catch (error) {
    console.error(' [TREINOS_CONCLUIR_ERROR]:', error);
    return NextResponse.json({ error: 'Falha ao processar evolução do atleta.' }, { status: 500 });
  }
}
