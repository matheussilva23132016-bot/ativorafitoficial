import { NextResponse } from "next/server";
import db from "../../../../lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json({ error: "Nickname necessário." }, { status: 400 });
    }

    // Busca todas as medalhas que o atleta já conquistou
    const [rows]: any = await db.execute(
      "SELECT id, tipo_badge, conquistado_em FROM conquistas WHERE usuario_nickname = ? ORDER BY conquistado_em DESC",
      [username]
    );

    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}