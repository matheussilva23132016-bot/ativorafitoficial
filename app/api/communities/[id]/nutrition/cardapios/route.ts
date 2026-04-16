import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { criarNotificacao } from "@/lib/communities/notifications";
import { ensureCommunityPermission, statusFromCommunityError } from "@/lib/communities/access";
import { loadCardapios } from "../_utils";

const VALID_DAYS = new Set(["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]);

function dbStatus(status: string) {
  if (status === "archived") return "arquivado";
  if (status === "published") return "published";
  return "draft";
}

function dayOrNull(day: string) {
  return VALID_DAYS.has(day) ? day : null;
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
    const cardapios = await loadCardapios(communityId, userId);
    return NextResponse.json({ cardapios });
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
    const cardapio = await req.json();
    const requesterId = cardapio.requesterId ?? cardapio.criado_por ?? "";
    await ensureCommunityPermission(communityId, requesterId, "nutri:manage");

    const cardapioId = cardapio.id || `card-${Date.now()}`;
    const alvo = cardapio.alunoId ? "individual" : "todos";
    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
      await conn.query(
        `
          INSERT INTO cardapios (
            id, comunidade_id, criado_por, titulo, foco, calorias_meta,
            proteinas_dia, status, alvo, alvo_user_id, aluno_id, aluno_nome,
            solicitacao_id, semana, gerado_por_ia, ia_revisado, obs
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
          ON DUPLICATE KEY UPDATE
            titulo = VALUES(titulo),
            foco = VALUES(foco),
            calorias_meta = VALUES(calorias_meta),
            proteinas_dia = VALUES(proteinas_dia),
            status = VALUES(status),
            alvo = VALUES(alvo),
            alvo_user_id = VALUES(alvo_user_id),
            aluno_id = VALUES(aluno_id),
            aluno_nome = VALUES(aluno_nome),
            solicitacao_id = VALUES(solicitacao_id),
            semana = VALUES(semana),
            gerado_por_ia = VALUES(gerado_por_ia),
            ia_revisado = 1,
            obs = VALUES(obs)
        `,
        [
          cardapioId,
          communityId,
          requesterId,
          cardapio.titulo || "Cardápio",
          cardapio.foco || "manutencao",
          cardapio.calorias_dia ?? null,
          cardapio.proteinas_dia ?? null,
          dbStatus(cardapio.status),
          alvo,
          cardapio.alunoId || null,
          cardapio.alunoId || null,
          cardapio.alunoNome || null,
          cardapio.solicitacaoId || null,
          cardapio.semana || null,
          cardapio.geradoPorIA ? 1 : 0,
          cardapio.obs || null,
        ],
      );

      await conn.query("DELETE FROM refeicoes_cardapio WHERE cardapio_id = ?", [cardapioId]);

      let ordem = 1;
      for (const dia of Array.isArray(cardapio.dias) ? cardapio.dias : []) {
        for (const refeicao of Array.isArray(dia.refeicoes) ? dia.refeicoes : []) {
          await conn.query(
            `
              INSERT INTO refeicoes_cardapio (
                id, cardapio_id, dia_semana, nome, horario, alimentos,
                calorias, proteina, carbo, gordura, obs, concluida, ordem
              )
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
              refeicao.id || `ref-${Date.now()}-${ordem}`,
              cardapioId,
              dayOrNull(dia.dia),
              refeicao.nome || "Refeicao",
              refeicao.horario || null,
              JSON.stringify(refeicao.alimentos ?? []),
              refeicao.calorias ?? null,
              null,
              null,
              null,
              refeicao.obs || null,
              refeicao.concluida ? 1 : 0,
              ordem++,
            ],
          );
        }
      }

      await conn.commit();
      conn.release();

      if (dbStatus(cardapio.status) === "published" && cardapio.alunoId) {
        await criarNotificacao({
          userId: cardapio.alunoId,
          comunidadeId: communityId,
          tipo: "cardapio_publicado",
          titulo: "Novo cardápio publicado",
          mensagem: cardapio.titulo || "Seu cardápio semanal está disponível.",
          payload: { cardapioId },
        });
      }

      return NextResponse.json({ success: true, cardapio: { ...cardapio, id: cardapioId } });
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw err;
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: statusFromCommunityError(err) });
  }
}
