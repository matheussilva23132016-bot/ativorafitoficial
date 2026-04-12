import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { criarNotificacao } from "@/lib/communities/notifications";

// GET — Lista solicitações pendentes (ADM/Dono)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [rows] = await db.query(`
      SELECT se.*, u.nickname, u.avatar_url, u.full_name
      FROM solicitacoes_entrada se
      LEFT JOIN usuarios u ON u.id = se.user_id
      WHERE se.comunidade_id = ? AND se.status = 'pendente'
      ORDER BY se.created_at DESC
    `, [params.id]);

    return NextResponse.json({ requests: rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST — Solicitar entrada
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId, mensagem } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId obrigatório" }, { status: 400 });

    // Verifica se já existe solicitação
    const [existing] = await db.query(`
      SELECT id, status FROM solicitacoes_entrada
      WHERE comunidade_id = ? AND user_id = ?
      ORDER BY created_at DESC LIMIT 1
    `, [params.id, userId]);

    const ex = (existing as any[])[0];
    if (ex && (ex.status === "pendente" || ex.status === "aprovado")) {
      return NextResponse.json({ error: "Solicitação já existe" }, { status: 409 });
    }

    const solId = `sol-${Date.now()}`;
    await db.query(`
      INSERT INTO solicitacoes_entrada (id, comunidade_id, user_id, mensagem, status)
      VALUES (?, ?, ?, ?, 'pendente')
    `, [solId, params.id, userId, mensagem ?? null]);

    // Notifica ADMs e Dono da comunidade
    const [admins] = await db.query(`
      SELECT cm.user_id FROM comunidade_membros cm
      INNER JOIN comunidade_membro_tags cmt ON cmt.membro_id = cm.id
      INNER JOIN comunidade_tags ct ON ct.id = cmt.tag_id
      WHERE cm.comunidade_id = ? AND ct.nome IN ('ADM','Dono') AND cm.status = 'aprovado'
    `, [params.id]);

    for (const admin of admins as any[]) {
      await criarNotificacao({
        userId:       admin.user_id,
        comunidadeId: params.id,
        tipo:         "solicitacao_entrada",
        titulo:       "Nova Solicitação",
        mensagem:     "Um atleta quer entrar na comunidade.",
        payload:      { solicitacaoId: solId, userId },
      });
    }

    return NextResponse.json({ success: true, solicitacaoId: solId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH — Aprovar ou recusar
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { solicitacaoId, acao, motivo, analisadoPor } = await req.json();
    // acao: "aprovar" | "recusar"

    const [solRows] = await db.query(`
      SELECT * FROM solicitacoes_entrada WHERE id = ? AND comunidade_id = ?
    `, [solicitacaoId, params.id]);

    const sol = (solRows as any[])[0];
    if (!sol) return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 });

    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
      if (acao === "aprovar") {
        // 1. Atualiza solicitação
        await conn.query(`
          UPDATE solicitacoes_entrada 
          SET status = 'aprovado', analisado_por = ? WHERE id = ?
        `, [analisadoPor, solicitacaoId]);

        // 2. Cria membro
        const membroId = `mb-${Date.now()}`;
        await conn.query(`
          INSERT INTO comunidade_membros (id, comunidade_id, user_id, status, joined_at)
          VALUES (?, ?, ?, 'aprovado', NOW())
          ON DUPLICATE KEY UPDATE status = 'aprovado', joined_at = NOW()
        `, [membroId, params.id, sol.user_id]);

        // 3. Busca membro recém criado (pode ter sido UPDATE)
        const [mbRows] = await conn.query(`
          SELECT id FROM comunidade_membros 
          WHERE comunidade_id = ? AND user_id = ? LIMIT 1
        `, [params.id, sol.user_id]);
        const membroIdReal = (mbRows as any[])[0]?.id;

        // 4. Atribui tag Participante automaticamente
        const [tagRows] = await conn.query(`
          SELECT id FROM comunidade_tags 
          WHERE comunidade_id = ? AND nome = 'Participante' LIMIT 1
        `, [params.id]);
        const participanteTagId = (tagRows as any[])[0]?.id;

        if (participanteTagId && membroIdReal) {
          const mtId = `mt-${Date.now()}`;
          await conn.query(`
            INSERT IGNORE INTO comunidade_membro_tags (id, membro_id, tag_id, atribuido_por)
            VALUES (?, ?, ?, ?)
          `, [mtId, membroIdReal, participanteTagId, analisadoPor]);
        }

        // 5. Atualiza contador
        await conn.query(`
          UPDATE comunidades 
          SET total_membros = (
            SELECT COUNT(*) FROM comunidade_membros 
            WHERE comunidade_id = ? AND status = 'aprovado'
          ) WHERE id = ?
        `, [params.id, params.id]);

        // 6. Notifica o usuário aprovado
        await criarNotificacao({
          userId:       sol.user_id,
          comunidadeId: params.id,
          tipo:         "entrada_aprovada",
          titulo:       "Entrada Aprovada! 🎉",
          mensagem:     "Sua solicitação foi aprovada. Bem-vindo ao esquadrão!",
          payload:      { communityId: params.id },
        });

      } else {
        // Recusa
        await conn.query(`
          UPDATE solicitacoes_entrada 
          SET status = 'recusado', analisado_por = ?, motivo_recusa = ? WHERE id = ?
        `, [analisadoPor, motivo ?? null, solicitacaoId]);

        await criarNotificacao({
          userId:       sol.user_id,
          comunidadeId: params.id,
          tipo:         "entrada_recusada",
          titulo:       "Solicitação Recusada",
          mensagem:     motivo ?? "Sua solicitação não foi aprovada desta vez.",
          payload:      { communityId: params.id },
        });
      }

      await conn.commit();
      conn.release();
      return NextResponse.json({ success: true });
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw err;
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
