import { NextResponse } from "next/server";
import db from "../../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");

    if (!postId) {
      return NextResponse.json({ error: "PostId nao fornecido" }, { status: 400 });
    }

    const [rows]: any = await db.execute(
      `SELECT
        c.*,
        u.avatar_url,
        u.role,
        u.is_verified
       FROM posts_comentarios c
       LEFT JOIN ativora_users u ON c.nickname = u.nickname
       WHERE c.post_id = ?
       ORDER BY c.created_at ASC`,
      [postId]
    );

    return NextResponse.json(rows || []);
  } catch (error: any) {
    console.error("ERRO AO LISTAR COMENTARIOS:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
