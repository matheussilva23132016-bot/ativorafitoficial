import { NextResponse } from 'next/server';
import db from "@/app/lib/db"; 
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { username, content, mediaUrl, mediaType, role } = body;

        if (!username) return NextResponse.json({ error: "Usuário inválido." }, { status: 400 });

        // --- 1. VALIDAÇÃO ANTI-SPAM ---
        if (role === 'aluno') {
            const [recentPosts] = (await db.execute(
                `SELECT COUNT(*) as total FROM posts 
                 WHERE nickname = ? AND criado_em > DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
                [username]
            )) as [Array<{ total: number }>, unknown];

            if (recentPosts[0].total >= 5) {
                return NextResponse.json({ error: "Limite atingido! Descanse um pouco." }, { status: 429 });
            }
        }

        // --- 2. VALIDAÇÃO TÉCNICA ---
        const isPro = role === 'personal' || role === 'nutri';
        if (isPro && (!content || content.trim().length < 50)) {
            return NextResponse.json({ error: "Sua autoridade exige legendas técnicas (min. 50 caracteres)." }, { status: 400 });
        }

        let finalMediaUrl = null;

        // 3. Processamento de Mídia
        if (mediaUrl && typeof mediaUrl === 'string' && mediaUrl.includes('base64')) {
            const matches = mediaUrl.match(/^data:(.+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                const buffer = Buffer.from(matches[2], 'base64');
                let ext = '.jpg';
                if (matches[1].includes('video/mp4')) ext = '.mp4';
                const fileName = `post-${Date.now()}-${username.replace(/\s+/g, '_')}${ext}`;
                const uploadDir = path.join(process.cwd(), 'public/uploads/posts');
                if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
                fs.writeFileSync(path.join(uploadDir, fileName), buffer);
                finalMediaUrl = `/uploads/posts/${fileName}`;
            }
        }

        // --- 4. LÓGICA DE STREAK E XP ---
        const [userStats] = (await db.execute(
            `SELECT last_post_date, current_streak, longest_streak, xp FROM usuarios WHERE nickname = ?`,
            [username]
        )) as [Array<{ last_post_date: string | null, current_streak: number, longest_streak: number, xp: number }>, unknown];

        let newStreak = 1;
        let gainedXP = 15; // Ganho base por postagem

        if (userStats.length > 0) {
            const lastDate = userStats[0].last_post_date ? new Date(userStats[0].last_post_date) : null;
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (lastDate) {
                const diffDays = Math.ceil((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays === 1) newStreak = userStats[0].current_streak + 1;
                else if (diffDays === 0) {
                    newStreak = userStats[0].current_streak;
                    gainedXP = 5; // Segundo post no mesmo dia dá menos XP
                }
            }

            const newLongest = Math.max(newStreak, userStats[0].longest_streak);

            // ATUALIZAÇÃO NO BANCO: Streak + XP
            await db.execute(
                `UPDATE usuarios SET 
                 current_streak = ?, 
                 last_post_date = CURDATE(), 
                 longest_streak = ?, 
                 xp = xp + ? 
                 WHERE nickname = ?`,
                [newStreak, newLongest, gainedXP, username]
            );
        }

        // 5. Salva o Post
        await db.execute(
            `INSERT INTO posts (nickname, content, media_url, media_type, role) VALUES (?, ?, ?, ?, ?)`,
            [username, content || '', finalMediaUrl, mediaType || null, role || 'aluno']
        );

        return NextResponse.json({ success: true, streak: newStreak, xpGained: gainedXP }, { status: 201 });

    } catch (_error: unknown) {
        return NextResponse.json({ error: "Erro no núcleo." }, { status: 500 });
    }
}