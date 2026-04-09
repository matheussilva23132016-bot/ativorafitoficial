import { NextResponse } from 'next/server';
import db from "../../../lib/db"; // CAMINHO RELATIVO

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const nickname = searchParams.get('nickname'); // Filtro de perfil específico
        const currentUser = searchParams.get('currentUser'); // Para checar se o post está salvo para VOCÊ
        
        // --- PROTOCOLO DE FLUXO INFINITO ---
        const page = parseInt(searchParams.get('page') || '1');
        const limit = 10; 
        const offset = (page - 1) * limit;

        // Query Base Tunada: Traz p.* (inclui media_url_before), streak do autor e check de bookmark
        let query = `
            SELECT 
                p.*, 
                u.avatar_url as avatar, 
                u.role, 
                u.is_verified,
                u.streak,
                (SELECT COUNT(*) FROM posts_salvos WHERE post_id = p.id AND usuario_nickname = ?) as is_saved
            FROM posts p 
            JOIN usuarios u ON p.nickname = u.nickname 
            ORDER BY p.criado_em DESC 
            LIMIT ? OFFSET ?
        `;
        let params: any[] = [currentUser || '', limit, offset];

        // Se estivermos filtrando pelo perfil de um atleta específico
        if (nickname) {
            query = `
                SELECT 
                    p.*, 
                    u.avatar_url as avatar, 
                    u.role, 
                    u.is_verified,
                    u.streak,
                    (SELECT COUNT(*) FROM posts_salvos WHERE post_id = p.id AND usuario_nickname = ?) as is_saved
                FROM posts p 
                JOIN usuarios u ON p.nickname = u.nickname 
                WHERE p.nickname = ? 
                ORDER BY p.criado_em DESC 
                LIMIT ? OFFSET ?
            `;
            params = [currentUser || '', nickname, limit, offset];
        }

        const [rows] = await db.execute(query, params);
        return NextResponse.json(rows);
    } catch (_error: unknown) {
        console.error("ERRO NA MATRIZ DE LISTAGEM:", _error);
        return NextResponse.json({ error: "Erro ao buscar posts" }, { status: 500 });
    }
}