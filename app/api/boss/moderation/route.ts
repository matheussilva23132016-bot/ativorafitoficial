import { NextResponse } from "next/server";
import db from "@/lib/db";
import { BossAccessError, requireBossAccess, writeBossAudit } from "@/lib/boss/access";

export const dynamic = "force-dynamic";

const jsonError = (error: any, fallback: string) => {
  if (error instanceof BossAccessError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  return NextResponse.json({ error: error?.message || fallback }, { status: 500 });
};

async function safeRows(sql: string, params: any[] = []) {
  try {
    const [rows]: any = await db.execute(sql, params);
    return rows || [];
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    await requireBossAccess("can_moderate_content");

    const posts = await safeRows(
      `SELECT id, nickname, content, media_type, likes, comentarios_count, criado_em
       FROM posts
       ORDER BY id DESC
       LIMIT 30`,
    );

    const suggestions = await safeRows(
      `SELECT id, nickname, categoria, impacto, contexto, mensagem, dispositivo, status, created_at
       FROM beta_sugestoes
       ORDER BY created_at DESC
       LIMIT 30`,
    );

    const communities = await safeRows(
      `SELECT id, nome, descricao, owner_id, status, total_membros, created_at
       FROM comunidades
       ORDER BY created_at DESC
       LIMIT 30`,
    );

    return NextResponse.json({ posts, suggestions, communities });
  } catch (error: any) {
    return jsonError(error, "Não foi possível carregar moderação.");
  }
}

export async function PATCH(req: Request) {
  try {
    const { user, access } = await requireBossAccess("can_moderate_content");
    const body = await req.json();
    const action = String(body.action || "").trim();

    if (action === "update_suggestion") {
      const id = String(body.id || "").trim();
      const status = String(body.status || "em_analise").trim().slice(0, 30);

      if (!id) {
        return NextResponse.json({ error: "Informe a sugestão." }, { status: 400 });
      }

      await db.execute("UPDATE beta_sugestoes SET status = ? WHERE id = ?", [status, id]);

      await writeBossAudit({
        actorUserId: String(user.id),
        actorNickname: access.nickname,
        action: "update_beta_suggestion",
        details: { id, status },
      });

      return NextResponse.json({ success: true, message: "Sugestão atualizada." });
    }

    if (action === "delete_post") {
      const id = String(body.id || "").trim();

      if (!id) {
        return NextResponse.json({ error: "Informe o post." }, { status: 400 });
      }

      const [posts]: any = await db.execute("SELECT id, nickname FROM posts WHERE id = ? LIMIT 1", [id]);
      const post = posts?.[0];

      if (!post) {
        return NextResponse.json({ error: "Post não encontrado." }, { status: 404 });
      }

      await db.execute("DELETE FROM notificacoes WHERE referencia_id = ? AND tipo IN ('like', 'comment')", [id]);
      await db.execute("DELETE FROM posts_salvos WHERE post_id = ?", [id]);
      await db.execute("DELETE FROM curtidas WHERE post_id = ?", [id]);
      await db.execute("DELETE FROM posts_comentarios WHERE post_id = ?", [id]);
      await db.execute("DELETE FROM enquetes_votos WHERE post_id = ?", [id]);
      await db.execute("DELETE FROM posts WHERE id = ?", [id]);

      await writeBossAudit({
        actorUserId: String(user.id),
        actorNickname: access.nickname,
        action: "delete_post",
        targetNickname: post.nickname,
        details: { postId: id },
      });

      return NextResponse.json({ success: true, message: "Post removido." });
    }

    if (action === "update_community_status") {
      const id = String(body.id || "").trim();
      const status = String(body.status || "ativa").trim().toLowerCase();
      const normalizedStatus = ["ativa", "pausada", "encerrada"].includes(status) ? status : "ativa";

      if (!id) {
        return NextResponse.json({ error: "Informe a comunidade." }, { status: 400 });
      }

      await db.execute("UPDATE comunidades SET status = ? WHERE id = ?", [normalizedStatus, id]);

      await writeBossAudit({
        actorUserId: String(user.id),
        actorNickname: access.nickname,
        action: "update_community_status",
        details: { communityId: id, status: normalizedStatus },
      });

      return NextResponse.json({ success: true, message: "Comunidade atualizada." });
    }

    return NextResponse.json({ error: "Ação de moderação inválida." }, { status: 400 });
  } catch (error: any) {
    return jsonError(error, "Não foi possível aplicar a moderação.");
  }
}
