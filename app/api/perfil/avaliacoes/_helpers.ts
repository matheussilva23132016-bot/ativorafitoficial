import { randomUUID } from "crypto";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateAssessmentResults } from "@/lib/profile/assessment";
import {
  cleanNumber,
  cleanText,
  ensureProfileTables,
  mapAssessment,
  mapMeasure,
  mapResult,
  mapUser,
} from "@/lib/profile/storage";
import type { PerfilAvaliacao, PerfilAvaliacaoMedida, PerfilAvaliacaoTipo } from "@/lib/profile/types";

const VALID_TYPES = new Set(["anamnese", "rapida", "completa", "laudo"]);

export async function getSessionUser() {
  const session = await getServerSession(authOptions) as any;
  if (!session?.user?.id) return null;

  const [rows] = await db.execute(
    `SELECT id, email, full_name, nickname, avatar_url, role, genero, data_nascimento
     FROM ativora_users
     WHERE id = ?
     LIMIT 1`,
    [session.user.id],
  );

  return (rows as any[])[0] ? mapUser((rows as any[])[0]) : null;
}

export function normalizeAssessmentPayload(body: any, user: any, assessmentId?: string) {
  const tipo = VALID_TYPES.has(body?.tipo) ? body.tipo as PerfilAvaliacaoTipo : "rapida";
  const rawMeasures = Array.isArray(body?.medidas) ? body.medidas : [];
  const medidas: PerfilAvaliacaoMedida[] = rawMeasures.map((measure: any) => ({
    categoria: cleanText(measure?.categoria, 50) || "base",
    slug: cleanText(measure?.slug, 90),
    nome: cleanText(measure?.nome, 160),
    unidade: cleanText(measure?.unidade, 20) || "cm",
    rodada1: cleanNumber(measure?.rodada1),
    rodada2: cleanNumber(measure?.rodada2),
    rodada3: cleanNumber(measure?.rodada3),
  })).filter((measure: PerfilAvaliacaoMedida) => measure.slug && measure.nome);

  const sexo = body?.sexo === "feminino" || body?.sexo === "masculino"
    ? body.sexo
    : String(user?.genero || "").toLowerCase().includes("fem")
      ? "feminino"
      : "masculino";
  const dataNascimento = cleanText(body?.dataNascimento || user?.dataNascimento, 10);
  const percentualGorduraInformado = cleanNumber(body?.percentualGorduraInformado);
  const calculated = calculateAssessmentResults({ medidas, sexo, dataNascimento, percentualGorduraInformado });

  return {
    id: assessmentId || cleanText(body?.id, 36) || randomUUID(),
    tipo,
    titulo: cleanText(body?.titulo, 160) || (
      tipo === "anamnese" ? "Anamnese e PAR-Q" :
      tipo === "completa" ? "Antropometria completa" :
      tipo === "laudo" ? "Laudo e parecer" :
      "Avaliação rápida"
    ),
    status: body?.status === "salvo" ? "salvo" : "rascunho",
    dataAvaliacao: cleanText(body?.dataAvaliacao, 10) || new Date().toISOString().slice(0, 10),
    dataReavaliacao: cleanText(body?.dataReavaliacao, 10) || null,
    objetivo: cleanText(body?.objetivo),
    sexo,
    dataNascimento: dataNascimento || null,
    parq: body?.parq && typeof body.parq === "object" ? body.parq : {},
    protocolo: cleanText(body?.protocolo, 140),
    percentualGorduraInformado,
    parecerFinal: cleanText(body?.parecerFinal),
    observacoes: cleanText(body?.observacoes),
    medidas: calculated.medidas,
    resultados: calculated.resultados,
  };
}

export async function loadAssessments(userId: string, assessmentId?: string) {
  await ensureProfileTables();
  const [assessmentRows] = await db.execute(
    `
      SELECT *
      FROM perfil_avaliacoes
      WHERE user_id = ?
        ${assessmentId ? "AND id = ?" : ""}
      ORDER BY COALESCE(data_avaliacao, created_at) DESC, created_at DESC
      ${assessmentId ? "" : "LIMIT 1"}
    `,
    assessmentId ? [userId, assessmentId] : [userId],
  );
  const assessments = assessmentRows as any[];
  if (assessments.length === 0) return [];

  const ids = assessments.map(item => item.id);
  const placeholders = ids.map(() => "?").join(",");
  const [measureRows] = await db.execute(
    `SELECT * FROM perfil_avaliacao_medidas WHERE avaliacao_id IN (${placeholders}) ORDER BY categoria, nome`,
    ids,
  );
  const [resultRows] = await db.execute(
    `SELECT * FROM perfil_avaliacao_resultados WHERE avaliacao_id IN (${placeholders}) ORDER BY created_at, metodo`,
    ids,
  );

  return assessments.map(row => mapAssessment(
    row,
    (measureRows as any[]).filter(item => item.avaliacao_id === row.id).map(mapMeasure),
    (resultRows as any[]).filter(item => item.avaliacao_id === row.id).map(mapResult),
  ));
}

