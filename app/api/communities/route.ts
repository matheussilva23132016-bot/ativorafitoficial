import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/communities?userId=xxx
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId obrigatório" }, { status: 400 });

  try {
    const rawComms = await prisma.comunidades.findMany({
      where: {
        status: 'ativa',
        OR: [
          { privacidade: 'public' },
          { comunidade_membros: { some: { user_id: userId, status: 'aprovado' } } },
          { owner_id: userId }
        ]
      },
      include: {
        comunidade_membros: {
          where: { user_id: userId },
          include: {
            comunidade_membro_tags: {
              include: {
                comunidade_tags: true
              }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    const communities = rawComms.map(c => {
      const membro = c.comunidade_membros[0];
      const tags = membro?.comunidade_membro_tags
        .map(mt => mt.comunidade_tags)
        .sort((a, b) => (b?.nivel_poder ?? 0) - (a?.nivel_poder ?? 0))
        .map(t => t?.nome)
        .filter(Boolean) || ["Participante"];

      return {
        ...c,
        name:        c.nome,
        description: c.descricao,
        member_status: membro?.status || null,
        membro_id:     membro?.id || null,
        isMember:      membro?.status === "aprovado",
        userTags:      tags,
      };
    }).sort((a, b) => {
      // Ordena membros aprovados primeiro
      if (a.isMember && !b.isMember) return -1;
      if (!a.isMember && b.isMember) return 1;
      return 0;
    });

    return NextResponse.json({ communities });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/communities — Criar comunidade
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, description, cover_url, theme, focus, privacy, owner_id } = body;

    if (!name || !owner_id) {
      return NextResponse.json({ error: "name e owner_id obrigatórios" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Cria a comunidade
      const community = await tx.comunidades.create({
        data: {
          id,
          nome: name,
          descricao: description ?? "",
          cover_url: cover_url ?? "",
          tema: theme ?? "sky",
          foco: focus ?? "Todas",
          privacidade: privacy ?? "public",
          owner_id,
          status: 'ativa',
          total_membros: 1
        }
      });

      // 2. Cria tags padrão
      const tagsDefault = [
        { nome: "Participante", cor: "sky",     nivel_poder: 1 },
        { nome: "Instrutor",    cor: "emerald", nivel_poder: 2 },
        { nome: "Personal",     cor: "emerald", nivel_poder: 2 },
        { nome: "Nutri",        cor: "green",   nivel_poder: 3 },
        { nome: "Nutricionista", cor: "green",   nivel_poder: 3 },
        { nome: "ADM",          cor: "purple",  nivel_poder: 4 },
        { nome: "Dono",         cor: "amber",   nivel_poder: 5 },
      ];

      const createdTags: any[] = [];
      for (const t of tagsDefault) {
        const tag = await tx.comunidade_tags.create({
          data: {
            id: `tag-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            comunidade_id: id,
            nome: t.nome,
            cor: t.cor,
            nivel_poder: t.nivel_poder
          }
        });
        createdTags.push(tag);
      }

      // 3. Adiciona dono como membro aprovado
      const membroId = `mb-${Date.now()}`;
      const membro = await tx.comunidade_membros.create({
        data: {
          id: membroId,
          comunidade_id: id,
          user_id: owner_id,
          status: 'aprovado',
          joined_at: new Date()
        }
      });

      // 4. Atribui tag Dono
      const donoTag = createdTags.find(t => t.nome === "Dono");
      if (donoTag) {
        await tx.comunidade_membro_tags.create({
          data: {
            id: `mt-${Date.now()}`,
            membro_id: membroId,
            tag_id: donoTag.id,
            atribuido_por: owner_id
          }
        });
      }

      return { communityId: id };
    });

    return NextResponse.json({ success: true, communityId: result.communityId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

