import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { criarNotificacao } from "@/lib/communities/notifications";
import { canDo } from "@/lib/communities/permissions";
import { ensureCommunityPermission, getCommunityUserTags, statusFromCommunityError } from "@/lib/communities/access";

function mapRequest(row: any) {
  const status = String(row.status || "").toLowerCase();
  return {
    id: row.id,
    alunoId: row.user_id,
    alunoNome: row.aluno_nome ?? "Aluno",
    foco: row.foco,
    obs: row.obs ?? row.objetivo ?? undefined,
    criadoEm: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    status:
      status === "concluida" || status === "em_andamento" || status === "rejeitada"
        ? status
        : "pendente",
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  const resolvedParams = await params;
  const communityId = resolvedParams.id;
  const userId = req.nextUrl.searchParams.get("userId") ?? "";

  try {
  if (!userId) return NextResponse.json({ error: "userId obrigatório" }, { status: 400 });
    await ensureCommunityPermission(communityId, userId, "desafio:submit");
    const tags = await getCommunityUserTags(communityId, userId);
    const manage = canDo(tags, "treino:manage");

    const [rows] = await db.query(
      `
        SELECT *
        FROM solicitacoes_treino
        WHERE comunidade_id = ?
          AND (? = 1 OR user_id = ?)
        ORDER BY created_at DESC
      `,
      [communityId, manage ? 1 : 0, userId],
    );

    return NextResponse.json({ solicitacoes: (rows as any[]).map(mapRequest) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: statusFromCommunityError(err) });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  const resolvedParams = await params;
  const communityId = resolvedParams.id;

  try {
    const input = await req.json();
    const alunoId = input.alunoId ?? "";
    await ensureCommunityPermission(communityId, alunoId, "desafio:submit");

    const requestId = input.id || `treino-sol-${Date.now()}`;
    await db.query(
      `
        INSERT INTO solicitacoes_treino
          (id, comunidade_id, user_id, aluno_nome, foco, objetivo, obs, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pendente')
        ON DUPLICATE KEY UPDATE
          foco = VALUES(foco),
          objetivo = VALUES(objetivo),
          obs = VALUES(obs),
          status = 'pendente'
      `,
      [
        requestId,
        communityId,
        alunoId,
        input.alunoNome ?? "Aluno",
        input.foco ?? "hipertrofia",
        input.obs ?? null,
        input.obs ?? null,
      ],
    );

    const [professionals] = await db.query(
      `
        SELECT DISTINCT cm.user_id
        FROM comunidade_membros cm
        INNER JOIN comunidade_membro_tags cmt ON cmt.membro_id = cm.id
        INNER JOIN comunidade_tags ct ON ct.id = cmt.tag_id
        WHERE cm.comunidade_id = ?
          AND cm.status = 'aprovado'
          AND ct.nome IN ('Dono','ADM','Instrutor','Personal')
      `,
      [communityId],
    );

    for (const prof of professionals as any[]) {
      await criarNotificacao({
        userId: prof.user_id,
        comunidadeId: communityId,
        tipo: "solicitacao_treino",
        titulo: "Nova solicitação de treino",
        mensagem: `${input.alunoNome ?? "Aluno"} pediu um treino de ${input.foco ?? "foco aberto"}.`,
        payload: { requestId, alunoId },
      });
    }

    return NextResponse.json({
      success: true,
      solicitacao: {
        ...input,
        id: requestId,
        alunoId,
        status: "pendente",
        criadoEm: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: statusFromCommunityError(err) });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  const resolvedParams = await params;
  const communityId = resolvedParams.id;

  try {
    const { id, status, requesterId, treinoId } = await req.json();
    await ensureCommunityPermission(communityId, requesterId, "treino:manage");
    await db.query(
      `
        UPDATE solicitacoes_treino
        SET status = ?, treino_gerado = COALESCE(?, treino_gerado),
            respondido_por = ?, respondido_em = NOW()
        WHERE id = ? AND comunidade_id = ?
      `,
      [status, treinoId ?? null, requesterId, id, communityId],
    );
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: statusFromCommunityError(err) });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  const resolvedParams = await params;
  const communityId = resolvedParams.id;
  const requesterId = req.nextUrl.searchParams.get("requesterId") ?? "";
  const requestId = req.nextUrl.searchParams.get("requestId") ?? "";

  try {
    await ensureCommunityPermission(communityId, requesterId, "treino:manage");
    await db.query(
      "UPDATE solicitacoes_treino SET status = 'rejeitada', respondido_por = ?, respondido_em = NOW() WHERE id = ? AND comunidade_id = ?",
      [requesterId, requestId, communityId],
    );
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: statusFromCommunityError(err) });
  }
}
