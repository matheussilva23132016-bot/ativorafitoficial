import { db } from "@/lib/db";
import type {
  PerfilAvaliacao,
  PerfilAvaliacaoMedida,
  PerfilAvaliacaoResultado,
  PerfilComplementar,
  PerfilUserSummary,
} from "./types";

let setupPromise: Promise<void> | null = null;

export function parseJson<T>(value: unknown, fallback: T): T {
  if (value == null || value === "") return fallback;
  if (typeof value !== "string") return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function toDateString(value: unknown) {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? String(value).slice(0, 10) : parsed.toISOString().slice(0, 10);
}

export function toDateTime(value: unknown) {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();
}

export function cleanText(value: unknown, max = 5000) {
  const text = String(value ?? "").trim();
  return text ? text.slice(0, max) : "";
}

export function cleanNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

export function calculateProfileProgress(profile: Partial<PerfilComplementar>) {
  const common = [
    profile.objetivoPrincipal,
    profile.nivel,
    profile.frequencia,
    profile.disponibilidade,
    profile.preferenciasTreino,
    profile.preferenciasNutricao,
  ];
  const roleValues = Object.values(profile.dadosCargo ?? {});
  const all = [...common, ...roleValues];
  const filled = all.filter(value => String(value ?? "").trim()).length;
  return all.length === 0 ? 0 : Math.min(100, Math.round((filled / all.length) * 100));
}

export async function ensureProfileTables() {
  if (setupPromise) return setupPromise;

  setupPromise = (async () => {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS perfil_complementar (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'aluno',
        objetivo_principal VARCHAR(180) NULL,
        nivel VARCHAR(60) NULL,
        frequencia VARCHAR(80) NULL,
        restricoes TEXT NULL,
        disponibilidade TEXT NULL,
        preferencias_treino TEXT NULL,
        preferencias_nutricao TEXT NULL,
        privacidade_dados VARCHAR(30) NOT NULL DEFAULT 'privado',
        dados_cargo_json JSON NULL,
        progresso TINYINT UNSIGNED NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_perfil_complementar_user (user_id),
        INDEX idx_perfil_complementar_role (role),
        INDEX idx_perfil_complementar_updated (updated_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS perfil_avaliacoes (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        tipo VARCHAR(40) NOT NULL DEFAULT 'rapida',
        titulo VARCHAR(160) NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'rascunho',
        data_avaliacao DATE NULL,
        data_reavaliacao DATE NULL,
        objetivo TEXT NULL,
        sexo VARCHAR(20) NULL,
        data_nascimento DATE NULL,
        parq_json JSON NULL,
        protocolo VARCHAR(140) NULL,
        percentual_gordura_informado DECIMAL(6,2) NULL,
        parecer_final TEXT NULL,
        observacoes TEXT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_perfil_avaliacoes_user (user_id),
        INDEX idx_perfil_avaliacoes_tipo (tipo),
        INDEX idx_perfil_avaliacoes_status (status),
        INDEX idx_perfil_avaliacoes_data (data_avaliacao)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS perfil_avaliacao_medidas (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        avaliacao_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(50) NOT NULL,
        categoria VARCHAR(50) NOT NULL,
        slug VARCHAR(90) NOT NULL,
        nome VARCHAR(160) NOT NULL,
        unidade VARCHAR(20) NOT NULL,
        rodada1 DECIMAL(10,2) NULL,
        rodada2 DECIMAL(10,2) NULL,
        rodada3 DECIMAL(10,2) NULL,
        mediana DECIMAL(10,2) NULL,
        erro_percentual DECIMAL(8,2) NULL,
        consistencia VARCHAR(40) NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_perfil_medidas_avaliacao (avaliacao_id),
        INDEX idx_perfil_medidas_user (user_id),
        INDEX idx_perfil_medidas_slug (slug)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS perfil_avaliacao_resultados (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        avaliacao_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(50) NOT NULL,
        metodo VARCHAR(120) NOT NULL,
        valor DECIMAL(10,2) NOT NULL,
        unidade VARCHAR(30) NOT NULL,
        classificacao VARCHAR(120) NULL,
        observacao TEXT NULL,
        origem VARCHAR(30) NOT NULL DEFAULT 'calculado',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_perfil_resultados_avaliacao (avaliacao_id),
        INDEX idx_perfil_resultados_user (user_id),
        INDEX idx_perfil_resultados_metodo (metodo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  })();

  return setupPromise;
}

export function mapUser(row: any): PerfilUserSummary {
  return {
    id: String(row.id),
    fullName: row.full_name ?? "",
    nickname: row.nickname ?? "",
    email: row.email ?? "",
    avatarUrl: row.avatar_url ?? null,
    role: row.role ?? "aluno",
    genero: row.genero ?? null,
    dataNascimento: toDateString(row.data_nascimento),
  };
}

export function mapProfile(row: any, user: PerfilUserSummary): PerfilComplementar {
  return {
    id: row?.id,
    userId: user.id,
    role: row?.role ?? user.role ?? "aluno",
    objetivoPrincipal: row?.objetivo_principal ?? "",
    nivel: row?.nivel ?? "",
    frequencia: row?.frequencia ?? "",
    restricoes: row?.restricoes ?? "",
    disponibilidade: row?.disponibilidade ?? "",
    preferenciasTreino: row?.preferencias_treino ?? "",
    preferenciasNutricao: row?.preferencias_nutricao ?? "",
    privacidadeDados: row?.privacidade_dados ?? "privado",
    dadosCargo: parseJson<Record<string, string>>(row?.dados_cargo_json, {}),
    progresso: Number(row?.progresso ?? 0),
    updatedAt: toDateTime(row?.updated_at),
  };
}

export function mapMeasure(row: any): PerfilAvaliacaoMedida {
  return {
    id: row.id,
    categoria: row.categoria,
    slug: row.slug,
    nome: row.nome,
    unidade: row.unidade,
    rodada1: cleanNumber(row.rodada1),
    rodada2: cleanNumber(row.rodada2),
    rodada3: cleanNumber(row.rodada3),
    mediana: cleanNumber(row.mediana),
    erroPercentual: cleanNumber(row.erro_percentual),
    consistencia: row.consistencia ?? null,
  };
}

export function mapResult(row: any): PerfilAvaliacaoResultado {
  return {
    id: row.id,
    metodo: row.metodo,
    valor: Number(row.valor ?? 0),
    unidade: row.unidade,
    classificacao: row.classificacao ?? null,
    observacao: row.observacao ?? null,
    origem: row.origem === "manual" ? "manual" : "calculado",
  };
}

export function mapAssessment(
  row: any,
  medidas: PerfilAvaliacaoMedida[] = [],
  resultados: PerfilAvaliacaoResultado[] = [],
): PerfilAvaliacao {
  return {
    id: row.id,
    userId: row.user_id,
    tipo: row.tipo ?? "rapida",
    titulo: row.titulo ?? "Avaliação",
    status: row.status === "salvo" ? "salvo" : "rascunho",
    dataAvaliacao: toDateString(row.data_avaliacao),
    dataReavaliacao: toDateString(row.data_reavaliacao),
    objetivo: row.objetivo ?? "",
    sexo: row.sexo === "feminino" ? "feminino" : row.sexo === "masculino" ? "masculino" : undefined,
    dataNascimento: toDateString(row.data_nascimento),
    parq: parseJson<Record<string, string>>(row.parq_json, {}),
    protocolo: row.protocolo ?? "",
    percentualGorduraInformado: cleanNumber(row.percentual_gordura_informado),
    parecerFinal: row.parecer_final ?? "",
    observacoes: row.observacoes ?? "",
    medidas,
    resultados,
    createdAt: toDateTime(row.created_at),
    updatedAt: toDateTime(row.updated_at),
  };
}
