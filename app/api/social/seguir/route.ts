import { NextResponse } from 'next/server';
import db from "@/app/lib/db";

export async function POST(req: Request) {
    try {
        const { seguidor, seguido } = await req.json();

        if (!seguidor || !seguido || seguidor === seguido) {
            return NextResponse.json({ error: "Operação inválida." }, { status: 400 });
        }

        // CORREÇÃO: Definindo a tipagem exata do que o MySQL retorna (Array de objetos com 'id')
        const [existing] = (await db.execute(
            `SELECT id FROM seguidores WHERE seguidor_nickname = ? AND seguido_nickname = ?`,
            [seguidor, seguido]
        )) as [Array<{ id: number }>, unknown];

        if (existing.length > 0) {
            // Já segue? Então vamos dar Unfollow
            await db.execute(
                `DELETE FROM seguidores WHERE seguidor_nickname = ? AND seguido_nickname = ?`,
                [seguidor, seguido]
            );
            return NextResponse.json({ success: true, following: false });
        } else {
            // Não segue? Então vamos dar Follow
            await db.execute(
                `INSERT INTO seguidores (seguidor_nickname, seguido_nickname) VALUES (?, ?)`,
                [seguidor, seguido]
            );
            return NextResponse.json({ success: true, following: true });
        }

    } catch (_error: unknown) {
        // CORREÇÃO: Adicionado o '_' antes de error para o ESLint saber que é proposital não usar a variável
        console.error("ERRO_SEGUIDORES:", _error);
        return NextResponse.json({ error: "Erro no servidor de conexões." }, { status: 500 });
    }
}