import { NextResponse } from "next/server";
import db from "../../../../lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const user = searchParams.get("username");

    if (!user) return NextResponse.json({ error: "Nickname ausente" }, { status: 400 });

    // Busca notificações não lidas e as mais recentes
    const [rows]: any = await db.execute(
      `SELECT * FROM notificacoes 
       WHERE destinatario_nickname = ? 
       ORDER BY lida ASC, created_at DESC 
       LIMIT 30`,
      [user]
    );

    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ROTA PARA MARCAR TUDO COMO LIDO
export async function PATCH(req: Request) {
  try {
    const { username } = await req.json();
    await db.execute(
      "UPDATE notificacoes SET lida = 1 WHERE destinatario_nickname = ?",
      [username]
    );
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}