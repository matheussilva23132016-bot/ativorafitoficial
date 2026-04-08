import { NextResponse } from 'next/server';
import db from "@/app/lib/db";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const nickname = searchParams.get('nickname');

        let query = `SELECT * FROM posts ORDER BY criado_em DESC`;
        // CORREÇÃO: Tipagem estrita para evitar o 'any'
        let params: (string | number | null)[] = [];

        if (nickname) {
            query = `SELECT * FROM posts WHERE nickname = ? ORDER BY criado_em DESC`;
            params = [nickname];
        }

        const [rows] = await db.execute(query, params);
        return NextResponse.json(rows);

    } catch (_error: unknown) { 
        // CORREÇÃO: Adicionado o prefixo '_' para indicar variável não utilizada
        return NextResponse.json({ error: "Erro ao carregar posts" }, { status: 500 });
    }
}