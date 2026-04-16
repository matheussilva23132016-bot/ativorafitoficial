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

export async function GET(req: Request) {
  try {
    await requireBossAccess("can_view_audit");

    const { searchParams } = new URL(req.url);
    const q = String(searchParams.get("q") || "").trim();
    const like = `%${q}%`;

    const [rows]: any = await db.execute(
      `SELECT
        id,
        actor_user_id,
        actor_nickname,
        action,
        target_user_id,
        target_nickname,
        details_json,
        created_at
       FROM boss_audit_log
       WHERE (? = ''
          OR actor_nickname LIKE ?
          OR target_nickname LIKE ?
          OR action LIKE ?
          OR details_json LIKE ?)
       ORDER BY created_at DESC
       LIMIT 120`,
      [q, like, like, like, like],
    );

    return NextResponse.json({ logs: rows || [] });
  } catch (error: any) {
    return jsonError(error, "Não foi possível carregar a auditoria Boss.");
  }
}
