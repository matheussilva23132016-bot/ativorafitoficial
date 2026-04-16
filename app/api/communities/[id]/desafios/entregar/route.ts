import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { criarNotificacao } from "@/lib/communities/notifications";
import { verificarESelos } from "@/lib/communities/ranking";
import { ensureCommunityPermission, statusFromCommunityError } from "@/lib/communities/access";

async function optionalQuery(sql: string, params: any[]) {
  try {
    await db.query(sql, params);
  } catch (err: any) {
    if (err?.code !== "ER_NO_SUCH_TABLE" && err?.code !== "ER_BAD_FIELD_ERROR") {
      console.error("[COMMUNITIES_OPTIONAL_QUERY]", err);
    }
  }
}

// POST — Enviar entrega
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = await params;
  const paramsId = resolvedParams.id;
  try {
    const { desafioId, userId, conteudo, arquivo_url } = await req.json();
    await ensureCommunityPermission(paramsId, userId, "desafio:submit");

    // Verifica se já tem entrega pendente/em análise
    const [existing] = await db.query(`
      SELECT id, tentativa, status FROM entregas_desafios
      WHERE desafio_id = ? AND user_id = ?
      ORDER BY tentativa DESC LIMIT 1
    `, [desafioId, userId]);

    const ex      = (existing as any[])[0];
    if (ex && ["em_analise", "aprovado"].includes(ex.status)) {
      return NextResponse.json(
        { error: "Esta entrega ja esta em analise ou aprovada." },
        { status: 409 },
      );
    }

    const tentativa = ex ? ex.tentativa + 1 : 1;

    const entregaId = `ent-${Date.now()}`;
    await db.query(`
      INSERT INTO entregas_desafios 
        (id, desafio_id, user_id, conteudo, arquivo_url, status, tentativa)
      VALUES (?, ?, ?, ?, ?, 'em_analise', ?)
    `, [entregaId, desafioId, userId, conteudo ?? null, arquivo_url ?? null, tentativa]);

    if (arquivo_url) {
      await optionalQuery(
        `
          INSERT INTO desafio_entrega_arquivos
            (id, entrega_id, arquivo_url)
          VALUES (UUID(), ?, ?)
        `,
        [entregaId, arquivo_url],
      );
    }

    // Notifica ADMs
    const [admins] = await db.query(`
      SELECT cm.user_id FROM comunidade_membros cm
      INNER JOIN comunidade_membro_tags cmt ON cmt.membro_id = cm.id
      INNER JOIN comunidade_tags ct ON ct.id = cmt.tag_id
      WHERE cm.comunidade_id = ? AND ct.nome IN ('ADM','Dono') AND cm.status = 'aprovado'
    `, [paramsId]);

    for (const admin of admins as any[]) {
      await criarNotificacao({
        userId:       admin.user_id,
        comunidadeId: paramsId,
        tipo:         "entrega_desafio",
        titulo:       "Nova Entrega para Avaliar",
        mensagem:     `Tentativa ${tentativa} — aguardando avaliação.`,
        payload:      { entregaId, desafioId, userId },
      });
    }

    return NextResponse.json({ success: true, entregaId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: statusFromCommunityError(err) });
  }
}

