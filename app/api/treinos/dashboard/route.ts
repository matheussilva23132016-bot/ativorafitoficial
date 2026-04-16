import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfWeek, endOfWeek } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Identificação do atleta necessária.' }, { status: 400 });
    }

    // 1. Mapeamento de Dia da Semana para o Enum do Prisma
    const diasMapping: Record<number, any> = {
      0: 'Domingo',
      1: 'Segunda',
      2: 'Terça',
      3: 'Quarta',
      4: 'Quinta',
      5: 'Sexta',
      6: 'Sábado'
    };
    const diaAtualEnum = diasMapping[new Date().getDay()];

    // 2. Busca Treino de Hoje (Priorizando individuais, depois comunidade)
    const treinoDeHoje = await prisma.treinos.findFirst({
      where: {
        status: 'published',
        dia_semana: diaAtualEnum,
        OR: [
          { aluno_id: userId }, // Treino específico para o aluno
          { alvo: 'todos' }      // Treino de comunidade
        ]
      },
      include: {
        _count: {
          select: { exercicios_treino: true }
        }
      },
      orderBy: [
        { alvo: 'desc' } // Prioriza 'individual' se houver
      ]
    });

    // 3. Verifica se já existe execução em andamento ou concluída hoje
    const execucaoHoje = await prisma.treino_execucoes.findFirst({
      where: {
        user_id: userId,
        treino_id: treinoDeHoje?.id,
        created_at: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });

    // 4. Calcula Progresso Semanal (Baseado em execuções concluídas na semana atual)
    const inicioSemana = startOfWeek(new Date(), { weekStartsOn: 1 }); // Segunda
    const fimSemana = endOfWeek(new Date(), { weekStartsOn: 1 });

    const execucoesSemana = await prisma.treino_execucoes.count({
      where: {
        user_id: userId,
        concluido: true,
        concluido_em: {
          gte: inicioSemana,
          lte: fimSemana
        }
      }
    });

    // 5. Busca notificações recentes.
    const notificacoes = await prisma.notificacoes_comunidade.findMany({
      where: { user_id: userId, lida: false },
      orderBy: { created_at: 'desc' },
      take: 5
    });

    return NextResponse.json({
      success: true,
      data: {
        hoje: treinoDeHoje ? {
          id: treinoDeHoje.id,
          titulo: treinoDeHoje.titulo,
          foco: treinoDeHoje.foco,
          totalExercicios: treinoDeHoje._count.exercicios_treino,
          status: execucaoHoje?.concluido ? 'concluido' : execucaoHoje ? 'em_andamento' : 'nao_iniciado',
          execucaoId: execucaoHoje?.id
        } : null,
        stats: {
          concluidosSemana: execucoesSemana,
          metaSemanal: 5, // Pode ser dinâmico no futuro
          porcentagem: Math.min(Math.round((execucoesSemana / 5) * 100), 100)
        },
        notificacoes: notificacoes.map(n => ({
          id: n.id,
          title: n.titulo,
          msg: n.mensagem,
          type: n.tipo,
          time: n.created_at
        }))
      }
    });

  } catch (error) {
    console.error(' [TREINOS_DASHBOARD_ERROR]:', error);
    return NextResponse.json({ error: 'Falha ao carregar dashboard de treinos.' }, { status: 500 });
  }
}
