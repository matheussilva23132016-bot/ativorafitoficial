import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 12 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "image/bmp",
  "image/tiff",
]);

const normalize = (value: unknown) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const canImportFromTags = (tags: string[]) => {
  const allowed = new Set([
    "dono",
    "owner",
    "adm",
    "admin",
    "personal",
    "trainer",
    "instrutor",
    "instructor",
    "nutri",
    "nutricionista",
    "nutritionist",
  ]);
  return tags.map(normalize).some((tag) => allowed.has(tag));
};

async function getUserCommunityTags(communityId: string, userId: string): Promise<string[]> {
  const [rows]: any = await db.execute(
    `SELECT ct.nome
     FROM comunidade_membros cm
     INNER JOIN comunidade_membro_tags cmt ON cmt.membro_id = cm.id
     INNER JOIN comunidade_tags ct ON ct.id = cmt.tag_id
     WHERE cm.comunidade_id = ?
       AND cm.user_id = ?
       AND cm.status = 'aprovado'`,
    [communityId, userId]
  );

  const [ownerRows]: any = await db.execute(
    "SELECT id FROM comunidades WHERE id = ? AND owner_id = ? LIMIT 1",
    [communityId, userId]
  );

  const tags: string[] = (rows || []).map((row: any) => String(row.nome || "")).filter(Boolean);
  if (ownerRows?.length) tags.push("Dono");
  return Array.from(new Set(tags));
}

const responseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    target: { type: "string", enum: ["treino", "nutricao"] },
    confidence: { type: "number" },
    warnings: { type: "array", items: { type: "string" } },
    treino: {
      type: ["object", "null"],
      additionalProperties: false,
      properties: {
        titulo: { type: "string" },
        dia: { type: "string" },
        letra: { type: ["string", "null"] },
        foco: { type: "string" },
        obs: { type: "string" },
        grupos: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              nome: { type: "string" },
              exercicios: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    nome: { type: "string" },
                    series: { type: "number" },
                    repeticoes: { type: "string" },
                    descanso: { type: "string" },
                    obs: { type: "string" },
                    cadencia: { type: "string" },
                    rpe: { type: ["number", "null"] },
                  },
                  required: ["nome", "series", "repeticoes", "descanso", "obs", "cadencia", "rpe"],
                },
              },
            },
            required: ["nome", "exercicios"],
          },
        },
        cardio: {
          type: ["object", "null"],
          additionalProperties: false,
          properties: {
            tipo: { type: "string" },
            duracao: { type: "string" },
            intensidade: { type: "string" },
            obs: { type: "string" },
          },
          required: ["tipo", "duracao", "intensidade", "obs"],
        },
      },
      required: ["titulo", "dia", "letra", "foco", "obs", "grupos", "cardio"],
    },
    nutricao: {
      type: ["object", "null"],
      additionalProperties: false,
      properties: {
        titulo: { type: "string" },
        alunoNome: { type: "string" },
        foco: { type: "string" },
        semana: { type: "string" },
        calorias_dia: { type: ["number", "null"] },
        proteinas_dia: { type: ["number", "null"] },
        obs: { type: "string" },
        dias: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              dia: { type: "string" },
              refeicoes: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    nome: { type: "string" },
                    horario: { type: "string" },
                    calorias: { type: ["number", "null"] },
                    obs: { type: "string" },
                    alimentos: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                          nome: { type: "string" },
                          quantidade: { type: "string" },
                          calorias: { type: ["number", "null"] },
                          proteinas: { type: ["number", "null"] },
                          carbos: { type: ["number", "null"] },
                          gorduras: { type: ["number", "null"] },
                        },
                        required: ["nome", "quantidade", "calorias", "proteinas", "carbos", "gorduras"],
                      },
                    },
                  },
                  required: ["nome", "horario", "calorias", "obs", "alimentos"],
                },
              },
            },
            required: ["dia", "refeicoes"],
          },
        },
      },
      required: ["titulo", "alunoNome", "foco", "semana", "calorias_dia", "proteinas_dia", "obs", "dias"],
    },
  },
  required: ["target", "confidence", "warnings", "treino", "nutricao"],
};

const cleanJson = (value: string) =>
  value
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

