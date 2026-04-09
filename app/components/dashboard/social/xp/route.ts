import { NextResponse } from "next/server";
import db from "../../../../lib/db";

export async function POST(req: Request) {
  try {
    const { username, acao } = await req.json();

    // Tabela de valores de XP táticos
    const valoresXP: { [key: string]: number } = {
      'post_comum': 10,
      'post_video': 20,
      'novo_seguidor': 5,
      'treino_concluido': 50
    };

    const xpGanho = valoresXP[acao] || 0;

    await db.execute(
      "UPDATE usuarios SET xp = xp + ? WHERE username = ?",
      [xpGanho, username]
    );

    // Lógica para subir de nível: Nível = floor(sqrt(xp/10)) + 1
    await db.execute(
      "UPDATE usuarios SET nivel = FLOOR(SQRT(xp / 10)) + 1 WHERE username = ?",
      [username]
    );

    return NextResponse.json({ success: true, xp_ganho: xpGanho });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}