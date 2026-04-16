import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureCommunityPermission, statusFromCommunityError } from "@/lib/communities/access";
import { addParagraph, addSection, buildPdf, type PdfLine } from "@/lib/pdf/simplePdf";

function fileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "ativora-comunidade";
}

function parseJsonArray(value: any) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function text(value: unknown, fallback = "Não informado") {
  const clean = String(value ?? "").trim();
  return clean || fallback;
}

function formatDate(value?: unknown) {
  if (!value) return new Date().toLocaleDateString("pt-BR");
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("pt-BR");
}

function formatWeek(value?: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return "Semana atual";
  return raw.replace("-W", " / Semana ");
}

function studentName(user: any, fallback?: unknown) {
  return text(
    fallback
      ?? user?.full_name
      ?? user?.nickname
      ?? user?.email,
    "Aluno Ativora",
  );
}

function addDivider(lines: PdfLine[]) {
  lines.push({ text: "------------------------------------------------------------", size: 8, gap: 14, color: "soft" });
}

function macroValue(value: unknown, label: string, unit = "g") {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return "";
  return `${label}: ${Math.round(num)}${unit}`;
}

function foodLine(alimento: any) {
  const macros = [
    macroValue(alimento?.calorias, "calorias", " kcal"),
    macroValue(alimento?.proteinas ?? alimento?.proteina, "proteína"),
    macroValue(alimento?.carbos ?? alimento?.carbo, "carbo"),
    macroValue(alimento?.gorduras ?? alimento?.gordura, "gordura"),
  ].filter(Boolean);

  return [
    text(alimento?.nome, "Alimento"),
    alimento?.quantidade ? `- ${alimento.quantidade}` : "",
    macros.length ? `(${macros.join(" | ")})` : "",
  ].filter(Boolean).join(" ");
}

async function getContext(communityId: string, userId: string) {
  const [communityRows] = await db.query(
    "SELECT nome, descricao FROM comunidades WHERE id = ? LIMIT 1",
    [communityId],
  );
  const [userRows] = await db.query(
    "SELECT id, full_name, nickname, email FROM ativora_users WHERE id = ? LIMIT 1",
    [userId],
  );

  return {
    community: (communityRows as any[])[0] ?? null,
    user: (userRows as any[])[0] ?? null,
  };
}

async function buildTreinoPdf(communityId: string, userId: string) {
  const { community, user } = await getContext(communityId, userId);

  const [treinoRows] = await db.query(
    `
      SELECT t.id, t.titulo, t.descricao, t.dia_semana, t.foco, t.obs, t.updated_at,
             e.ordem, e.nome AS exercicio_nome, e.series, e.reps, e.descanso,
             e.cadencia, e.rpe, e.video_url, e.obs AS exercicio_obs
      FROM treinos t
      LEFT JOIN exercicios_treino e ON e.treino_id = t.id
      WHERE t.comunidade_id = ?
        AND t.status = 'published'
        AND (t.alvo = 'todos' OR t.alvo_user_id = ? OR t.aluno_id = ?)
      ORDER BY FIELD(t.dia_semana,'Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo','Livre'),
               t.updated_at DESC, e.ordem ASC
    `,
    [communityId, userId, userId],
  );

  const grouped = new Map<string, any>();
  for (const row of treinoRows as any[]) {
    if (!grouped.has(row.id)) {
      grouped.set(row.id, { ...row, exercicios: [] });
    }
    if (row.exercicio_nome) {
      grouped.get(row.id).exercicios.push(row);
    }
  }

  const treinos = Array.from(grouped.values());
  const lines: PdfLine[] = [];

  addSection(lines, "Resumo do aluno", [
    `Comunidade: ${text(community?.nome, "Ativora Comunidades")}`,
    `Aluno: ${studentName(user)}`,
    `Treinos publicados: ${treinos.length}`,
    `Emitido em: ${formatDate()}`,
  ]);
  addParagraph(
    lines,
    "Use este PDF para acompanhar sua semana offline. Ele representa o treino publicado dentro da comunidade e deve ser seguido conforme orientação do profissional responsável.",
    { color: "muted" },
  );
  addDivider(lines);

  if (treinos.length === 0) {
    addParagraph(lines, "Nenhum treino publicado foi encontrado para este aluno nesta comunidade.");
  }

  for (const treino of treinos) {
    addSection(lines, `${text(treino.dia_semana, "Livre")} | ${text(treino.titulo, "Treino")}`, [
      `Foco: ${text(treino.foco)}`,
      treino.descricao ? `Descrição: ${treino.descricao}` : "",
      treino.obs ? `Observações do profissional: ${treino.obs}` : "",
      `Última atualização: ${formatDate(treino.updated_at)}`,
    ]);

    if (treino.exercicios.length === 0) {
      addParagraph(lines, "Sem exercícios cadastrados para este treino.", { indent: 8, color: "muted" });
      continue;
    }

    treino.exercicios.forEach((ex: any, index: number) => {
      const detalhe = [
        `${String(index + 1).padStart(2, "0")}. ${text(ex.exercicio_nome, "Exercício")}`,
        ex.series ? `${ex.series} séries` : "",
        ex.reps ? `${ex.reps} repetições` : "",
        ex.descanso ? `descanso ${ex.descanso}` : "",
        ex.cadencia ? `cadência ${ex.cadencia}` : "",
        ex.rpe ? `RPE ${ex.rpe}` : "",
      ].filter(Boolean).join(" | ");

      addParagraph(lines, detalhe, { indent: 8, weight: "bold" });
      if (ex.exercicio_obs) addParagraph(lines, `Obs: ${ex.exercicio_obs}`, { indent: 20, color: "muted" });
      if (ex.video_url) addParagraph(lines, `Vídeo/demonstração: ${ex.video_url}`, { indent: 20, color: "sky" });
    });
    addDivider(lines);
  }

  const pdf = buildPdf("Treino semanal", lines, {
    subtitle: "Ativora Comunidades",
    documentLabel: "Plano de treino offline",
  });

  return {
    pdf,
    filename: `${fileName(community?.nome ?? "ativora")}-treino-semanal.pdf`,
  };
}

