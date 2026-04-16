import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { criarNotificacao } from "@/lib/communities/notifications";
import { ensureCommunityPermission, statusFromCommunityError } from "@/lib/communities/access";

// GET — Lista desafios ativos
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = await params;
  const paramsId = resolvedParams.id;
  const userId = req.nextUrl.searchParams.get("userId");

  try {
    const [desafios] = await db.query(`
      SELECT d.*,
        ed.id        AS entrega_id,
        ed.status    AS entrega_status,
        ed.conteudo  AS entrega_conteudo,
        ed.arquivo_url AS entrega_arquivo_url,
        ed.xp_aplicado,
        ed.tentativa
      FROM desafios d
      LEFT JOIN entregas_desafios ed
        ON ed.id = (
          SELECT ed2.id
          FROM entregas_desafios ed2
          WHERE ed2.desafio_id = d.id AND ed2.user_id = ?
          ORDER BY ed2.tentativa DESC, ed2.created_at DESC
          LIMIT 1
        )
      WHERE d.comunidade_id = ? AND d.status = 'ativo'
      ORDER BY d.created_at DESC
    `, [userId ?? null, paramsId]);

    return NextResponse.json({ desafios });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST — Criar desafio (ADM/Dono)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = await params;
  const paramsId = resolvedParams.id;
  try {
    const { titulo, descricao, instrucoes, tipo_envio, xp_recompensa,
            dia_semana, prazo, criado_por, criterio_avaliacao, aprovador_responsavel } = await req.json();

    await ensureCommunityPermission(paramsId, criado_por, "desafio:create");

    const desafioId = `des-${Date.now()}`;
    
    let instrucoesFinais = instrucoes ?? "";
    if (criterio_avaliacao) instrucoesFinais += `\n\n🎯 Critério de Avaliação: ${criterio_avaliacao}`;
    if (aprovador_responsavel) instrucoesFinais += `\n\n🛡️ Aprovador Responsável: ${aprovador_responsavel}`;

    await db.query(`
      INSERT INTO desafios 
        (id, comunidade_id, criado_por, titulo, descricao, instrucoes,
         tipo_envio, xp_recompensa, dia_semana, prazo, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ativo')
    `, [desafioId, paramsId, criado_por, titulo, descricao,
        instrucoesFinais.trim() || null, tipo_envio ?? "check",
        xp_recompensa ?? 10, dia_semana ?? "Livre", prazo ?? null]);

    // Notifica todos os membros
    const [membros] = await db.query(`
      SELECT user_id FROM comunidade_membros 
      WHERE comunidade_id = ? AND status = 'aprovado'
    `, [paramsId]);

    for (const m of membros as any[]) {
      await criarNotificacao({
        userId:       m.user_id,
        comunidadeId: paramsId,
        tipo:         "novo_desafio",
        titulo:       "Novo Desafio do Dia 🎯",
        mensagem:     titulo,
        payload:      { desafioId },
      });
    }

    return NextResponse.json({ success: true, desafioId });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: statusFromCommunityError(err) },
    );
  }
}
