import { NextResponse } from "next/server";
import db from "@/lib/db";
import {
  BossAccessError,
  requireBossAccess,
  writeBossAudit,
} from "@/lib/boss/access";

export const dynamic = "force-dynamic";

const VALID_AUDIENCES = ["all", "role", "user"] as const;
type Audience = (typeof VALID_AUDIENCES)[number];

const normalizeAudience = (value: unknown): Audience => {
  const audience = String(value || "all").trim().toLowerCase();
  return VALID_AUDIENCES.includes(audience as Audience) ? (audience as Audience) : "all";
};

const jsonError = (error: any, fallback: string) => {
  if (error instanceof BossAccessError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  return NextResponse.json({ error: error?.message || fallback }, { status: 500 });
};

export async function GET() {
  try {
    await requireBossAccess("can_send_broadcast");

    const [rows]: any = await db.execute(
      `SELECT id, titulo, mensagem, audience, role_target, user_target, sent_by, delivered_count, created_at
       FROM boss_broadcasts
       ORDER BY created_at DESC
       LIMIT 80`,
    );

    return NextResponse.json({ broadcasts: rows || [] });
  } catch (error: any) {
    return jsonError(error, "Não foi possível carregar avisos.");
  }
}

export async function POST(req: Request) {
  try {
    const { user, access } = await requireBossAccess("can_send_broadcast");
    const body = await req.json();
    const titulo = String(body.titulo || body.title || "").trim().slice(0, 160);
    const mensagem = String(body.mensagem || body.message || "").trim().slice(0, 1200);
    const audience = normalizeAudience(body.audience);
    const roleTarget = String(body.roleTarget || "").trim().toLowerCase();
    const userTarget = String(body.userTarget || "").trim().replace(/^@/, "").toLowerCase();

    if (titulo.length < 3 || mensagem.length < 8) {
      return NextResponse.json({ error: "Informe título e mensagem do aviso." }, { status: 400 });
    }

    let where = "1 = 1";
    const params: any[] = [];

    if (audience === "role") {
      if (!roleTarget) {
        return NextResponse.json({ error: "Informe o perfil de destino." }, { status: 400 });
      }
      where = "LOWER(role) = LOWER(?)";
      params.push(roleTarget);
    }

    if (audience === "user") {
      if (!userTarget) {
        return NextResponse.json({ error: "Informe o nickname do usuário." }, { status: 400 });
      }
      where = "LOWER(nickname) = LOWER(?)";
      params.push(userTarget);
    }

    const [targets]: any = await db.execute(
      `SELECT id, nickname
       FROM ativora_users
       WHERE ${where}
         AND nickname IS NOT NULL
         AND LOWER(COALESCE(account_status, 'active')) IN ('active','ativo')
       LIMIT 5000`,
      params,
    );

    const broadcastId = crypto.randomUUID();

    await db.execute(
      `INSERT INTO boss_broadcasts
        (id, titulo, mensagem, audience, role_target, user_target, sent_by, delivered_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [broadcastId, titulo, mensagem, audience, roleTarget || null, userTarget || null, user.id, targets?.length || 0],
    );

    for (const target of targets || []) {
      await db.execute(
        `INSERT INTO boss_broadcast_recipients
          (id, broadcast_id, user_id, nickname, lida)
         VALUES (UUID(), ?, ?, ?, 0)
         ON DUPLICATE KEY UPDATE lida = 0, read_at = NULL`,
        [broadcastId, target.id || null, target.nickname],
      );
    }

    await writeBossAudit({
      actorUserId: String(user.id),
      actorNickname: access.nickname,
      action: "send_broadcast",
      details: { titulo, audience, roleTarget, userTarget, delivered: targets?.length || 0 },
    });

    return NextResponse.json({
      success: true,
      message: `Aviso enviado para ${targets?.length || 0} usuário(s).`,
      deliveredCount: targets?.length || 0,
    });
  } catch (error: any) {
    return jsonError(error, "Não foi possível enviar o aviso.");
  }
}
