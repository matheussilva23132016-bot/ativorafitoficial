import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
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

const ROLE_TAGS = [
  "Participante",
  "Instrutor",
  "Personal",
  "Nutri",
  "Nutricionista",
  "ADM",
] as const;

const ROLE_TAG_SET = new Set<string>(ROLE_TAGS);

async function findOrCreateTag(comunidadeId: string, tagNome: string) {
  const existing = await prisma.comunidade_tags.findFirst({
    where: { comunidade_id: comunidadeId, nome: tagNome },
  });
  if (existing) return existing;

  const defaults = TAG_DEFAULTS[tagNome];
  if (!defaults) return null;

  try {
    return await prisma.comunidade_tags.create({
      data: {
        id: randomUUID(),
        comunidade_id: comunidadeId,
        nome: tagNome,
        cor: defaults.cor,
        nivel_poder: defaults.nivel_poder,
      },
    });
  } catch {
    return prisma.comunidade_tags.findFirst({
      where: { comunidade_id: comunidadeId, nome: tagNome },
    });
  }
}

async function loadMemberTagNames(membroId: string): Promise<string[]> {
  const member = await prisma.comunidade_membros.findUnique({
    where: { id: membroId },
    include: {
      comunidade_membro_tags: {
        include: {
          comunidade_tags: true,
        },
      },
    },
  });

  const tags = member?.comunidade_membro_tags
    ?.map(mt => mt.comunidade_tags)
    .sort((a, b) => (b?.nivel_poder ?? 0) - (a?.nivel_poder ?? 0))
    .map(tag => tag?.nome)
    .filter(Boolean) as string[] | undefined;

  return tags && tags.length > 0 ? tags : ["Participante"];
}

