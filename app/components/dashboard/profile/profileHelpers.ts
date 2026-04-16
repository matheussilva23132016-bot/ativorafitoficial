import {
  FULL_MEASUREMENTS,
  QUICK_MEASUREMENTS,
} from "@/lib/profile/assessment";
import type {
  PerfilAvaliacao,
  PerfilAvaliacaoMedida,
  PerfilAvaliacaoTipo,
  PerfilComplementar,
  PerfilUserSummary,
} from "@/lib/profile/types";

export const PARQ_QUESTIONS = [
  "Você já recebeu orientação médica para evitar exercícios?",
  "Você sente dores no peito ou dificuldade para respirar em esforço?",
  "Você sente tontura, desmaio ou perda de equilíbrio?",
  "Você faz uso contínuo de algum medicamento?",
  "Você possui alergia, asma, bronquite ou reação importante?",
  "Você já teve lesão, fratura, torção, luxação ou rompimento?",
  "Você sentiu dores persistentes pelo corpo nos últimos meses?",
];

export const typeLabels = {
  anamnese: { label: "Anamnese e PAR-Q", desc: "Objetivo, segurança e observações iniciais." },
  rapida: { label: "Avaliação rápida", desc: "Peso, altura, cintura, quadril, IMC, RCQ e RFM." },
  completa: { label: "Antropometria completa", desc: "Dobras, perímetros e diâmetros com três rodadas." },
  laudo: { label: "Laudo e parecer", desc: "Protocolo, resultado manual e recomendações." },
} satisfies Record<PerfilAvaliacaoTipo, { label: string; desc: string }>;

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function emptyProfile(user: any, summary?: PerfilUserSummary | null): PerfilComplementar {
  return {
    userId: summary?.id ?? user?.id ?? "",
    role: summary?.role ?? user?.role ?? "aluno",
    objetivoPrincipal: "",
    nivel: "",
    frequencia: "",
    restricoes: "",
    disponibilidade: "",
    preferenciasTreino: "",
    preferenciasNutricao: "",
    privacidadeDados: "privado",
    dadosCargo: {},
    progresso: 0,
  };
}

export function templateMeasures(tipo: PerfilAvaliacaoTipo): PerfilAvaliacaoMedida[] {
  if (tipo === "anamnese") return [];
  const source = tipo === "completa" ? FULL_MEASUREMENTS : QUICK_MEASUREMENTS;
  return source.map(item => ({
    categoria: item.categoria,
    slug: item.slug,
    nome: item.nome,
    unidade: item.unidade,
    rodada1: null,
    rodada2: null,
    rodada3: null,
    mediana: null,
    erroPercentual: null,
    consistencia: null,
  }));
}

export function emptyAssessment(user?: PerfilUserSummary | null, tipo: PerfilAvaliacaoTipo = "rapida"): PerfilAvaliacao {
  return {
    tipo,
    titulo: typeLabels[tipo].label,
    status: "rascunho",
    dataAvaliacao: today(),
    dataReavaliacao: "",
    objetivo: "",
    sexo: String(user?.genero || "").toLowerCase().includes("fem") ? "feminino" : "masculino",
    dataNascimento: user?.dataNascimento ?? "",
    parq: {},
    protocolo: "",
    percentualGorduraInformado: null,
    parecerFinal: "",
    observacoes: "",
    medidas: templateMeasures(tipo),
    resultados: [],
  };
}
