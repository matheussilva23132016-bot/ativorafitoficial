import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { db } from "@/lib/db";

const MAX_COVER_BYTES = 12 * 1024 * 1024;

async function persistCommunityCoverIfBase64(input: unknown) {
  if (typeof input !== "string") return input;
  const raw = input.trim();
  if (!raw) return "";

  if (!raw.startsWith("data:image/") || !raw.includes("base64,")) {
    return raw;
  }

  const mimeMatch = raw.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
  if (!mimeMatch) throw new Error("Formato de capa inválido.");

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

// GET /api/communities/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const paramsId = resolvedParams.id;
    const [rows] = await db.query(`
      SELECT c.*,
        (SELECT COUNT(*) FROM comunidade_membros
         WHERE comunidade_id = c.id AND status = 'aprovado') AS total_membros
      FROM comunidades c
      WHERE c.id = ?
    `, [paramsId]);

    const raw = (rows as any[])[0];
    if (!raw)
      return NextResponse.json({ error: "Comunidade não encontrada" }, { status: 404 });

    // Normaliza campos do banco para os nomes usados no frontend
    const community = {
      ...raw,
      name:        raw.nome      ?? raw.name        ?? "",
      description: raw.descricao ?? raw.description ?? "",
    };

    return NextResponse.json({ community });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/communities/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const paramsId = resolvedParams.id;
    const body = await req.json();
    const { nome, descricao, cover_url, tema, foco, privacidade, requesterId } = body;
    const normalizedCoverUrl = await persistCommunityCoverIfBase64(cover_url);

    // Verifica se é dono
    const [check] = await db.query(`
      SELECT c.id FROM comunidades c
      INNER JOIN comunidade_membros cm
        ON cm.comunidade_id = c.id AND cm.user_id = ?
      INNER JOIN comunidade_membro_tags cmt
        ON cmt.membro_id = cm.id
      INNER JOIN comunidade_tags ct
        ON ct.id = cmt.tag_id AND ct.nome = 'Dono'
      WHERE c.id = ?
    `, [requesterId, paramsId]);

    if (!(check as any[]).length)
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

    await db.query(`
      UPDATE comunidades
      SET nome        = COALESCE(?, nome),
          descricao   = COALESCE(?, descricao),
          cover_url   = COALESCE(?, cover_url),
          tema        = COALESCE(?, tema),
          foco        = COALESCE(?, foco),
          privacidade = COALESCE(?, privacidade)
      WHERE id = ?
    `, [nome, descricao, normalizedCoverUrl, tema, foco, privacidade, paramsId]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/communities/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const paramsId = resolvedParams.id;
    const { requesterId } = await req.json();

    if (!requesterId)
      return NextResponse.json({ error: "requesterId obrigatório" }, { status: 400 });

    // Aceita dono pelo owner_id OU pela tag Dono
    const [check] = await db.query(`
      SELECT c.id FROM comunidades c
      WHERE c.id = ? AND c.owner_id = ?
      UNION
      SELECT c.id FROM comunidades c
      INNER JOIN comunidade_membros cm
        ON cm.comunidade_id = c.id AND cm.user_id = ?
      INNER JOIN comunidade_membro_tags cmt
        ON cmt.membro_id = cm.id
      INNER JOIN comunidade_tags ct
        ON ct.id = cmt.tag_id AND ct.nome = 'Dono'
      WHERE c.id = ?
      LIMIT 1
    `, [paramsId, requesterId, requesterId, paramsId]);

    if (!(check as any[]).length)
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

    await db.query(
      `UPDATE comunidades SET status = 'encerrada' WHERE id = ?`,
      [paramsId]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
