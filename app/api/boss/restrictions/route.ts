import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import { ensureBossTables } from "@/lib/boss/access";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!user?.id && !user?.nickname) {
      return NextResponse.json({ scopes: [] });
    }

    await ensureBossTables();

    const nickname = String(user.nickname || "").trim().replace(/^@/, "").toLowerCase();
    const [rows]: any = await db.execute(
      `SELECT scope
       FROM boss_bans
       WHERE status = 'active'
         AND (
          target_user_id = ?
          OR LOWER(target_nickname) = LOWER(?)
         )`,
      [String(user.id || ""), nickname],
    );

    return NextResponse.json({
      scopes: [...new Set((rows || []).map((row: any) => String(row.scope)))],
    });
  } catch {
    return NextResponse.json({ scopes: [] });
  }
}
