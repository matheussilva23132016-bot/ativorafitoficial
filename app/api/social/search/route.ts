import { NextResponse } from 'next/server';
import { db } from "../../../../lib/db";
import { isGenericSocialPost, isGenericSocialTag, isGenericSocialUser } from "@/lib/socialFilters";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q');
        const type = searchParams.get('type') || 'posts';

        if (!query || query.length < 2) {
            return NextResponse.json([]);
        }

        const searchTerm = `%${query}%`;
        let results: any = [];

        if (type === 'all') {
            const [[users], [posts], [tagRows]]: any = await Promise.all([
                db.execute(`
                    SELECT nickname as username, full_name, avatar_url as avatar, role, is_verified, nivel_int as nivel,
                    (SELECT COUNT(*) FROM seguidores WHERE seguido_nickname = ativora_users.nickname) as followers
                    FROM ativora_users WHERE nickname LIKE ? OR full_name LIKE ? LIMIT 5
                `, [searchTerm, searchTerm]),
                db.execute(`
                    SELECT p.*, u.avatar_url as avatar, u.role, u.is_verified
                    FROM posts p LEFT JOIN ativora_users u ON p.nickname = u.nickname
                    WHERE p.content LIKE ? ORDER BY p.id DESC LIMIT 5
                `, [searchTerm]),
                db.execute(`
                    SELECT DISTINCT hashtags FROM posts WHERE hashtags LIKE ? LIMIT 10
                `, [searchTerm])
            ]);

            const allTags = new Set<string>();
            tagRows.forEach((r: any) => {
                const tags = r.hashtags?.includes('[') ? JSON.parse(r.hashtags || "[]") : (r.hashtags || "").split(',').map((s: string) => s.trim());
                tags.forEach((t: string) => {
                    if (t.toLowerCase().includes(query.toLowerCase()) && !isGenericSocialTag(t)) allTags.add(t);
                });
            });

            results = {
                users: (users || []).filter((user: any) => !isGenericSocialUser(user)),
                posts: (posts || []).filter((post: any) => !isGenericSocialPost(post)),
                tags: Array.from(allTags).map(t => ({ tag: t, posts: 1 }))
            };
        } else if (type === 'users') {
            const [rows]: any = await db.execute(`
                SELECT 
                    nickname as username, 
                    full_name, 
                    avatar_url as avatar, 
                    role, 
                    is_verified, 
                    nivel_int as nivel,
                    (SELECT COUNT(*) FROM seguidores WHERE seguido_nickname = ativora_users.nickname) as followers
                FROM ativora_users 
                WHERE nickname LIKE ? OR full_name LIKE ?
                LIMIT 15
            `, [searchTerm, searchTerm]);
            results = (rows || []).filter((row: any) => !isGenericSocialUser(row));
        } else if (type === 'posts') {
            const [rows]: any = await db.execute(`
                SELECT 
                    p.*, 
                    u.avatar_url as avatar, 
                    u.role, 
                    u.is_verified
                FROM posts p
                LEFT JOIN ativora_users u ON p.nickname = u.nickname
                WHERE p.content LIKE ?
                ORDER BY p.id DESC
                LIMIT 15
            `, [searchTerm]);
            results = (rows || []).filter((row: any) => !isGenericSocialPost(row));
        } else if (type === 'tags') {
            // Simples busca de tags em posts (ajustável para tabela específica de tags se houver)
            const [rows]: any = await db.execute(`
                SELECT DISTINCT hashtags 
                FROM posts 
                WHERE hashtags LIKE ?
                LIMIT 20
            `, [searchTerm]);
            
            // Unificar e contar (lógica simplificada para tags que estão em JSON/String no banco)
            const allTags = new Set<string>();
            rows.forEach((r: any) => {
                try {
                    const tags = JSON.parse(r.hashtags || "[]");
                    tags.forEach((t: string) => {
                        if (t.toLowerCase().includes(query.toLowerCase()) && !isGenericSocialTag(t)) allTags.add(t);
                    });
                } catch {
                    // Se não for JSON, tenta split comum se for CSV
                    const tags = (r.hashtags || "").split(',').map((s: string) => s.trim());
                    tags.forEach((t: string) => {
                        if (t.toLowerCase().includes(query.toLowerCase()) && !isGenericSocialTag(t)) allTags.add(t);
                    });
                }
            });
            results = Array.from(allTags).map(t => ({ tag: t, posts: 1, trend: 'stable' }));
        }

        return NextResponse.json(results);

    } catch (error: any) {
        console.error("❌ ERRO NA BUSCA:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
