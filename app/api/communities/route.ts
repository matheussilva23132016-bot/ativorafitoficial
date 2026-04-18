import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import prisma from "@/lib/prisma";

const MAX_COVER_BYTES = 12 * 1024 * 1024;

async function persistCommunityCoverIfBase64(input: unknown) {
  if (typeof input !== "string") return "";
  const raw = input.trim();
  if (!raw) return "";

  if (!raw.startsWith("data:image/") || !raw.includes("base64,")) {
    return raw;
  }

  const mimeMatch = raw.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
  if (!mimeMatch) {
    throw new Error("Formato de capa inválido.");
  }

  const base64Data = raw.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");

  if (!buffer.length) throw new Error("Capa vazia.");
  if (buffer.length > MAX_COVER_BYTES) throw new Error("Capa muito grande. Limite: 12MB.");

  const extension =
    mimeMatch[1].split("/")[1]?.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) || "jpg";
  const fileName = `community-cover-${Date.now()}-${randomUUID()}.${extension}`;
  const uploadDir = join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(join(uploadDir, fileName), buffer);

  return `/uploads/${fileName}`;
}

// GET /api/communities?userId=xxx
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId obrigatório" }, { status: 400 });
  }

  try {
    const rawComms = await prisma.comunidades.findMany({
      where: {
        status: "ativa",
      },
      include: {
        comunidade_membros: {
          where: { user_id: userId },
          include: {
            comunidade_membro_tags: {
              include: {
                comunidade_tags: true,
              },
            },
          },
        },
        solicitacoes_entrada: {
          where: { user_id: userId },
          orderBy: { created_at: "desc" },
          take: 1,
        },
      },
      orderBy: { created_at: "desc" },
    });

    const communities = rawComms
      .map((community) => {
        const member = community.comunidade_membros[0];
        const request = community.solicitacoes_entrada[0];
        const isOwner = community.owner_id === userId;
        const isMember = member?.status === "aprovado" || isOwner;
        const tags =
          member?.comunidade_membro_tags
            .map((memberTag) => memberTag.comunidade_tags)
            .sort((a, b) => (b?.nivel_poder ?? 0) - (a?.nivel_poder ?? 0))
            .map((tag) => tag?.nome)
            .filter(Boolean) ?? (isOwner ? ["Dono"] : []);

        return {
          ...community,
          name: community.nome,
          description: community.descricao,
          member_status: member?.status ?? null,
          request_status: request?.status ?? null,
          membro_id: member?.id ?? null,
          isMember,
          isOwner,
          userTags: tags,
        };
      })
      .sort((a, b) => {
        if (a.isMember && !b.isMember) return -1;
        if (!a.isMember && b.isMember) return 1;
        return 0;
      });

    return NextResponse.json({ communities });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/communities - Criar comunidade
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, description, cover_url, theme, focus, privacy, owner_id } = body;

    if (!name || !owner_id) {
      return NextResponse.json({ error: "name e owner_id obrigatorios" }, { status: 400 });
    }

    const communityId =
      typeof id === "string" && id.trim().length > 0
        ? id.trim().slice(0, 36)
        : randomUUID();
    const normalizedCoverUrl = await persistCommunityCoverIfBase64(cover_url);

    const runCreateCommunity = () =>
      prisma.$transaction(
        async (tx) => {
          const tagsDefault = [
            { id: randomUUID(), nome: "Participante", cor: "sky", nivel_poder: 1 },
            { id: randomUUID(), nome: "Instrutor", cor: "emerald", nivel_poder: 2 },
            { id: randomUUID(), nome: "Personal", cor: "emerald", nivel_poder: 2 },
            { id: randomUUID(), nome: "Nutri", cor: "green", nivel_poder: 3 },
            { id: randomUUID(), nome: "Nutricionista", cor: "green", nivel_poder: 3 },
            { id: randomUUID(), nome: "ADM", cor: "purple", nivel_poder: 4 },
            { id: randomUUID(), nome: "Dono", cor: "amber", nivel_poder: 5 },
          ];
          const ownerTag = tagsDefault.find((tag) => tag.nome === "Dono");
          const memberId = randomUUID();

          await tx.comunidades.create({
            data: {
              id: communityId,
              nome: name,
              descricao: description ?? "",
              cover_url: normalizedCoverUrl,
              tema: theme ?? "sky",
              foco: focus ?? "Todas",
              privacidade: privacy ?? "public",
              owner_id,
              status: "ativa",
              total_membros: 1,
            },
          });

          await tx.comunidade_tags.createMany({
            data: tagsDefault.map((tag) => ({
              id: tag.id,
              comunidade_id: communityId,
              nome: tag.nome,
              cor: tag.cor,
              nivel_poder: tag.nivel_poder,
            })),
          });

          await tx.comunidade_membros.create({
            data: {
              id: memberId,
              comunidade_id: communityId,
              user_id: owner_id,
              status: "aprovado",
              joined_at: new Date(),
            },
          });

          if (ownerTag) {
            await tx.comunidade_membro_tags.create({
              data: {
                id: randomUUID(),
                membro_id: memberId,
                tag_id: ownerTag.id,
                atribuido_por: owner_id,
              },
            });
          }

          return { communityId };
        },
        { maxWait: 15000, timeout: 30000 },
      );

    let result;
    try {
      result = await runCreateCommunity();
    } catch (error: any) {
      const message = String(error?.message || "");
      const code = String(error?.code || "");
      const shouldRetry =
        code === "P2028" ||
        message.includes("Unable to start a transaction in the given time");

      if (!shouldRetry) throw error;
      result = await runCreateCommunity();
    }

    return NextResponse.json({ success: true, communityId: result.communityId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
