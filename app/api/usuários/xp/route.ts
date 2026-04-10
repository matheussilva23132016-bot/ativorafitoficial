import { NextResponse } from 'next/server';
import db from "@/lib/db";

export async function POST(req: Request) {
    try {
        const { nickname, amount } = await req.json();

        if (!nickname) return NextResponse.json({ error: "Nickname necessário" }, { status: 400 });

        // 1. Atualiza o XP acumulado
        await db.execute(
            "UPDATE usuarios SET xp = xp + ? WHERE nickname = ?",
            [amount, nickname]
        );

        // 2. Recalcula o Nível (1 nível a cada 500 XP)
        await db.execute(
          "UPDATE usuarios SET nivel = FLOOR(xp / 500) + 1 WHERE nickname = ?",
          [nickname]
        );

        // 3. Busca os valores atualizados para devolver ao Front-end
        const [rows]: any = await db.execute(
          "SELECT xp, nivel FROM usuarios WHERE nickname = ?", 
          [nickname]
        );

        return NextResponse.json({ 
          success: true, 
          newXP: rows[0].xp, 
          newNivel: rows[0].nivel 
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}