import { NextResponse } from 'next/server';
import db from "../../../lib/db";

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const nickname = searchParams.get('nickname');

        if (!id || !nickname) return NextResponse.json({ error: "Faltam dados" }, { status: 400 });

        // Só deleta se o ID do post e o Nickname do dono baterem (Segurança)
        await db.execute("DELETE FROM posts WHERE id = ? AND nickname = ?", [id, nickname]);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}