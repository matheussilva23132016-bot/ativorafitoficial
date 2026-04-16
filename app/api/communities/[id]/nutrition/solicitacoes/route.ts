import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { criarNotificacao } from "@/lib/communities/notifications";
import { ensureCommunityPermission, statusFromCommunityError } from "@/lib/communities/access";
import { canManageNutrition, mapSolicitacao } from "../_utils";

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
    const manage = await canManageNutrition(communityId, userId);

    const [rows] = await db.query(
      `
        SELECT *
        FROM solicitacoes_nutricionais
        WHERE comunidade_id = ?
          AND (? = 1 OR user_id = ?)
        ORDER BY created_at DESC
      `,
      [communityId, manage ? 1 : 0, userId],
    );

    return NextResponse.json({ solicitacoes: (rows as any[]).map(mapSolicitacao) });
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
    const alunoId = input.alunoId ?? input.user_id ?? "";
    await ensureCommunityPermission(communityId, alunoId, "desafio:submit");

    const solicitacaoId = input.id || `nut-sol-${Date.now()}`;
    await db.query(
      `
        INSERT INTO solicitacoes_nutricionais (
          id, comunidade_id, user_id, aluno_nome, foco, objetivo,
          restricoes, medida_dados, status, obs
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendente', ?)
        ON DUPLICATE KEY UPDATE
          foco = VALUES(foco),
          objetivo = VALUES(objetivo),
          restricoes = VALUES(restricoes),
          medida_dados = VALUES(medida_dados),
          status = 'pendente',
          obs = VALUES(obs)
      `,
      [
        solicitacaoId,
        communityId,
        alunoId,
        input.alunoNome ?? "Aluno",
        input.foco ?? "manutencao",
        input.objetivo ?? null,
        JSON.stringify(input.restricoes ?? []),
        input.medidas ? JSON.stringify(input.medidas) : null,
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
          AND ct.nome IN ('Dono','ADM','Nutri','Nutricionista')
      `,
      [communityId],
    );

    for (const prof of professionals as any[]) {
      await criarNotificacao({
        userId: prof.user_id,
        comunidadeId: communityId,
        tipo: "solicitacao_nutricional",
        titulo: "Nova solicitação nutricional",
        mensagem: `${input.alunoNome ?? "Aluno"} pediu um cardápio.`,
        payload: { solicitacaoId, alunoId },
      });
    }

    return NextResponse.json({
      success: true,
      solicitacao: {
        ...input,
        id: solicitacaoId,
        communityId,
        alunoId,
        status: "pendente",
        criadoEm: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: statusFromCommunityError(err) });
  }
}
