import { NextResponse } from "next/server";
import db from "../../../../lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");

  try {
    // Busca atletas que eu não sigo, excluindo a mim mesmo
    // Prioriza Profissionais (Personal/Nutri) e depois por nível de XP
    const [rows]: any = await db.execute(
      `SELECT nickname as username, avatar_url as avatar, role, nivel 
       FROM usuarios 
       WHERE nickname != ? 
       AND nickname NOT IN (
         SELECT seguido_nickname FROM seguidores WHERE seguidor_nickname = ?
       )
       ORDER BY (CASE WHEN role != 'aluno' THEN 1 ELSE 0 END) DESC, xp DESC 
       LIMIT 10`,
      [username, username]
    );

    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}