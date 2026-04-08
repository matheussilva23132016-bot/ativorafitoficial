import { NextResponse } from 'next/server';
import db from "../../../lib/db"; // CAMINHO RELATIVO

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const nickname = searchParams.get('nickname');

        let query = `SELECT * FROM posts ORDER BY criado_em DESC LIMIT 50`;
        let params: string[] = [];

        if (nickname) {
            query = `SELECT * FROM posts WHERE nickname = ? ORDER BY criado_em DESC`;
            params = [nickname];
        }

        const [rows] = await db.execute(query, params);
        return NextResponse.json(rows);
    } catch (_error: unknown) {
        return NextResponse.json({ error: "Erro ao buscar posts" }, { status: 500 });
    }
}