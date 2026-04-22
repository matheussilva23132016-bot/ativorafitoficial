import { NextResponse } from "next/server";
import db from "@/lib/db";
import {
  BossAccessError,
  requireBossAccess,
  writeBossAudit,
} from "@/lib/boss/access";

export const dynamic = "force-dynamic";

const VALID_SCOPES = ["app", "social", "comunidades", "treinos", "nutricao"] as const;
type BanScope = (typeof VALID_SCOPES)[number];

const normalizeScope = (value: unknown): BanScope => {
  const scope = String(value || "app").trim().toLowerCase();
  return VALID_SCOPES.includes(scope as BanScope) ? (scope as BanScope) : "app";
};

const normalizeNickname = (value: unknown) =>
  String(value || "").trim().replace(/^@/, "").toLowerCase();

const jsonError = (error: any, fallback: string) => {
  if (error instanceof BossAccessError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  return NextResponse.json({ error: error?.message || fallback }, { status: 500 });
};

async function findTarget(userId?: string, nickname?: string) {
  let sql =
    "SELECT id, nickname, email, full_name, account_status FROM ativora_users WHERE 1 = 0 LIMIT 1";
  let params: any[] = [];

  if (userId) {
    sql =
      "SELECT id, nickname, email, full_name, account_status FROM ativora_users WHERE id = ? LIMIT 1";
    params = [userId];
  } else if (nickname) {
    sql =
      "SELECT id, nickname, email, full_name, account_status FROM ativora_users WHERE LOWER(nickname) = LOWER(?) OR LOWER(email) = LOWER(?) LIMIT 1";
    params = [nickname, nickname];
  }

  const [rows]: any = await db.execute(sql, params);

  return rows?.[0] || null;
}

export async function GET() {
  try {
    await requireBossAccess("can_ban_users");

    const [rows]: any = await db.execute(
      `SELECT
        id,
        target_user_id,
        target_nickname,
        scope,
        reason,
        status,
        banned_by,
        revoked_by,
        created_at,
        revoked_at
       FROM boss_bans
       ORDER BY created_at DESC
       LIMIT 80`,
    );

    return NextResponse.json({ bans: rows || [] });
  } catch (error: any) {
    return jsonError(error, "Não foi possível listar banimentos.");
  }
}

export async function POST(req: Request) {
  try {
    const { user, access } = await requireBossAccess("can_ban_users");
    const body = await req.json();

    const scope = normalizeScope(body.scope);
    const reason = String(body.reason || "").trim().slice(0, 500);
    const target = await findTarget(String(body.userId || ""), normalizeNickname(body.nickname || body.identifier));

    if (!target) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    if (String(target.id) === String(user.id)) {
      return NextResponse.json({ error: "Você não pode banir a própria conta." }, { status: 400 });
    }

    await db.execute(
      `INSERT INTO boss_bans
        (id, target_user_id, target_nickname, scope, reason, status, banned_by)
       VALUES (UUID(), ?, ?, ?, ?, 'active', ?)`,
      [target.id, target.nickname, scope, reason || null, user.id],
    );

    if (scope === "app") {
      await db.execute(
        "UPDATE ativora_users SET account_status = 'banned' WHERE id = ?",
        [target.id],
      );
    }

    await writeBossAudit({
      actorUserId: String(user.id),
      actorNickname: access.nickname,
      action: "ban_user",
      targetUserId: target.id,
      targetNickname: target.nickname,
      details: { scope, reason },
    });

    return NextResponse.json({
      success: true,
      message: scope === "app" ? "Usuário banido do app." : "Restrição registrada para a plataforma.",
    });
  } catch (error: any) {
    return jsonError(error, "Não foi possível aplicar o banimento.");
  }
}

export async function PATCH(req: Request) {
  try {
    const { user, access } = await requireBossAccess("can_ban_users");
    const body = await req.json();
    const id = String(body.id || "");

    if (!id) {
      return NextResponse.json({ error: "Informe o ID do banimento." }, { status: 400 });
    }

    const [rows]: any = await db.execute(
      "SELECT id, target_user_id, target_nickname, scope, status FROM boss_bans WHERE id = ? LIMIT 1",
      [id],
    );
    const ban = rows?.[0];

    if (!ban) {
      return NextResponse.json({ error: "Banimento não encontrado." }, { status: 404 });
    }

    await db.execute(
      `UPDATE boss_bans
       SET status = 'revoked', revoked_by = ?, revoked_at = NOW()
       WHERE id = ?`,
      [user.id, id],
    );

    if (ban.scope === "app" && ban.target_user_id) {
      await db.execute(
        "UPDATE ativora_users SET account_status = 'active' WHERE id = ? AND account_status = 'banned'",
        [ban.target_user_id],
      );
    }

    await writeBossAudit({
      actorUserId: String(user.id),
      actorNickname: access.nickname,
      action: "revoke_ban",
      targetUserId: ban.target_user_id,
      targetNickname: ban.target_nickname,
      details: { banId: id, scope: ban.scope },
    });

    return NextResponse.json({ success: true, message: "Banimento revogado." });
  } catch (error: any) {
    return jsonError(error, "Não foi possível revogar o banimento.");
  }
}