// PATCH — Avaliar entrega (ADM/Dono)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = await params;
  const paramsId = resolvedParams.id;
  try {
    const { entregaId, acao, comentario, avaliado_por } = await req.json();
    // acao: "aprovar" | "reprovar" | "reenvio"

    await ensureCommunityPermission(paramsId, avaliado_por, "desafio:evaluate");

    const [entRows] = await db.query(`
      SELECT ed.*, d.xp_recompensa, d.titulo
      FROM entregas_desafios ed
      INNER JOIN desafios d ON d.id = ed.desafio_id
      WHERE ed.id = ?
    `, [entregaId]);

    const entrega = (entRows as any[])[0];
    if (!entrega) return NextResponse.json({ error: "Entrega não encontrada" }, { status: 404 });

    const novoStatus = acao === "aprovar" ? "aprovado" : acao === "reprovar" ? "reprovado" : "reenvio";
    const xpAplicado = acao === "aprovar" ? entrega.xp_recompensa : 0;

    await db.query(`
      UPDATE entregas_desafios 
      SET status = ?, avaliado_por = ?, comentario = ?, xp_aplicado = ?
      WHERE id = ?
    `, [novoStatus, avaliado_por, comentario ?? null, xpAplicado, entregaId]);

    if (acao === "aprovar") {
      // Atualiza ranking semanal
      const { inicio, fim } = getSemanaAtual();
      await db.query(`
        INSERT INTO ranking_semanal 
          (id, comunidade_id, user_id, semana_inicio, semana_fim, xp_total, desafios_ok, desafios_total)
        VALUES (UUID(), ?, ?, ?, ?, ?, 1, 1)
        ON DUPLICATE KEY UPDATE
          xp_total       = xp_total + ?,
          desafios_ok    = desafios_ok + 1,
          desafios_total = desafios_total + 1
      `, [paramsId, entrega.user_id,
          inicio.toISOString().split("T")[0],
          fim.toISOString().split("T")[0],
          xpAplicado, xpAplicado]);

      await optionalQuery(
        `
          UPDATE ranking_semanal
          SET ultima_aprovacao_em = NOW()
          WHERE comunidade_id = ? AND user_id = ? AND semana_inicio = ?
        `,
        [paramsId, entrega.user_id, inicio.toISOString().split("T")[0]],
      );

      // Verifica selos
      await verificarESelos(entrega.user_id, paramsId);
    } else if (acao === "reprovar") {
      const { inicio, fim } = getSemanaAtual();
      await optionalQuery(
        `
          INSERT INTO ranking_semanal
            (id, comunidade_id, user_id, semana_inicio, semana_fim, xp_total, desafios_ok, desafios_total, reprovacoes)
          VALUES (UUID(), ?, ?, ?, ?, 0, 0, 1, 1)
          ON DUPLICATE KEY UPDATE
            desafios_total = desafios_total + 1,
            reprovacoes = reprovacoes + 1
        `,
        [
          paramsId,
          entrega.user_id,
          inicio.toISOString().split("T")[0],
          fim.toISOString().split("T")[0],
        ],
      );
    }

    await optionalQuery(
      `
        INSERT INTO desafio_entrega_eventos
          (id, entrega_id, status_anterior, status_novo, comentario, realizado_por, xp_aplicado)
        VALUES (UUID(), ?, ?, ?, ?, ?, ?)
      `,
      [
        entregaId,
        entrega.status ?? null,
        novoStatus,
        comentario ?? null,
        avaliado_por,
        xpAplicado,
      ],
    );

    // Notifica o aluno
    const mensagens: Record<string, string> = {
      aprovar:  `Seu desafio "${entrega.titulo}" foi aprovado! +${xpAplicado} XP 🎉`,
      reprovar: `Seu desafio "${entrega.titulo}" foi reprovado. ${comentario ?? ""}`,
      reenvio:  `Seu desafio "${entrega.titulo}" precisa ser reenviado. ${comentario ?? ""}`,
    };

    await criarNotificacao({
      userId:       entrega.user_id,
      comunidadeId: paramsId,
      tipo:         `desafio_${acao}`,
      titulo:       acao === "aprovar" ? "Desafio Aprovado! ✅" : acao === "reprovar" ? "Desafio Reprovado" : "Reenvio Necessário",
      mensagem:     mensagens[acao],
      payload:      { entregaId, xpAplicado },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: statusFromCommunityError(err) },
    );
  }
}

function getSemanaAtual() {
  const hoje = new Date();
  const dia  = hoje.getDay();
  const diff = dia === 0 ? 6 : dia - 1;
  const inicio = new Date(hoje);
  inicio.setDate(hoje.getDate() - diff);
  inicio.setHours(0, 0, 0, 0);
  const fim = new Date(inicio);
  fim.setDate(inicio.getDate() + 6);
  fim.setHours(23, 59, 59, 999);
  return { inicio, fim };
}
