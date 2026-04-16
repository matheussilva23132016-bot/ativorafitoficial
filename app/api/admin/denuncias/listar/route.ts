import { NextResponse } from "next/server";
import db from "../../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const currentUser = searchParams.get("currentUser") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 10;
    const offset = (page - 1) * limit;

    // PROTOCOLO DE PRIVACIDADE:
    // Mostra o post se:
    // 1. O perfil do autor é público (is_private = 0)
    // 2. OU o post é do próprio usuário logado
    // 3. OU o usuário logado segue o autor do post privado
    const [rows]: any = await db.execute(`
      SELECT 
        p.*, 
        u.avatar_url as avatar, 
        u.role, 
        u.is_verified,
        u.is_private
      FROM posts p
      JOIN usuarios u ON p.nickname = u.nickname
      WHERE u.is_private = 0 
         OR p.nickname = ?
         OR p.nickname IN (SELECT following_nickname FROM seguidores WHERE follower_nickname = ?)
      ORDER BY p.criado_em DESC
      LIMIT ? OFFSET ?
    `, [currentUser, currentUser, limit, offset]);

    return NextResponse.json(rows);
  } catch (error: any) {
    console.error("ERRO NA FILTRAGEM DE PRIVACIDADE:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