const keepText = (value: unknown) => String(value ?? "").trim();
const keepNumber = (value: unknown) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const pickTargetInstructions = (target: string) => {
  if (target === "treino") {
    return `Extraia uma tabela/plano de treino. Converta para:
- título curto e profissional;
- dia da semana se existir, senão "Segunda";
- letra A/B/C se existir;
- foco entre emagrecimento, hipertrofia, resistencia, definicao, condicionamento, mobilidade;
- grupos por músculo, dia, bloco ou seção;
- exercícios com nome, séries, repetições, descanso, cadência/RPE quando existirem;
- cardio se houver esteira, bike, escada, HIIT, LISS, corrida ou similar.`;
  }

  return `Extraia um cardápio/plano alimentar. Converta para:
- título;
- nome do aluno se aparecer;
- foco entre emagrecimento, hipertrofia, manutencao, saude_geral, performance, recomposicao;
- dias da semana;
- refeições com horário quando existir;
- alimentos, quantidades, calorias e macros quando existirem;
- metas diárias e observações.`;
};

const pickTruthfulTargetInstructions = (target: string) => {
  if (target === "treino") {
    return `Extraia uma tabela/plano de treino. Converta para:
- título curto e profissional;
- dia exatamente como aparece no documento quando existir: "Segunda", "Terca", "Dia 1", uma data, "Treino A" etc.;
- se o documento não informar nenhum dia/rótulo, use "Livre" e registre em warnings que o dia não estava no documento;
- letra A/B/C se existir;
- foco entre emagrecimento, hipertrofia, resistencia, definicao, condicionamento, mobilidade;
- grupos por musculo, dia, bloco ou secao;
- exercicios com nome, series, repeticoes, descanso, cadencia/RPE somente quando existirem;
- cardio se houver esteira, bike, escada, HIIT, LISS, corrida ou similar.`;
  }

  return `Extraia um cardápio/plano alimentar. Converta para:
- título;
- nome do aluno se aparecer;
- foco entre emagrecimento, hipertrofia, manutencao, saude_geral, performance, recomposicao;
- dias exatamente como aparecem no documento, incluindo dias da semana, datas ou rotulos como "Dia 1";
- se uma refeicao estiver no documento sem dia/rotulo, use "Livre" e registre em warnings;
- refeicoes com horario somente quando existir;
- alimentos, quantidades, calorias e macros somente quando existirem;
- metas diárias e observações.`;
};

