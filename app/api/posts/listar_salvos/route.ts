import { NextResponse } from "next/server";
import db from "../../../../lib/db";
import { isGenericSocialPost } from "@/lib/socialFilters";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const nickname = searchParams.get("nickname");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 10;
    const offset = (page - 1) * limit;

    if (!nickname) {
      return NextResponse.json({ error: "Nickname não identificado." }, { status: 400 });
    }

    // Busca posts originais através da tabela de junção posts_salvos.
    const [rows]: any = await db.execute(`
      SELECT 
        p.*, 
        u.avatar_url as avatar, 
        u.role, 
        u.is_verified,
        u.current_streak as streak,
        u.xp_score as xp,
        COALESCE((SELECT COUNT(*) FROM curtidas c2 WHERE c2.post_id = p.id), p.likes, 0) as likes,
        1 as is_saved,
        (SELECT COUNT(*) FROM curtidas c WHERE c.post_id = p.id AND c.usuario_nickname = ?) > 0 as hasLiked,
        (SELECT ev.opcao FROM enquetes_votos ev WHERE ev.post_id = p.id AND ev.usuario_nickname = ? LIMIT 1) as enquete_voto_usuario,
        (SELECT COUNT(*) FROM enquetes_votos ev1 WHERE ev1.post_id = p.id AND ev1.opcao = 1) as enquete_op1_votos,
        (SELECT COUNT(*) FROM enquetes_votos ev2 WHERE ev2.post_id = p.id AND ev2.opcao = 2) as enquete_op2_votos,
        TIMESTAMPDIFF(MINUTE, p.criado_em, NOW()) as minutes_ago,
        COALESCE(p.comentarios_count, (SELECT COUNT(*) FROM posts_comentarios WHERE post_id = p.id)) as comentarios_count
      FROM posts p
      JOIN posts_salvos s ON p.id = s.post_id
      LEFT JOIN ativora_users u ON p.nickname = u.nickname
      WHERE s.usuario_nickname = ?
      ORDER BY s.salvo_em DESC
      LIMIT ? OFFSET ?
    `, [nickname, nickname, nickname, limit, offset]);

    return NextResponse.json((rows || []).filter((row: any) => !isGenericSocialPost(row)));
  } catch (error: any) {
    console.error("ERRO AO RECUPERAR SALVOS:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
