import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { criarNotificacao } from "@/lib/communities/notifications";
import { ensureCommunityPermission, statusFromCommunityError } from "@/lib/communities/access";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; cardapioId: string }> | { id: string; cardapioId: string } },
) {
  const resolvedParams = await params;
  const communityId = resolvedParams.id;
  const cardapioId = resolvedParams.cardapioId;

  try {
    const { solicitacaoId, requesterId } = await req.json();
    await ensureCommunityPermission(communityId, requesterId, "nutri:manage");

    await db.query(
      "UPDATE cardapios SET status = 'published', solicitacao_id = COALESCE(?, solicitacao_id), ia_revisado = 1 WHERE id = ? AND comunidade_id = ?",
      [solicitacaoId ?? null, cardapioId, communityId],
    );

    if (solicitacaoId) {
      await db.query(
        `
          UPDATE solicitacoes_nutricionais
          SET status = 'concluida', cardapio_gerado = ?, respondido_por = ?, respondido_em = NOW()
          WHERE id = ? AND comunidade_id = ?
        `,
        [cardapioId, requesterId, solicitacaoId, communityId],
      );
    }

    const [rows] = await db.query(
      "SELECT aluno_id, alvo_user_id, titulo FROM cardapios WHERE id = ? AND comunidade_id = ? LIMIT 1",
      [cardapioId, communityId],
    );
    const cardapio = (rows as any[])[0];
    const targetUser = cardapio?.aluno_id ?? cardapio?.alvo_user_id;
    if (targetUser) {
      await criarNotificacao({
        userId: targetUser,
        comunidadeId: communityId,
        tipo: "cardapio_publicado",
        titulo: "Novo cardápio publicado",
        mensagem: cardapio?.titulo ?? "Seu cardápio semanal está disponível.",
        payload: { cardapioId },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: statusFromCommunityError(err) });
  }
}