// GET - Lista membros aprovados com tags
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  const resolvedParams = await params;
  const paramsId = resolvedParams.id;
  try {
    const membersRaw = await prisma.comunidade_membros.findMany({
      where: {
        comunidade_id: paramsId,
        status: "aprovado",
      },
      include: {
        comunidade_membro_tags: {
          include: {
            comunidade_tags: true,
          },
        },
      },
      orderBy: { joined_at: "asc" },
    });

    const userIds = membersRaw.map(m => m.user_id);
    const users = await prisma.ativora_users.findMany({
      where: { id: { in: userIds } },
      select: { id: true, nickname: true, avatar_url: true },
    });

    const members = membersRaw.map(m => {
      const u = users.find(user => user.id === m.user_id);
      const tags =
        m.comunidade_membro_tags
          .map(mt => mt.comunidade_tags)
          .sort((a, b) => (b?.nivel_poder ?? 0) - (a?.nivel_poder ?? 0))
          .map(t => t?.nome)
          .filter(Boolean) || ["Participante"];

      return {
        membro_id: m.id,
        user_id: m.user_id,
        joined_at: m.joined_at,
        nickname: u?.nickname || "Atleta",
        full_name: u?.nickname || "Atleta",
        avatar_url: u?.avatar_url || null,
        tags,
        role: tags[0] || "Participante",
      };
    });

    return NextResponse.json({ members });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH - Atribuir/remover tag de membro OU definir cargo principal
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  const resolvedParams = await params;
  const paramsId = resolvedParams.id;

  try {
    const payload = await req.json();
    const requester = String(payload?.requesterId ?? "").trim();
    const targetMemberId = String(payload?.membroId ?? "").trim();
    const acao = String(payload?.acao ?? "").trim();
    const requestedTag = String(payload?.tagNome ?? "").trim();
    const requestedRole = String(payload?.roleNome ?? "").trim();

    if (!requester || !targetMemberId || !acao) {
      return NextResponse.json({ error: "Dados obrigatorios ausentes" }, { status: 400 });
    }

    const requesterMembro = await prisma.comunidade_membros.findFirst({
      where: {
        comunidade_id: paramsId,
        user_id: requester,
        status: "aprovado",
        comunidade_membro_tags: {
          some: {
            comunidade_tags: {
              nome: { in: ["ADM", "Dono"] },
            },
          },
        },
      },
      include: {
        comunidade_membro_tags: {
          include: { comunidade_tags: true },
        },
      },
    });

    const communityOwner = await prisma.comunidades.findUnique({
      where: { id: paramsId },
      select: { owner_id: true },
    });
    const isOwner = communityOwner?.owner_id === requester;

    if (!requesterMembro && !isOwner) {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 });
    }

    const targetMember = await prisma.comunidade_membros.findFirst({
      where: {
        id: targetMemberId,
        comunidade_id: paramsId,
        status: "aprovado",
      },
      include: {
        comunidade_membro_tags: {
          include: { comunidade_tags: true },
        },
      },
    });

    if (!targetMember) {
      return NextResponse.json({ error: "Membro nao encontrado" }, { status: 404 });
    }

    const targetHasOwnerTag = targetMember.comunidade_membro_tags.some(
      mt => mt.comunidade_tags?.nome === "Dono",
    );
    if (targetHasOwnerTag) {
      return NextResponse.json({ error: "Nao e possivel alterar o cargo do Dono" }, { status: 403 });
    }

    if (acao === "set_role") {
      if (!isOwner) {
        return NextResponse.json(
          { error: "Somente o Dono pode definir cargos dos membros" },
          { status: 403 },
        );
      }

      if (!ROLE_TAG_SET.has(requestedRole)) {
        return NextResponse.json({ error: "Cargo invalido" }, { status: 400 });
      }

      const requiredRoleTags = Array.from(new Set(["Participante", requestedRole]));
      const ensuredTags = await Promise.all(
        requiredRoleTags.map(tag => findOrCreateTag(paramsId, tag)),
      );

      const roleTagsInCommunity = await prisma.comunidade_tags.findMany({
        where: {
          comunidade_id: paramsId,
          nome: { in: Array.from(ROLE_TAG_SET) },
        },
      });

      await prisma.$transaction(async tx => {
        const removableRoleTagIds = roleTagsInCommunity.map(tag => tag.id);

        if (removableRoleTagIds.length > 0) {
          await tx.comunidade_membro_tags.deleteMany({
            where: {
              membro_id: targetMemberId,
              tag_id: { in: removableRoleTagIds },
            },
          });
        }

        for (const tag of ensuredTags) {
          if (!tag) continue;
          await tx.comunidade_membro_tags.upsert({
            where: {
              membro_id_tag_id: {
                membro_id: targetMemberId,
                tag_id: tag.id,
              },
            },
            update: {
              atribuido_por: requester,
            },
            create: {
              id: randomUUID(),
              membro_id: targetMemberId,
              tag_id: tag.id,
              atribuido_por: requester,
            },
          });
        }
      });

      const updatedTags = await loadMemberTagNames(targetMemberId);
      return NextResponse.json({ success: true, tags: updatedTags });
    }

    if (acao !== "add" && acao !== "remove") {
      return NextResponse.json({ error: "Operacao de tag invalida" }, { status: 400 });
    }

    if (!requestedTag) {
      return NextResponse.json({ error: "Tag obrigatoria" }, { status: 400 });
    }

    if (requestedTag === "Dono") {
      return NextResponse.json({ error: "A tag Dono nao pode ser atribuida por esta acao" }, { status: 400 });
    }

    if (requestedTag === "Participante" && acao === "remove") {
      return NextResponse.json(
        { error: "Participante e a tag base de todo membro aprovado" },
        { status: 400 },
      );
    }

    const tag =
      acao === "add"
        ? await findOrCreateTag(paramsId, requestedTag)
        : await prisma.comunidade_tags.findFirst({
            where: { comunidade_id: paramsId, nome: requestedTag },
          });

    if (!tag) {
      return NextResponse.json({ error: "Tag nao encontrada" }, { status: 404 });
    }

    const requesterPower = isOwner
      ? 6
      : Math.max(
          ...(requesterMembro?.comunidade_membro_tags.map(mt => mt.comunidade_tags?.nivel_poder ?? 1) ?? [1]),
          1,
        );

    if (tag.nivel_poder >= requesterPower) {
      return NextResponse.json(
        { error: "Nao pode atribuir tag de nivel igual ou superior ao seu" },
        { status: 403 },
      );
    }

    if (acao === "add") {
      await prisma.comunidade_membro_tags.upsert({
        where: {
          membro_id_tag_id: {
            membro_id: targetMemberId,
            tag_id: tag.id,
          },
        },
        update: {},
        create: {
          id: randomUUID(),
          membro_id: targetMemberId,
          tag_id: tag.id,
          atribuido_por: requester,
        },
      });
    } else {
      await prisma.comunidade_membro_tags.deleteMany({
        where: { membro_id: targetMemberId, tag_id: tag.id },
      });
    }

    const updatedTags = await loadMemberTagNames(targetMemberId);
    return NextResponse.json({ success: true, tags: updatedTags });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE - Remover membro
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  const resolvedParams = await params;
  const paramsId = resolvedParams.id;
  try {
    const { membroId, requesterId } = await req.json();
    const requester = String(requesterId ?? "").trim();

    const requesterMembro = await prisma.comunidade_membros.findFirst({
      where: {
        comunidade_id: paramsId,
        user_id: requester,
        status: "aprovado",
        comunidade_membro_tags: {
          some: {
            comunidade_tags: {
              nome: { in: ["ADM", "Dono"] },
            },
          },
        },
      },
    });

    const communityOwner = await prisma.comunidades.findUnique({
      where: { id: paramsId },
      select: { owner_id: true },
    });
    const isOwner = communityOwner?.owner_id === requester;

    if (!requesterMembro && !isOwner) {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 });
    }

    await prisma.$transaction(async tx => {
      await tx.comunidade_membros.update({
        where: { id: membroId },
        data: { status: "removido" },
      });

      const count = await tx.comunidade_membros.count({
        where: { comunidade_id: paramsId, status: "aprovado" },
      });

      await tx.comunidades.update({
        where: { id: paramsId },
        data: { total_membros: count },
      });
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
