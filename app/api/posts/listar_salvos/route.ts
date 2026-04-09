import { NextResponse } from "next/server";
import db from "../../../../lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const nickname = searchParams.get("nickname");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 10;
    const offset = (page - 1) * limit;

    if (!nickname) {
      return NextResponse.json({ error: "Nickname não identificado." }, { status: 400 });
    }

    // Busca posts originais através da tabela de junção posts_salvos
    const [rows]: any = await db.execute(`
      SELECT 
        p.*, 
        u.avatar_url as avatar, 
        u.role, 
        u.is_verified,
        1 as is_saved -- Força como true pois estamos na aba de salvos
      FROM posts p
      JOIN posts_salvos s ON p.id = s.post_id
      JOIN usuarios u ON p.nickname = u.nickname
      WHERE s.usuario_nickname = ?
      ORDER BY s.salvo_em DESC
      LIMIT ? OFFSET ?
    `, [nickname, limit, offset]);

    return NextResponse.json(rows);
  } catch (error: any) {
    console.error("ERRO AO RECUPERAR SALVOS:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}