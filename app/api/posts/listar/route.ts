import { NextResponse } from 'next/server';
import db from "../../../lib/db"; 

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const nicknameParam = searchParams.get('nickname'); 
        const currentUser = searchParams.get('currentUser') || '';
        
        const page = parseInt(searchParams.get('page') || '1');
        const limit = 10; 
        const offset = (page - 1) * limit;

        // AQUI ESTÁ A CORREÇÃO: u.foto_url as avatar
        let query = `
            SELECT 
                p.*, 
                u.foto_url as avatar, 
                u.role, 
                u.is_verified,
                u.streak,
                (SELECT COUNT(*) FROM posts_salvos WHERE post_id = p.id AND usuario_nickname = ?) as is_saved
            FROM posts p 
            LEFT JOIN usuarios u ON p.nickname = u.nickname 
        `;

        const params: any[] = [currentUser];

        if (nicknameParam) {
            query += ` WHERE p.nickname = ? `;
            params.push(nicknameParam);
        }

        query += ` ORDER BY p.id DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const [rows]: any = await db.execute(query, params);
        
        return NextResponse.json(rows || []);

    } catch (error: any) {
        console.error("❌ ERRO NA LISTAGEM:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}