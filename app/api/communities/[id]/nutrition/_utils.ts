import { db } from "@/lib/db";
import { canDo } from "@/lib/communities/permissions";
import { ensureCommunityPermission, getCommunityUserTags } from "@/lib/communities/access";

export function parseJson(value: any, fallback: any) {
  if (value == null || value === "") return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function normalizeDate(value: any) {
  if (!value) return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

export async function canManageNutrition(communityId: string, userId: string) {
  const tags = await getCommunityUserTags(communityId, userId);
  return canDo(tags, "nutri:manage");
}

export async function ensureMemberOrNutritionManager(
  communityId: string,
  requesterId: string,
  targetUserId: string,
) {
  if (String(requesterId) === String(targetUserId)) {
    await ensureCommunityPermission(communityId, requesterId, "desafio:submit");
    return;
  }
  await ensureCommunityPermission(communityId, requesterId, "nutri:manage");
}

export function mapCardapio(row: any, refeicoes: any[] = []) {
  const byDay = new Map<string, any[]>();
  for (const refeicao of refeicoes) {
    const day = refeicao.dia_semana ?? "Livre";
    byDay.set(day, [...(byDay.get(day) ?? []), {
      id: refeicao.id,
      nome: refeicao.nome,
      horario: refeicao.horario ?? "",
      alimentos: parseJson(refeicao.alimentos, []),
      calorias: refeicao.calorias ?? undefined,
      obs: refeicao.obs ?? "",
      concluida: Boolean(refeicao.concluida),
    }]);
  }

  return {
    id: row.id,
    communityId: row.comunidade_id,
    alunoId: row.aluno_id ?? row.alvo_user_id ?? "",
    alunoNome: row.aluno_nome ?? "Aluno",
    titulo: row.titulo,
    foco: row.foco ?? "manutencao",
    semana: row.semana ?? row.semana_ref ?? "",
    dias: Array.from(byDay.entries()).map(([dia, items]) => ({ dia, refeicoes: items })),
    calorias_dia: row.calorias_meta ?? undefined,
    proteinas_dia: row.proteinas_dia ?? row.proteina_meta ?? undefined,
    obs: row.obs ?? "",
    status: row.status === "arquivado" ? "archived" : row.status,
    geradoPorIA: Boolean(row.gerado_por_ia),
    criadoEm: normalizeDate(row.created_at),
    atualizadoEm: normalizeDate(row.updated_at),
    solicitacaoId: row.solicitacao_id ?? undefined,
  };
}

export function mapSolicitacao(row: any) {
  return {
    id: row.id,
    communityId: row.comunidade_id,
    alunoId: row.user_id,
    alunoNome: row.aluno_nome ?? "Aluno",
    foco: row.foco,
    objetivo: row.objetivo ?? "",
    restricoes: parseJson(row.restricoes, []),
    medidas: parseJson(row.medida_dados, undefined),
    status: row.status,
    criadoEm: normalizeDate(row.created_at),
    respondidoEm: row.respondido_em ? normalizeDate(row.respondido_em) : undefined,
    cardapioId: row.cardapio_gerado ?? undefined,
    obs: row.obs ?? undefined,
  };
}

export function mapMedida(row: any) {
  return {
    id: row.id,
    alunoId: row.user_id,
    data: normalizeDate(row.data),
    sexo: row.sexo === "feminino" ? "feminino" : "masculino",
    peso: Number(row.peso_kg ?? 0),
    altura: Number(row.altura_cm ?? 0),
    cintura: Number(row.cintura_cm ?? 0),
    quadril: Number(row.quadril_cm ?? 0),
    pescoco: row.pescoco_cm == null ? undefined : Number(row.pescoco_cm),
    imc: row.imc == null ? undefined : Number(row.imc),
    rcq: row.rcq == null ? undefined : Number(row.rcq),
    gorduraEst: row.gordura_est == null ? undefined : Number(row.gordura_est),
    classificacaoRCQ: row.classificacao_rcq ?? undefined,
    metodoCalculo: row.metodo_calculo ?? undefined,
  };
}

export async function loadCardapios(communityId: string, requesterId: string) {
  const manage = await canManageNutrition(communityId, requesterId);
  const [cardRows] = await db.query(
    `
      SELECT *
      FROM cardapios
      WHERE comunidade_id = ?
        AND (? = 1 OR alvo = 'todos' OR alvo_user_id = ? OR aluno_id = ?)
      ORDER BY updated_at DESC
    `,
    [communityId, manage ? 1 : 0, requesterId, requesterId],
  );
  const ids = (cardRows as any[]).map(row => row.id);
  if (ids.length === 0) return [];

  const [mealRows] = await db.query(
    `
      SELECT *
      FROM refeicoes_cardapio
      WHERE cardapio_id IN (${ids.map(() => "?").join(",")})
      ORDER BY FIELD(dia_semana,'Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'), ordem ASC, horario ASC
    `,
    ids,
  );

  return (cardRows as any[]).map(row =>
    mapCardapio(row, (mealRows as any[]).filter(meal => meal.cardapio_id === row.id)),
  );
}
