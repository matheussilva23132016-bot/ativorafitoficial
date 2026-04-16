import { NextResponse } from "next/server";
import db from "@/lib/db";
import { BossAccessError, requireBossAccess } from "@/lib/boss/access";

export const dynamic = "force-dynamic";

const jsonError = (error: any, fallback: string) => {
  if (error instanceof BossAccessError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  return NextResponse.json({ error: error?.message || fallback }, { status: 500 });
};

async function safeScalar(sql: string, params: any[] = []) {
  try {
    const [rows]: any = await db.execute(sql, params);
    return Number(rows?.[0]?.total || 0);
  } catch {
    return 0;
  }
}

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
    await requireBossAccess();

    const [
      totalUsers,
      activeUsers,
      bannedUsers,
      newUsers7d,
      totalPosts,
      totalCommunities,
      pendingCommunityRequests,
      activeBans,
      pendingSuggestions,
      broadcasts,
    ] = await Promise.all([
      safeScalar("SELECT COUNT(*) AS total FROM ativora_users"),
      safeScalar("SELECT COUNT(*) AS total FROM ativora_users WHERE LOWER(COALESCE(account_status, 'active')) IN ('active','ativo')"),
      safeScalar("SELECT COUNT(*) AS total FROM ativora_users WHERE LOWER(COALESCE(account_status, 'active')) = 'banned'"),
      safeScalar("SELECT COUNT(*) AS total FROM ativora_users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"),
      safeScalar("SELECT COUNT(*) AS total FROM posts"),
      safeScalar("SELECT COUNT(*) AS total FROM comunidades"),
      safeScalar("SELECT COUNT(*) AS total FROM comunidade_membros WHERE status IN ('pendente','pending')"),
      safeScalar("SELECT COUNT(*) AS total FROM boss_bans WHERE status = 'active'"),
      safeScalar("SELECT COUNT(*) AS total FROM beta_sugestoes WHERE status IN ('recebida','nova','aberta')"),
      safeScalar("SELECT COUNT(*) AS total FROM boss_broadcasts"),
    ]);

    const recentUsers = await safeRows(
      `SELECT id, full_name, nickname, email, role, account_status, created_at
       FROM ativora_users
       ORDER BY created_at DESC
       LIMIT 6`,
    );

    const recentAudit = await safeRows(
      `SELECT id, actor_nickname, action, target_nickname, created_at
       FROM boss_audit_log
       ORDER BY created_at DESC
       LIMIT 6`,
    );

    const recentSuggestions = await safeRows(
      `SELECT id, nickname, categoria, impacto, mensagem, status, created_at
       FROM beta_sugestoes
       ORDER BY created_at DESC
       LIMIT 5`,
    );

    return NextResponse.json({
      stats: {
        totalUsers,
        activeUsers,
        bannedUsers,
        newUsers7d,
        totalPosts,
        totalCommunities,
        pendingCommunityRequests,
        activeBans,
        pendingSuggestions,
        broadcasts,
      },
      recentUsers,
      recentAudit,
      recentSuggestions,
    });
  } catch (error: any) {
    return jsonError(error, "Não foi possível carregar a central Boss.");
  }
}
