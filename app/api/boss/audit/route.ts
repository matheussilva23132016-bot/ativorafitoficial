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
    const params: any[] = [];
    const filters: string[] = [];

    if (q) {
      const like = `%${q}%`;
      filters.push(
        "(actor_nickname LIKE ? OR target_nickname LIKE ? OR action LIKE ? OR details_json LIKE ?)",
      );
      params.push(like, like, like, like);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

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
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT 120`,
      params,
    );

    return NextResponse.json({ logs: rows || [] });
  } catch (error: any) {
    return jsonError(error, "Não foi possível carregar a auditoria Boss.");
  }
}
