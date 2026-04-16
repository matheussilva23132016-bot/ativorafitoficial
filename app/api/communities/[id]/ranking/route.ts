import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = await params;
  const paramsId = resolvedParams.id;
  const semana = req.nextUrl.searchParams.get("semana") ?? "atual";

  try {
    let inicioSemana: Date | undefined;
    
    if (semana === "atual") {
      const hoje  = new Date();
      const dia   = hoje.getDay();
      const diff  = dia === 0 ? 6 : dia - 1;
      const inicio = new Date(hoje);
      inicio.setDate(hoje.getDate() - diff);
      inicio.setHours(0, 0, 0, 0);
      inicioSemana = inicio;
    }

    const rankingRaw = await prisma.ranking_semanal.findMany({
      where: {
        comunidade_id: paramsId,
        ...(inicioSemana ? { semana_inicio: inicioSemana } : {})
      },
      include: {
        comunidades: {
          include: {
            comunidade_membros: {
              include: {
                comunidade_membro_tags: {
                  include: {
                    comunidade_tags: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: [
        { xp_total: 'desc' },
        { desafios_ok: 'desc' }
      ]
    });

    // Buscamos os nomes dos usuários manualmente pois a relação no schema está fraca (String vs Int)
    const userIds = rankingRaw.map(r => r.user_id);
    const users = await prisma.usuarios.findMany({
      where: { id: { in: userIds.map(id => parseInt(id)).filter(id => !isNaN(id)) } }
    });

    const ranking = rankingRaw.map((r, idx) => {
      const u = users.find(user => user.id.toString() === r.user_id);
      
      // Busca o membro específico para pegar as tags atuais
      const membro = r.comunidades.comunidade_membros.find(m => m.user_id === r.user_id);
      const tags = membro?.comunidade_membro_tags
        .map(mt => mt.comunidade_tags)
        .sort((a, b) => (b?.nivel_poder ?? 0) - (a?.nivel_poder ?? 0))
        .map(t => t?.nome)
        .filter(Boolean) || ["Participante"];

      return {
        ...r,
        posicao: idx + 1,
        nickname: u?.nickname || "Atleta",
        full_name: u?.nickname || "Atleta",
        avatar_url: u?.foto_url || null,
        tags: tags,
      };
    });

    return NextResponse.json({ ranking });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
