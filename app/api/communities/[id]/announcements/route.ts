import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { criarNotificacao } from "@/lib/communities/notifications";

// GET — Lista anúncios
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [rows] = await db.query(`
      SELECT ca.*, u.nickname, u.avatar_url
      FROM comunidade_anuncios ca
      LEFT JOIN usuarios u ON u.id = ca.autor_id
      WHERE ca.comunidade_id = ?
      ORDER BY ca.fixado DESC, ca.created_at DESC
      LIMIT 20
    `, [params.id]);

    return NextResponse.json({ announcements: rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST — Criar anúncio
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { autorId, titulo, conteudo, fixado } = await req.json();
    if (!autorId || !titulo || !conteudo) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
    }

    const id = `anuncio-${Date.now()}`;
    await db.query(`
      INSERT INTO comunidade_anuncios (id, comunidade_id, autor_id, titulo, conteudo, fixado)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, params.id, autorId, titulo, conteudo, fixado ? 1 : 0]);

    // Notifica todos os membros
    const [membros] = await db.query(`
      SELECT user_id FROM comunidade_membros
      WHERE comunidade_id = ? AND status = 'aprovado' AND user_id != ?
    `, [params.id, autorId]);

    for (const m of membros as any[]) {
      await criarNotificacao({
        userId:       m.user_id,
        comunidadeId: params.id,
        tipo:         "novo_anuncio",
        titulo:       `📢 ${titulo}`,
        mensagem:     conteudo.substring(0, 120),
        payload:      { anuncioId: id },
      });
    }

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
