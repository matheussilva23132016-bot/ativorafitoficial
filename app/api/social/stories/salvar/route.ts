import { NextResponse } from "next/server";
import db from "../../../../../lib/db";

export async function POST(req: Request) {
  try {
    const { username, mediaUrl, mediaType } = await req.json();

    if (!username || !mediaUrl) {
      return NextResponse.json({ error: "Dados incompletos para sincronização." }, { status: 400 });
    }

    // 1. Registro na Tabela de Stories
    // O campo expira_em é calculado automaticamente pelo MySQL (se você usou o SQL que te passei)
    await db.execute(
      "INSERT INTO stories (usuario_nickname, media_url, media_type) VALUES (?, ?, ?)",
      [username, mediaUrl, mediaType || 'image']
    );

    // 2. Bonificação de XP (Gatilho de Engajamento)
    // Postar um story concede +5 XP ao atleta
    await db.execute(
      "UPDATE usuarios SET xp = xp + 5 WHERE nickname = ?",
      [username]
    );

    return NextResponse.json({ 
      success: true, 
      message: "STORY ATIVADO: Sincronização com a matriz concluída." 
    });
  } catch (error: any) {
    console.error("FALHA NO PROTOCOLO STORIES:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}