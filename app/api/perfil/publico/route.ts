import { NextResponse } from "next/server";
import db from "../../../../lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const targetNickname = searchParams.get("nickname");
  const myNickname = searchParams.get("viewer"); // Para saber se eu já sigo ele

  try {
    // 1. Busca dados básicos do atleta
    const [userRows]: any = await db.execute(
      `SELECT nickname as username, bio, description, avatar_url as avatar, role, is_verified, xp, nivel, conta_privada 
       FROM usuarios WHERE nickname = ? LIMIT 1`,
      [targetNickname]
    );

    if (userRows.length === 0) return NextResponse.json({ error: "Atleta não localizado" }, { status: 404 });

    const profile = userRows[0];

    // 2. Verifica se o visualizador já segue este perfil
    const [followRows]: any = await db.execute(
      "SELECT status FROM seguidores WHERE seguidor_nickname = ? AND seguido_nickname = ?",
      [myNickname, targetNickname]
    );

    return NextResponse.json({
      ...profile,
      followingStatus: followRows.length > 0 ? followRows[0].status : null
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}