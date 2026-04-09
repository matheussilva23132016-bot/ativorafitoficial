import { NextResponse } from "next/server";
import db from "../../../../lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username) return NextResponse.json({ error: "Nickname ausente." }, { status: 400 });

    // Busca usuários que estão com status 'pendente' para o usuário logado
    const [rows]: any = await db.execute(`
      SELECT 
        s.id, 
        u.nickname as username, 
        u.avatar_url 
      FROM seguidores s
      JOIN usuarios u ON s.follower_nickname = u.nickname
      WHERE s.following_nickname = ? AND s.status = 'pendente'
    `, [username]);

    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}