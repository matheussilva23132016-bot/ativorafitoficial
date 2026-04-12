import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET — Lista membros aprovados com tags
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [rows] = await db.query(`
      SELECT 
        cm.id AS membro_id,
        cm.user_id,
        cm.joined_at,
        u.nickname,
        u.full_name,
        u.avatar_url,
        GROUP_CONCAT(ct.nome ORDER BY ct.nivel_poder DESC SEPARATOR ',') AS tags
      FROM comunidade_membros cm
      LEFT JOIN usuarios u ON u.id = cm.user_id
      LEFT JOIN comunidade_membro_tags cmt ON cmt.membro_id = cm.id
      LEFT JOIN comunidade_tags ct ON ct.id = cmt.tag_id
      WHERE cm.comunidade_id = ? AND cm.status = 'aprovado'
      GROUP BY cm.id
      ORDER BY MAX(ct.nivel_poder) DESC, cm.joined_at ASC
    `, [params.id]);

    const members = (rows as any[]).map(r => ({
      ...r,
      tags: r.tags ? r.tags.split(",") : ["Participante"],
      role: r.tags ? r.tags.split(",")[0] : "Participante",
    }));

    return NextResponse.json({ members });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH — Atribuir/remover tag de membro
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { membroId, tagNome, acao, requesterId } = await req.json();
    // acao: "add" | "remove"

    // Verifica permissão (ADM ou Dono)
    const [permCheck] = await db.query(`
      SELECT cm.id FROM comunidade_membros cm
      INNER JOIN comunidade_membro_tags cmt ON cmt.membro_id = cm.id
      INNER JOIN comunidade_tags ct ON ct.id = cmt.tag_id
      WHERE cm.comunidade_id = ? AND cm.user_id = ? 
        AND ct.nome IN ('ADM','Dono') AND cm.status = 'aprovado'
    `, [params.id, requesterId]);

    if (!(permCheck as any[]).length) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    // Busca a tag pelo nome
    const [tagRows] = await db.query(`
      SELECT id, nivel_poder FROM comunidade_tags 
      WHERE comunidade_id = ? AND nome = ?
    `, [params.id, tagNome]);

    const tag = (tagRows as any[])[0];
    if (!tag) return NextResponse.json({ error: "Tag não encontrada" }, { status: 404 });

    // ADM não pode atribuir tag Dono
    const [requesterTagRows] = await db.query(`
      SELECT MAX(ct.nivel_poder) AS max_poder
      FROM comunidade_membros cm
      INNER JOIN comunidade_membro_tags cmt ON cmt.membro_id = cm.id
      INNER JOIN comunidade_tags ct ON ct.id = cmt.tag_id
      WHERE cm.comunidade_id = ? AND cm.user_id = ?
    `, [params.id, requesterId]);

    const requesterPower = (requesterTagRows as any[])[0]?.max_poder ?? 1;
    if (tag.nivel_poder >= requesterPower) {
      return NextResponse.json({ error: "Não pode atribuir tag de nível igual ou superior ao seu" }, { status: 403 });
    }

    if (acao === "add") {
      const mtId = `mt-${Date.now()}`;
      await db.query(`
        INSERT IGNORE INTO comunidade_membro_tags (id, membro_id, tag_id, atribuido_por)
        VALUES (?, ?, ?, ?)
      `, [mtId, membroId, tag.id, requesterId]);
    } else {
      await db.query(`
        DELETE FROM comunidade_membro_tags 
        WHERE membro_id = ? AND tag_id = ?
      `, [membroId, tag.id]);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE — Remover membro
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { membroId, requesterId, motivo } = await req.json();

    const [permCheck] = await db.query(`
      SELECT cm.id FROM comunidade_membros cm
      INNER JOIN comunidade_membro_tags cmt ON cmt.membro_id = cm.id
      INNER JOIN comunidade_tags ct ON ct.id = cmt.tag_id
      WHERE cm.comunidade_id = ? AND cm.user_id = ?
        AND ct.nome IN ('ADM','Dono') AND cm.status = 'aprovado'
    `, [params.id, requesterId]);

    if (!(permCheck as any[]).length) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    await db.query(`
      UPDATE comunidade_membros SET status = 'removido' WHERE id = ?
    `, [membroId]);

    await db.query(`
      UPDATE comunidades 
      SET total_membros = (
        SELECT COUNT(*) FROM comunidade_membros 
        WHERE comunidade_id = ? AND status = 'aprovado'
      ) WHERE id = ?
    `, [params.id, params.id]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
