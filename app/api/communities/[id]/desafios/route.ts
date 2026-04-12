import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { criarNotificacao } from "@/lib/communities/notifications";

// GET — Lista desafios ativos
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = req.nextUrl.searchParams.get("userId");

  try {
    const [desafios] = await db.query(`
      SELECT d.*,
        ed.id        AS entrega_id,
        ed.status    AS entrega_status,
        ed.xp_aplicado,
        ed.tentativa
      FROM desafios d
      LEFT JOIN entregas_desafios ed 
        ON ed.desafio_id = d.id AND ed.user_id = ?
      WHERE d.comunidade_id = ? AND d.status = 'ativo'
      ORDER BY d.created_at DESC
    `, [userId ?? null, params.id]);

    return NextResponse.json({ desafios });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST — Criar desafio (ADM/Dono)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { titulo, descricao, instrucoes, tipo_envio, xp_recompensa,
            dia_semana, prazo, criado_por } = await req.json();

    const desafioId = `des-${Date.now()}`;

    await db.query(`
      INSERT INTO desafios 
        (id, comunidade_id, criado_por, titulo, descricao, instrucoes,
         tipo_envio, xp_recompensa, dia_semana, prazo, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ativo')
    `, [desafioId, params.id, criado_por, titulo, descricao,
        instrucoes ?? null, tipo_envio ?? "check",
        xp_recompensa ?? 10, dia_semana ?? "Livre", prazo ?? null]);

    // Notifica todos os membros
    const [membros] = await db.query(`
      SELECT user_id FROM comunidade_membros 
      WHERE comunidade_id = ? AND status = 'aprovado'
    `, [params.id]);

    for (const m of membros as any[]) {
      await criarNotificacao({
        userId:       m.user_id,
        comunidadeId: params.id,
        tipo:         "novo_desafio",
        titulo:       "Novo Desafio do Dia 🎯",
        mensagem:     titulo,
        payload:      { desafioId },
      });
    }

    return NextResponse.json({ success: true, desafioId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