function normalizeImported(data: any, target: "treino" | "nutricao") {
  const warnings = Array.isArray(data?.warnings) ? data.warnings.filter(Boolean).map(String) : [];

  if (target === "treino") {
    const treino = data?.treino || {};
    const grupos = Array.isArray(treino.grupos) ? treino.grupos : [];
    return {
      target,
      confidence: Number(data?.confidence || 0),
      warnings,
      treino: {
        titulo: keepText(treino.titulo) || "Treino importado",
        dia: keepText(treino.dia) || "Livre",
        letra: treino.letra ? String(treino.letra).slice(0, 2).toUpperCase() : "",
        foco: keepText(treino.foco) || "hipertrofia",
        obs: keepText(treino.obs),
        grupos: grupos
          .map((grupo: any) => ({
            nome: keepText(grupo?.nome) || "Grupo sem nome",
            exercicios: (Array.isArray(grupo?.exercicios) ? grupo.exercicios : [])
              .map((ex: any) => ({
                nome: keepText(ex?.nome),
                series: keepNumber(ex?.series) ?? 0,
                repeticoes: keepText(ex?.repeticoes || ex?.reps),
                descanso: keepText(ex?.descanso),
                obs: keepText(ex?.obs || ex?.observacao),
                cadencia: keepText(ex?.cadencia),
                rpe: keepNumber(ex?.rpe),
              }))
              .filter((ex: any) => ex.nome),
          }))
          .filter((grupo: any) => grupo.exercicios.length > 0),
        cardio: treino.cardio || null,
      },
      nutricao: null,
    };
  }

  const nutricao = data?.nutricao || {};
  const dias = Array.isArray(nutricao.dias) ? nutricao.dias : [];
  return {
    target,
    confidence: Number(data?.confidence || 0),
    warnings,
    treino: null,
    nutricao: {
        titulo: keepText(nutricao.titulo) || "Cardápio importado",
      alunoNome: keepText(nutricao.alunoNome) || "Aluno",
      foco: keepText(nutricao.foco) || "manutencao",
      semana: keepText(nutricao.semana),
      calorias_dia: keepNumber(nutricao.calorias_dia),
      proteinas_dia: keepNumber(nutricao.proteinas_dia),
      obs: keepText(nutricao.obs),
      dias: dias
        .map((dia: any) => ({
          dia: keepText(dia?.dia) || "Livre",
          refeicoes: (Array.isArray(dia?.refeicoes) ? dia.refeicoes : [])
            .map((ref: any) => ({
              nome: keepText(ref?.nome) || "Refeicao sem nome",
              horario: keepText(ref?.horario),
              calorias: keepNumber(ref?.calorias),
              obs: keepText(ref?.obs),
              alimentos: (Array.isArray(ref?.alimentos) ? ref.alimentos : [])
                .map((al: any) => ({
                  nome: keepText(al?.nome),
                  quantidade: keepText(al?.quantidade),
                  calorias: keepNumber(al?.calorias),
                  proteinas: keepNumber(al?.proteinas),
                  carbos: keepNumber(al?.carbos),
                  gorduras: keepNumber(al?.gorduras),
                }))
                .filter((al: any) => al.nome),
            }))
            .filter((ref: any) => ref.alimentos.length > 0 || ref.obs),
        }))
        .filter((dia: any) => dia.refeicoes.length > 0),
    },
  };
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = await params;
    const communityId = resolvedParams.id;
    const form = await req.formData();
    const file = form.get("file");
    const target = String(form.get("target") || "").trim() as "treino" | "nutricao";
    const userId = String(form.get("userId") || "").trim();

    if (!communityId || !userId) {
      return NextResponse.json({ error: "Comunidade ou usuário ausente." }, { status: 400 });
    }

    if (target !== "treino" && target !== "nutricao") {
      return NextResponse.json({ error: "Tipo de importação inválido." }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Arquivo não enviado." }, { status: 400 });
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Arquivo vazio ou maior que 12MB." }, { status: 413 });
    }

    const mime = file.type || "application/octet-stream";
    if (!ALLOWED_MIME.has(mime) && !mime.startsWith("image/")) {
      return NextResponse.json({ error: "Envie um PDF ou imagem valida." }, { status: 415 });
    }

    const tags = await getUserCommunityTags(communityId, userId);
    if (!canImportFromTags(tags)) {
      return NextResponse.json({ error: "Sem permissão para importar documentos nesta comunidade." }, { status: 403 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY não configurada para leitura automática." }, { status: 503 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${mime};base64,${base64}`;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const content: any[] = [
      {
        type: "input_text",
        text: `${pickTruthfulTargetInstructions(target)}

Leia o documento enviado e extraia somente informacoes claramente presentes no proprio documento.
Não invente alunos, alimentos, exercícios, macros ou cargas que não estejam no documento.
Não preencha dia, horário, séries, repetições, descanso, calorias, macros ou quantidades com valores padrão.
Quando alguma informacao estiver ausente, deixe string vazia/null/0 conforme o tipo exigir e registre em warnings.
Preserve a verdade do documento: se ele disser "Dia 1", mantenha "Dia 1"; se disser "Terça", mantenha "Terça"; se não disser dia nenhum, use "Livre".
Responda sempre em JSON conforme o schema.`,
      },
    ];

    if (mime === "application/pdf") {
      content.push({ type: "input_file", filename: file.name || "documento.pdf", file_data: dataUrl });
    } else {
      content.push({ type: "input_image", detail: "high", image_url: dataUrl });
    }

    const response = await openai.responses.create({
      model: process.env.OPENAI_DOCUMENT_MODEL || "gpt-4o",
      input: [
        {
          role: "user",
          content,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "ativora_document_import",
          schema: responseSchema,
          strict: false,
        },
      },
      temperature: 0.1,
      max_output_tokens: 9000,
    } as any);

    const raw = cleanJson(response.output_text || "{}");
    const parsed = JSON.parse(raw);
    const normalized = normalizeImported(parsed, target);

    const empty =
      target === "treino"
        ? !normalized.treino?.grupos?.length
        : !normalized.nutricao?.dias?.length;

    if (empty) {
      return NextResponse.json(
        { error: "Não consegui identificar dados suficientes no documento.", result: normalized },
        { status: 422 }
      );
    }

    return NextResponse.json({ success: true, result: normalized });
  } catch (error: any) {
    console.error("[DOCUMENT_IMPORT]", error);
    return NextResponse.json(
      { error: error?.message || "Falha ao importar documento." },
      { status: 500 }
    );
  }
}
