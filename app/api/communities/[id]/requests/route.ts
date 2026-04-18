import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { criarNotificacao } from "@/lib/communities/notifications";
import { ensureCommunityPermission, statusFromCommunityError } from "@/lib/communities/access";

// GET - Lista solicitacoes pendentes (ADM/Dono)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = await params;
  const paramsId = resolvedParams.id;
  const requesterId = req.nextUrl.searchParams.get("requesterId");
  try {
    if (!requesterId) {
      return NextResponse.json({ error: "requesterId obrigatório" }, { status: 400 });
    }

    await ensureCommunityPermission(paramsId, requesterId, "member:approve");

    const [rows] = await db.query(
      `
        SELECT se.*, u.nickname, u.avatar_url, u.full_name
        FROM solicitacoes_entrada se
        LEFT JOIN usuarios u ON u.id = se.user_id
        WHERE se.comunidade_id = ? AND se.status = 'pendente'
        ORDER BY se.created_at DESC
      `,
      [paramsId],
    );

    return NextResponse.json({ requests: rows });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: statusFromCommunityError(err) },
    );
  }
}

// POST - Entrada na comunidade:
// - Publica: entra direto como membro aprovado.
// - Privada: cria solicitacao para aprovacao de Dono/ADM.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = await params;
  const paramsId = resolvedParams.id;
  try {
    const { userId, mensagem } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId obrigatório" }, { status: 400 });

    const [communityRows] = await db.query(
      `
        SELECT id, owner_id, privacidade, status
        FROM comunidades
        WHERE id = ?
        LIMIT 1
      `,
      [paramsId],
    );
    const community = (communityRows as any[])[0];
    if (!community) {
      return NextResponse.json({ error: "Comunidade não encontrada" }, { status: 404 });
    }
    if (community.status !== "ativa") {
      return NextResponse.json({ error: "Comunidade indisponivel" }, { status: 409 });
    }

    if (String(community.owner_id) === String(userId)) {
      return NextResponse.json({ success: true, joined: true, role: "owner" });
    }

    const [memberRows] = await db.query(
      `
        SELECT id, status
        FROM comunidade_membros
        WHERE comunidade_id = ? AND user_id = ?
        LIMIT 1
      `,
      [paramsId, userId],
    );
    const existingMember = (memberRows as any[])[0];
    if (existingMember?.status === "aprovado") {
      return NextResponse.json({ success: true, joined: true, role: "member" });
    }

    if (community.privacidade === "public") {
      const conn = await db.getConnection();
      await conn.beginTransaction();

      try {
        const memberId = existingMember?.id ?? `mb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        if (existingMember) {
          await conn.query(
            `
              UPDATE comunidade_membros
              SET status = 'aprovado',
                  motivo_recusa = NULL,
                  joined_at = COALESCE(joined_at, NOW())
              WHERE id = ?
            `,
            [memberId],
          );
        } else {
          await conn.query(
            `
              INSERT INTO comunidade_membros (id, comunidade_id, user_id, status, joined_at)
              VALUES (?, ?, ?, 'aprovado', NOW())
            `,
            [memberId, paramsId, userId],
          );
        }

        const [tagRows] = await conn.query(
          `
            SELECT id
            FROM comunidade_tags
            WHERE comunidade_id = ? AND nome = 'Participante'
            LIMIT 1
          `,
          [paramsId],
        );
        const participanteTagId = (tagRows as any[])[0]?.id;

        if (participanteTagId) {
          await conn.query(
            `
              INSERT IGNORE INTO comunidade_membro_tags (id, membro_id, tag_id, atribuido_por)
              VALUES (?, ?, ?, ?)
            `,
            [`mt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, memberId, participanteTagId, userId],
          );
        }

        await conn.query(
          `
            UPDATE comunidades
            SET total_membros = (
              SELECT COUNT(*)
              FROM comunidade_membros
              WHERE comunidade_id = ? AND status = 'aprovado'
            )
            WHERE id = ?
          `,
          [paramsId, paramsId],
        );

        await conn.commit();
        conn.release();

        return NextResponse.json({ success: true, joined: true, privacy: "public" });
      } catch (err) {
        await conn.rollback();
        conn.release();
        throw err;
      }
    }

    const [existingRequestRows] = await db.query(
      `
        SELECT id, status
        FROM solicitacoes_entrada
        WHERE comunidade_id = ? AND user_id = ?
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [paramsId, userId],
    );
    const existingRequest = (existingRequestRows as any[])[0];
    if (existingRequest && (existingRequest.status === "pendente" || existingRequest.status === "aprovado")) {
      return NextResponse.json(
        { error: "Solicitação já existe", requestStatus: existingRequest.status },
        { status: 409 },
      );
    }

    const requestId = `sol-${Date.now()}`;
    await db.query(
      `
        INSERT INTO solicitacoes_entrada (id, comunidade_id, user_id, mensagem, status)
        VALUES (?, ?, ?, ?, 'pendente')
      `,
      [requestId, paramsId, userId, mensagem ?? null],
    );

    const [approversRows] = await db.query(
      `
        SELECT DISTINCT target.user_id
        FROM (
          SELECT owner_id AS user_id
          FROM comunidades
          WHERE id = ?
          UNION ALL
          SELECT cm.user_id
          FROM comunidade_membros cm
          INNER JOIN comunidade_membro_tags cmt ON cmt.membro_id = cm.id
          INNER JOIN comunidade_tags ct ON ct.id = cmt.tag_id
          WHERE cm.comunidade_id = ?
            AND cm.status = 'aprovado'
            AND ct.nome IN ('ADM', 'Dono')
        ) AS target
        WHERE target.user_id IS NOT NULL
          AND target.user_id <> ?
      `,
      [paramsId, paramsId, userId],
    );

    for (const approver of approversRows as any[]) {
      await criarNotificacao({
        userId: approver.user_id,
        comunidadeId: paramsId,
        tipo: "solicitacao_entrada",
        titulo: "Nova solicitação",
        mensagem: "Um atleta pediu acesso ao grupo privado.",
        payload: { solicitacaoId: requestId, userId },
      });
    }

    return NextResponse.json({ success: true, requested: true, solicitacaoId: requestId, privacy: "private" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH - Aprovar ou recusar solicitacao de entrada
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = await params;
  const paramsId = resolvedParams.id;
  try {
    const { solicitacaoId, acao, motivo, analisadoPor } = await req.json();

    if (!analisadoPor) {
      return NextResponse.json({ error: "analisadoPor obrigatório" }, { status: 400 });
    }

    await ensureCommunityPermission(paramsId, analisadoPor, "member:approve");

    const [solRows] = await db.query(
      `
        SELECT *
        FROM solicitacoes_entrada
        WHERE id = ? AND comunidade_id = ?
      `,
      [solicitacaoId, paramsId],
    );

    const sol = (solRows as any[])[0];
    if (!sol) return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 });

    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
      if (acao === "aprovar") {
        await conn.query(
          `
            UPDATE solicitacoes_entrada
            SET status = 'aprovado', analisado_por = ?
            WHERE id = ?
          `,
          [analisadoPor, solicitacaoId],
        );

        const membroId = `mb-${Date.now()}`;
        await conn.query(
          `
            INSERT INTO comunidade_membros (id, comunidade_id, user_id, status, joined_at)
            VALUES (?, ?, ?, 'aprovado', NOW())
            ON DUPLICATE KEY UPDATE status = 'aprovado', joined_at = NOW()
          `,
          [membroId, paramsId, sol.user_id],
        );

        const [mbRows] = await conn.query(
          `
            SELECT id
            FROM comunidade_membros
            WHERE comunidade_id = ? AND user_id = ?
            LIMIT 1
          `,
          [paramsId, sol.user_id],
        );
        const membroIdReal = (mbRows as any[])[0]?.id;

        const [tagRows] = await conn.query(
          `
            SELECT id
            FROM comunidade_tags
            WHERE comunidade_id = ? AND nome = 'Participante'
            LIMIT 1
          `,
          [paramsId],
        );
        const participanteTagId = (tagRows as any[])[0]?.id;

        if (participanteTagId && membroIdReal) {
          const mtId = `mt-${Date.now()}`;
          await conn.query(
            `
              INSERT IGNORE INTO comunidade_membro_tags (id, membro_id, tag_id, atribuido_por)
              VALUES (?, ?, ?, ?)
            `,
            [mtId, membroIdReal, participanteTagId, analisadoPor],
          );
        }

        await conn.query(
          `
            UPDATE comunidades
            SET total_membros = (
              SELECT COUNT(*)
              FROM comunidade_membros
              WHERE comunidade_id = ? AND status = 'aprovado'
            )
            WHERE id = ?
          `,
          [paramsId, paramsId],
        );

        await criarNotificacao({
          userId: sol.user_id,
          comunidadeId: paramsId,
          tipo: "entrada_aprovada",
          titulo: "Entrada aprovada",
          mensagem: "Sua solicitação foi aprovada. Bem-vindo ao grupo!",
          payload: { communityId: paramsId },
        });
      } else {
        await conn.query(
          `
            UPDATE solicitacoes_entrada
            SET status = 'recusado', analisado_por = ?, motivo_recusa = ?
            WHERE id = ?
          `,
          [analisadoPor, motivo ?? null, solicitacaoId],
        );

        await criarNotificacao({
          userId: sol.user_id,
          comunidadeId: paramsId,
          tipo: "entrada_recusada",
          titulo: "Solicitação recusada",
          mensagem: motivo ?? "Sua solicitação não foi aprovada desta vez.",
          payload: { communityId: paramsId },
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
    return NextResponse.json(
      { error: err.message },
      { status: statusFromCommunityError(err) },
    );
  }
}
