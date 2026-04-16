import { NextResponse } from "next/server";
import db from "@/lib/db";
import {
  BOSS_OWNER_NICKNAME,
  BossAccessError,
  requireBossAccess,
  writeBossAudit,
} from "@/lib/boss/access";

export const dynamic = "force-dynamic";

const normalizeNickname = (value: unknown) =>
  String(value || "").trim().replace(/^@/, "").toLowerCase();

const normalizeLevel = (value: unknown) => {
  const level = String(value || "admin").trim().toLowerCase();
  return ["owner", "admin", "moderador"].includes(level) ? level : "admin";
};

const toFlag = (value: unknown) => (value ? 1 : 0);

const jsonError = (error: any, fallback: string) => {
  if (error instanceof BossAccessError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  return NextResponse.json({ error: error?.message || fallback }, { status: 500 });
};

async function findTarget(identifier: string) {
  const clean = normalizeNickname(identifier);

  const [rows]: any = await db.execute(
    `SELECT id, nickname, email, full_name
     FROM ativora_users
     WHERE LOWER(nickname) = LOWER(?)
        OR LOWER(email) = LOWER(?)
        OR id = ?
     LIMIT 1`,
    [clean, clean, identifier],
  );

  return rows?.[0] || null;
}

export async function GET() {
  try {
    await requireBossAccess("can_grant_access");

    const [rows]: any = await db.execute(
      `SELECT
        ba.id,
        ba.user_id,
        ba.nickname,
        ba.nivel,
        ba.can_create_users,
        ba.can_ban_users,
        ba.can_grant_access,
        ba.can_run_sql,
        ba.can_manage_app,
        ba.can_moderate_content,
        ba.can_send_broadcast,
        ba.can_view_audit,
        ba.granted_by,
        ba.active,
        ba.created_at,
        u.full_name,
        u.email
       FROM boss_access ba
       LEFT JOIN ativora_users u ON u.id = ba.user_id
       ORDER BY ba.active DESC, ba.created_at DESC
       LIMIT 80`,
    );

    return NextResponse.json({ accesses: rows || [] });
  } catch (error: any) {
    return jsonError(error, "Não foi possível listar acessos Boss.");
  }
}

export async function POST(req: Request) {
  try {
    const { user, access } = await requireBossAccess("can_grant_access");
    const body = await req.json();
    const target = await findTarget(String(body.identifier || body.nickname || body.email || body.userId || ""));

    if (!target) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    const level = normalizeLevel(body.level);
    const canCreateUsers = level === "owner" ? 1 : toFlag(body.canCreateUsers);
    const canBanUsers = level === "owner" ? 1 : toFlag(body.canBanUsers);
    const canGrantAccess = level === "owner" ? 1 : toFlag(body.canGrantAccess);
    const canRunSql = level === "owner" ? 1 : toFlag(body.canRunSql);
    const canManageApp = level === "owner" ? 1 : toFlag(body.canManageApp);
    const canModerateContent = level === "owner" ? 1 : toFlag(body.canModerateContent);
    const canSendBroadcast = level === "owner" ? 1 : toFlag(body.canSendBroadcast);
    const canViewAudit = level === "owner" ? 1 : toFlag(body.canViewAudit);

    await db.execute(
      `INSERT INTO boss_access
        (id, user_id, nickname, nivel, can_create_users, can_ban_users, can_grant_access, can_run_sql, can_manage_app, can_moderate_content, can_send_broadcast, can_view_audit, granted_by, active)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE
        user_id = VALUES(user_id),
        nickname = VALUES(nickname),
        nivel = VALUES(nivel),
        can_create_users = VALUES(can_create_users),
        can_ban_users = VALUES(can_ban_users),
        can_grant_access = VALUES(can_grant_access),
        can_run_sql = VALUES(can_run_sql),
        can_manage_app = VALUES(can_manage_app),
        can_moderate_content = VALUES(can_moderate_content),
        can_send_broadcast = VALUES(can_send_broadcast),
        can_view_audit = VALUES(can_view_audit),
        granted_by = VALUES(granted_by),
        active = 1`,
      [
        target.id,
        normalizeNickname(target.nickname),
        level,
        canCreateUsers,
        canBanUsers,
        canGrantAccess,
        canRunSql,
        canManageApp,
        canModerateContent,
        canSendBroadcast,
        canViewAudit,
        user.id,
      ],
    );

    await writeBossAudit({
      actorUserId: String(user.id),
      actorNickname: access.nickname,
      action: "grant_boss_access",
      targetUserId: target.id,
      targetNickname: target.nickname,
      details: {
        level,
        canCreateUsers,
        canBanUsers,
        canGrantAccess,
        canRunSql,
        canManageApp,
        canModerateContent,
        canSendBroadcast,
        canViewAudit,
      },
    });

    return NextResponse.json({ success: true, message: "Acesso Boss atualizado." });
  } catch (error: any) {
    return jsonError(error, "Não foi possível conceder acesso Boss.");
  }
}

export async function PATCH(req: Request) {
  try {
    const { user, access } = await requireBossAccess("can_grant_access");
    const body = await req.json();
    const id = String(body.id || "");

    if (!id) {
      return NextResponse.json({ error: "Informe o ID do acesso." }, { status: 400 });
    }

    const [rows]: any = await db.execute(
      "SELECT id, user_id, nickname, nivel FROM boss_access WHERE id = ? LIMIT 1",
      [id],
    );
    const target = rows?.[0];

    if (!target) {
      return NextResponse.json({ error: "Acesso não encontrado." }, { status: 404 });
    }

    if (normalizeNickname(target.nickname) === BOSS_OWNER_NICKNAME) {
      return NextResponse.json({ error: "O acesso fundador não pode ser removido pelo painel." }, { status: 400 });
    }

    await db.execute(
      "UPDATE boss_access SET active = 0 WHERE id = ?",
      [id],
    );

    await writeBossAudit({
      actorUserId: String(user.id),
      actorNickname: access.nickname,
      action: "revoke_boss_access",
      targetUserId: target.user_id,
      targetNickname: target.nickname,
      details: { accessId: id },
    });

    return NextResponse.json({ success: true, message: "Acesso Boss removido." });
  } catch (error: any) {
    return jsonError(error, "Não foi possível remover acesso Boss.");
  }
}
