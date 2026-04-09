import { NextResponse } from "next/server";
import db from "../../../../lib/db";

export async function POST(req: Request) {
  try {
    const { nickname } = await req.json();

    // 1. Busca dados do atleta
    const [user]: any = await db.execute(
      "SELECT xp, streak, (SELECT COUNT(*) FROM posts WHERE nickname = ?) as total_posts FROM usuarios WHERE nickname = ?",
      [nickname, nickname]
    );

    const stats = user[0];
    const badgesParaEntregar = [];

    // 2. Regras de Negócio para Medalhas
    if (stats.total_posts >= 1) badgesParaEntregar.push('pioneiro'); // Primeiro post
    if (stats.total_posts >= 50) badgesParaEntregar.push('viciado'); // 50 posts
    if (stats.streak >= 7) badgesParaEntregar.push('constante'); // 1 semana de fogo
    if (stats.xp >= 1000) badgesParaEntregar.push('monstro'); // 1000 de XP

    // 3. Grava no banco apenas as novas
    for (const badge of badgesParaEntregar) {
      await db.execute(
        "INSERT IGNORE INTO conquistas (usuario_nickname, tipo_badge) VALUES (?, ?)",
        [nickname, badge]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}