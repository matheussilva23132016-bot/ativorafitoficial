import { NextResponse } from "next/server";
import db from "../../../../../lib/db";

export async function POST(req: Request) {
  try {
    const { postId, nickname, opcao } = await req.json(); // opcao: 1 ou 2

    // 1. Registra o voto (UNIQUE KEY impede voto duplo)
    await db.execute(
      "INSERT INTO enquetes_votos (post_id, usuario_nickname, opcao) VALUES (?, ?, ?)",
      [postId, nickname, opcao]
    );

    // 2. Recompensa o engajamento (+5 XP por participar da comunidade)
    await db.execute(
      "UPDATE usuarios SET xp = xp + 5 WHERE nickname = ?",
      [nickname]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: "Voto já registrado." }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}