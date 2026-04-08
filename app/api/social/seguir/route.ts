import { NextResponse } from "next/server";
import db from "../../../../lib/db"; // CAMINHO RELATIVO BLINDADO (4 níveis)

export async function POST(req: Request) {
  try {
    const { followerNickname, followingNickname } = await req.json();

    if (!followerNickname || !followingNickname) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    // Lógica para seguir (Exemplo simples)
    await db.execute(
      "INSERT IGNORE INTO seguidores (seguidor_nickname, seguido_nickname) VALUES (?, ?)",
      [followerNickname, followingNickname]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao processar conexão social" }, { status: 500 });
  }
}