async function buildCardapioPdf(communityId: string, userId: string) {
  const { community, user } = await getContext(communityId, userId);

  const [cardRows] = await db.query(
    `
      SELECT *
      FROM cardapios
      WHERE comunidade_id = ?
        AND status = 'published'
        AND (alvo = 'todos' OR alvo_user_id = ? OR aluno_id = ?)
      ORDER BY updated_at DESC
      LIMIT 1
    `,
    [communityId, userId, userId],
  );
  const cardapio = (cardRows as any[])[0];
  const lines: PdfLine[] = [];

  addSection(lines, "Resumo do aluno", [
    `Comunidade: ${text(community?.nome, "Ativora Comunidades")}`,
    `Aluno: ${studentName(user, cardapio?.aluno_nome)}`,
    `Semana: ${formatWeek(cardapio?.semana ?? cardapio?.semana_ref)}`,
    `Emitido em: ${formatDate()}`,
  ]);

  if (!cardapio) {
    addParagraph(lines, "Nenhum cardápio publicado foi encontrado para este aluno nesta comunidade.");
    return {
      pdf: buildPdf("Cardápio semanal", lines, {
        subtitle: "Ativora Comunidades",
        documentLabel: "Cardápio offline",
      }),
      filename: `${fileName(community?.nome ?? "ativora")}-cardapio-semanal.pdf`,
    };
  }

  addSection(lines, text(cardapio.titulo, "Cardápio semanal"), [
    cardapio.foco ? `Foco nutricional: ${cardapio.foco}` : "",
    cardapio.calorias_meta ? `Meta calórica: ${cardapio.calorias_meta} kcal/dia` : "",
    cardapio.proteinas_dia ? `Proteína: ${cardapio.proteinas_dia}g/dia` : "",
    cardapio.obs ? `Orientações do profissional: ${cardapio.obs}` : "",
    `Última atualização: ${formatDate(cardapio.updated_at)}`,
  ]);

  const [mealRows] = await db.query(
    `
      SELECT *
      FROM refeicoes_cardapio
      WHERE cardapio_id = ?
      ORDER BY FIELD(dia_semana,'Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'), ordem ASC, horario ASC
    `,
    [cardapio.id],
  );

  let currentDay = "";
  for (const meal of mealRows as any[]) {
    if (meal.dia_semana !== currentDay) {
      currentDay = meal.dia_semana ?? "Livre";
      lines.push({ text: currentDay, size: 14, gap: 20, weight: "bold", color: "emerald" });
    }

    const mealMacros = [
      meal.calorias ? `${meal.calorias} kcal` : "",
      meal.proteina ? `${meal.proteina}g proteína` : "",
      meal.carbo ? `${meal.carbo}g carbo` : "",
      meal.gordura ? `${meal.gordura}g gordura` : "",
    ].filter(Boolean);

    addParagraph(
      lines,
      `${text(meal.nome, "Refeição")}${meal.horario ? ` | ${meal.horario}` : ""}${mealMacros.length ? ` | ${mealMacros.join(" | ")}` : ""}`,
      { indent: 8, weight: "bold" },
    );

    const alimentos = parseJsonArray(meal.alimentos_json ?? meal.alimentos);
    if (alimentos.length === 0) {
      addParagraph(lines, "Sem alimentos cadastrados.", { indent: 20, color: "muted" });
    } else {
      alimentos.forEach((alimento: any) => {
        addParagraph(lines, `- ${foodLine(alimento)}`, { indent: 20, color: "dark" });
      });
    }
    if (meal.obs) addParagraph(lines, `Obs: ${meal.obs}`, { indent: 20, color: "muted" });
  }

  if ((mealRows as any[]).length === 0) {
    addParagraph(lines, "Este cardápio ainda não possui refeições cadastradas.");
  }

  const pdf = buildPdf("Cardápio semanal", lines, {
    subtitle: "Ativora Comunidades",
    documentLabel: "Cardápio alimentar offline",
  });

  return {
    pdf,
    filename: `${fileName(community?.nome ?? "ativora")}-cardapio-semanal.pdf`,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  const resolvedParams = await params;
  const communityId = resolvedParams.id;
  const userId = req.nextUrl.searchParams.get("userId") ?? "";
  const type = req.nextUrl.searchParams.get("type");

  try {
    if (!userId) {
      return NextResponse.json({ error: "userId obrigatório" }, { status: 400 });
    }

    await ensureCommunityPermission(communityId, userId, "desafio:submit");

    const result = type === "cardapio"
      ? await buildCardapioPdf(communityId, userId)
      : await buildTreinoPdf(communityId, userId);

    return new NextResponse(result.pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "Cache-Control": "private, max-age=60",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: statusFromCommunityError(err) },
    );
  }
}