export async function assertOwnAssessment(userId: string, assessmentId: string) {
  await ensureProfileTables();
  const [rows] = await db.execute(
    "SELECT id FROM perfil_avaliacoes WHERE id = ? AND user_id = ? LIMIT 1",
    [assessmentId, userId],
  );
  return (rows as any[]).length > 0;
}

export async function saveAssessment(userId: string, payload: ReturnType<typeof normalizeAssessmentPayload>) {
  await ensureProfileTables();
  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    await conn.execute(
      `
        INSERT INTO perfil_avaliacoes (
          id, user_id, tipo, titulo, status, data_avaliacao, data_reavaliacao,
          objetivo, sexo, data_nascimento, parq_json, protocolo,
          percentual_gordura_informado, parecer_final, observacoes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          tipo = VALUES(tipo),
          titulo = VALUES(titulo),
          status = VALUES(status),
          data_avaliacao = VALUES(data_avaliacao),
          data_reavaliacao = VALUES(data_reavaliacao),
          objetivo = VALUES(objetivo),
          sexo = VALUES(sexo),
          data_nascimento = VALUES(data_nascimento),
          parq_json = VALUES(parq_json),
          protocolo = VALUES(protocolo),
          percentual_gordura_informado = VALUES(percentual_gordura_informado),
          parecer_final = VALUES(parecer_final),
          observacoes = VALUES(observacoes),
          updated_at = CURRENT_TIMESTAMP
      `,
      [
        payload.id,
        userId,
        payload.tipo,
        payload.titulo,
        payload.status,
        payload.dataAvaliacao || null,
        payload.dataReavaliacao || null,
        payload.objetivo || null,
        payload.sexo,
        payload.dataNascimento || null,
        JSON.stringify(payload.parq),
        payload.protocolo || null,
        payload.percentualGorduraInformado,
        payload.parecerFinal || null,
        payload.observacoes || null,
      ],
    );

    await conn.execute("DELETE FROM perfil_avaliacao_medidas WHERE avaliacao_id = ? AND user_id = ?", [payload.id, userId]);
    await conn.execute("DELETE FROM perfil_avaliacao_resultados WHERE avaliacao_id = ? AND user_id = ?", [payload.id, userId]);

    for (const measure of payload.medidas) {
      await conn.execute(
        `
          INSERT INTO perfil_avaliacao_medidas (
            id, avaliacao_id, user_id, categoria, slug, nome, unidade,
            rodada1, rodada2, rodada3, mediana, erro_percentual, consistencia
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          randomUUID(),
          payload.id,
          userId,
          measure.categoria,
          measure.slug,
          measure.nome,
          measure.unidade,
          measure.rodada1 ?? null,
          measure.rodada2 ?? null,
          measure.rodada3 ?? null,
          measure.mediana ?? null,
          measure.erroPercentual ?? null,
          measure.consistencia ?? null,
        ],
      );
    }

    for (const result of payload.resultados) {
      await conn.execute(
        `
          INSERT INTO perfil_avaliacao_resultados (
            id, avaliacao_id, user_id, metodo, valor, unidade, classificacao, observacao, origem
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          randomUUID(),
          payload.id,
          userId,
          result.metodo,
          result.valor,
          result.unidade,
          result.classificacao ?? null,
          result.observacao ?? null,
          result.origem,
        ],
      );
    }

    await conn.execute(
      "DELETE FROM perfil_avaliacao_medidas WHERE user_id = ? AND avaliacao_id <> ?",
      [userId, payload.id],
    );
    await conn.execute(
      "DELETE FROM perfil_avaliacao_resultados WHERE user_id = ? AND avaliacao_id <> ?",
      [userId, payload.id],
    );
    await conn.execute(
      "DELETE FROM perfil_avaliacoes WHERE user_id = ? AND id <> ?",
      [userId, payload.id],
    );

    await conn.commit();
    conn.release();
  } catch (error) {
    await conn.rollback();
    conn.release();
    throw error;
  }

  const saved = await loadAssessments(userId, payload.id);
  return saved[0] as PerfilAvaliacao;
}
