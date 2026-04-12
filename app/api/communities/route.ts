import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/communities?userId=xxx
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId obrigatório" }, { status: 400 });

  try {
    const [rows] = await db.query(`
      SELECT 
        c.*,
        cm.status   AS member_status,
        cm.id       AS membro_id,
        GROUP_CONCAT(DISTINCT ct.nome ORDER BY ct.nivel_poder DESC SEPARATOR ',') AS tags
      FROM comunidades c
      LEFT JOIN comunidade_membros cm 
        ON cm.comunidade_id = c.id AND cm.user_id = ?
      LEFT JOIN comunidade_membro_tags cmt 
        ON cmt.membro_id = cm.id
      LEFT JOIN comunidade_tags ct 
        ON ct.id = cmt.tag_id
      WHERE c.status = 'ativa'
        AND (c.privacidade = 'public' OR cm.status = 'aprovado')
      GROUP BY c.id
      ORDER BY cm.status = 'aprovado' DESC, c.created_at DESC
    `, [userId]);

    const communities = (rows as any[]).map(r => ({
      ...r,
      isMember: r.member_status === "aprovado",
      userTags: r.tags ? r.tags.split(",") : ["Participante"],
    }));

    return NextResponse.json({ communities });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/communities — Criar comunidade
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, description, cover_url, theme, focus, privacy, owner_id } = body;

    if (!name || !owner_id) {
      return NextResponse.json({ error: "name e owner_id obrigatórios" }, { status: 400 });
    }

    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
      // 1. Cria a comunidade
      await conn.query(`
        INSERT INTO comunidades (id, nome, descricao, cover_url, tema, foco, privacidade, owner_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [id, name, description, cover_url, theme ?? "sky", focus ?? "Todas", privacy ?? "public", owner_id]);

      // 2. Cria tags padrão da comunidade
      const tagsDefault = [
        { nome: "Participante", cor: "sky",    nivel: 1 },
        { nome: "Instrutor",    cor: "emerald", nivel: 2 },
        { nome: "Nutri",        cor: "green",  nivel: 3 },
        { nome: "ADM",          cor: "purple", nivel: 4 },
        { nome: "Dono",         cor: "amber",  nivel: 5 },
      ];
      for (const tag of tagsDefault) {
        const tagId = `tag-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        await conn.query(`
          INSERT INTO comunidade_tags (id, comunidade_id, nome, cor, nivel_poder)
          VALUES (?, ?, ?, ?, ?)
        `, [tagId, id, tag.nome, tag.cor, tag.nivel]);
      }

      // 3. Adiciona o criador como membro aprovado com tag Dono
      const membroId = `mb-${Date.now()}`;
      await conn.query(`
        INSERT INTO comunidade_membros (id, comunidade_id, user_id, status, joined_at)
        VALUES (?, ?, ?, 'aprovado', NOW())
      `, [membroId, id, owner_id]);

      // 4. Busca tag Dono para atribuir
      const [tagRows] = await conn.query(`
        SELECT id FROM comunidade_tags 
        WHERE comunidade_id = ? AND nome = 'Dono' LIMIT 1
      `, [id]);
      const donoTagId = (tagRows as any[])[0]?.id;

      if (donoTagId) {
        const mtId = `mt-${Date.now()}`;
        await conn.query(`
          INSERT INTO comunidade_membro_tags (id, membro_id, tag_id, atribuido_por)
          VALUES (?, ?, ?, ?)
        `, [mtId, membroId, donoTagId, owner_id]);
      }

      // 5. Atualiza contador
      await conn.query(`
        UPDATE comunidades SET total_membros = 1 WHERE id = ?
      `, [id]);

      await conn.commit();
      conn.release();

      return NextResponse.json({ success: true, communityId: id });
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw err;
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
