import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const TAG_DEFAULTS: Record<string, { cor: string; nivel_poder: number }> = {
  Participante: { cor: "sky", nivel_poder: 1 },
  Instrutor: { cor: "emerald", nivel_poder: 2 },
  Personal: { cor: "emerald", nivel_poder: 2 },
  Nutri: { cor: "green", nivel_poder: 3 },
  Nutricionista: { cor: "green", nivel_poder: 3 },
  ADM: { cor: "purple", nivel_poder: 4 },
  Dono: { cor: "amber", nivel_poder: 5 },
};

// GET — Lista membros aprovados com tags
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = await params;
  const paramsId = resolvedParams.id;
  try {
    const membersRaw = await prisma.comunidade_membros.findMany({
      where: {
        comunidade_id: paramsId,
        status: 'aprovado'
      },
      include: {
        comunidade_membro_tags: {
          include: {
            comunidade_tags: true
          }
        }
      },
      orderBy: { joined_at: 'asc' }
    });

    // Como as tabelas 'usuarios' e 'comunidade_membros' podem não ter FK explícita no Prisma devido ao tipo (Int vs String)
    // Buscamos os nicknames e nomes manualmente ou via raw se necessário. 
    // Porém, para maior performance e tipagem, vamos usar o Raw apenas para o JOIN complexo de usuários se a relação não existir.
    
    // No schema atual, usamos 'ativora_users' como base unificada.
    const userIds = membersRaw.map(m => m.user_id);
    const users = await prisma.ativora_users.findMany({
      where: { id: { in: userIds } },
      select: { id: true, nickname: true, avatar_url: true }
    });

    const members = membersRaw.map(m => {
      const u = users.find(user => user.id === m.user_id);
      const tags = m.comunidade_membro_tags
        .map(mt => mt.comunidade_tags)
        .sort((a, b) => (b?.nivel_poder ?? 0) - (a?.nivel_poder ?? 0))
        .map(t => t?.nome)
        .filter(Boolean) || ["Participante"];

      return {
        membro_id:  m.id,
        user_id:    m.user_id,
        joined_at:  m.joined_at,
        nickname:   u?.nickname || "Atleta",
        full_name:  u?.nickname || "Atleta", 
        avatar_url: u?.avatar_url || null,
        tags:       tags,
        role:       tags[0] || "Participante",
      };
    }).sort((a, b) => {
      // Ordena por poder da tag principal (aproximado via nome se necessário, ou podemos adicionar campo poder)
      return 0; // Já ordenado pelo joined_at no banco
    });

    return NextResponse.json({ members });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH — Atribuir/remover tag de membro
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = await params;
  const paramsId = resolvedParams.id;
  try {
    const { membroId, tagNome, acao, requesterId } = await req.json();

    if (tagNome === "Participante" && acao === "remove") {
      return NextResponse.json(
        { error: "Participante e a tag base de todo membro aprovado" },
        { status: 400 }
      );
    }

    // Verifica permissão (ADM ou Dono)
    const requesterMembro = await prisma.comunidade_membros.findFirst({
      where: {
        comunidade_id: paramsId,
        user_id: requesterId,
        status: 'aprovado',
        comunidade_membro_tags: {
          some: {
            comunidade_tags: {
              nome: { in: ['ADM', 'Dono'] }
            }
          }
        }
      },
      include: {
        comunidade_membro_tags: {
          include: { comunidade_tags: true }
        }
      }
    });

    const communityOwner = await prisma.comunidades.findUnique({
      where: { id: paramsId },
      select: { owner_id: true }
    });
    const isOwner = communityOwner?.owner_id === String(requesterId);

    if (!requesterMembro && !isOwner) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    // Busca a tag pelo nome
    let tag = await prisma.comunidade_tags.findFirst({
      where: { comunidade_id: paramsId, nome: tagNome }
    });

    if (!tag && acao === "add" && TAG_DEFAULTS[tagNome]) {
      tag = await prisma.comunidade_tags.create({
        data: {
          id: `tag-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          comunidade_id: paramsId,
          nome: tagNome,
          cor: TAG_DEFAULTS[tagNome].cor,
          nivel_poder: TAG_DEFAULTS[tagNome].nivel_poder,
        }
      });
    }

    if (!tag) return NextResponse.json({ error: "Tag não encontrada" }, { status: 404 });

    // ADM não pode atribuir tag de nível superior
    const requesterPower = isOwner
      ? 6
      : Math.max(...(requesterMembro?.comunidade_membro_tags.map(mt => mt.comunidade_tags?.nivel_poder ?? 1) ?? [1]), 1);
    
    if (tag.nivel_poder >= requesterPower) {
      return NextResponse.json({ error: "Não pode atribuir tag de nível igual ou superior ao seu" }, { status: 403 });
    }

    if (acao === "add") {
      await prisma.comunidade_membro_tags.upsert({
        where: {
          membro_id_tag_id: {
            membro_id: membroId,
            tag_id: tag.id
          }
        },
        update: {},
        create: {
          id: `mt-${Date.now()}`,
          membro_id: membroId,
          tag_id: tag.id,
          atribuido_por: requesterId
        }
      });
    } else {
      await prisma.comunidade_membro_tags.deleteMany({
        where: { membro_id: membroId, tag_id: tag.id }
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE — Remover membro
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = await params;
  const paramsId = resolvedParams.id;
  try {
    const { membroId, requesterId } = await req.json();

    // Verifica permissão
    const requesterMembro = await prisma.comunidade_membros.findFirst({
      where: {
        comunidade_id: paramsId,
        user_id: requesterId,
        status: 'aprovado',
        comunidade_membro_tags: {
          some: {
            comunidade_tags: {
              nome: { in: ['ADM', 'Dono'] }
            }
          }
        }
      }
    });

    const communityOwner = await prisma.comunidades.findUnique({
      where: { id: paramsId },
      select: { owner_id: true }
    });
    const isOwner = communityOwner?.owner_id === String(requesterId);

    if (!requesterMembro && !isOwner) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.comunidade_membros.update({
        where: { id: membroId },
        data: { status: 'removido' }
      });

      const count = await tx.comunidade_membros.count({
        where: { comunidade_id: paramsId, status: 'aprovado' }
      });

      await tx.comunidades.update({
        where: { id: paramsId },
        data: { total_membros: count }
      });
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
