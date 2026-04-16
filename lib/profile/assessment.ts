import type {
  PerfilAvaliacaoMedida,
  PerfilAvaliacaoResultado,
  RoleProfileConfig,
} from "./types";

export const ROLE_PROFILE_CONFIGS: RoleProfileConfig[] = [
  {
    role: "aluno",
    label: "Aluno",
    headline: "Base pessoal para treinos, cardápios e evolução.",
    accent: "text-sky-300",
    fields: [
      { key: "objetivoAtual", label: "Objetivo atual", placeholder: "Hipertrofia, emagrecimento, saúde..." },
      { key: "rotina", label: "Rotina de treino", type: "textarea", placeholder: "Dias disponíveis, horários e limitações." },
      { key: "experiencia", label: "Experiência", type: "select", options: ["Iniciante", "Intermediário", "Avançado"] },
      { key: "preferenciaAcompanhamento", label: "Acompanhamento", placeholder: "Online, presencial, comunidade..." },
    ],
  },
  {
    role: "personal",
    label: "Personal Trainer",
    headline: "Credenciais e estilo de atendimento para treinos.",
    accent: "text-emerald-300",
    fields: [
      { key: "cref", label: "CREF", placeholder: "Número do CREF" },
      { key: "especialidades", label: "Especialidades", type: "textarea", placeholder: "Hipertrofia, emagrecimento, funcional..." },
      { key: "publicoAtendido", label: "Público atendido", placeholder: "Iniciantes, atletas, idosos..." },
      { key: "modalidadeAtendimento", label: "Atendimento", type: "select", options: ["Online", "Presencial", "Híbrido"] },
      { key: "anosExperiencia", label: "Experiência", placeholder: "Ex.: 5 anos" },
    ],
  },
  {
    role: "instrutor",
    label: "Instrutor",
    headline: "Documento, modalidade e turmas atendidas.",
    accent: "text-cyan-300",
    fields: [
      { key: "documentoProfissional", label: "Documento profissional", placeholder: "Registro, certificado ou licença" },
      { key: "modalidade", label: "Modalidade", placeholder: "Musculação, luta, pilates, funcional..." },
      { key: "turmas", label: "Turmas", type: "textarea", placeholder: "Turmas, níveis e horários atendidos." },
      { key: "certificacoes", label: "Certificações", type: "textarea", placeholder: "Cursos e formações relevantes." },
    ],
  },
  {
    role: "nutri",
    label: "Nutricionista",
    headline: "Dados profissionais para cardápios e avaliações.",
    accent: "text-emerald-300",
    fields: [
      { key: "crn", label: "CRN", placeholder: "Número do CRN" },
      { key: "especialidades", label: "Especialidades", type: "textarea", placeholder: "Esportiva, clínica, emagrecimento..." },
      { key: "abordagem", label: "Abordagem", type: "textarea", placeholder: "Como você conduz ajustes e preferências alimentares." },
      { key: "tiposPlano", label: "Tipos de plano", placeholder: "Semanal, mensal, dieta flexível..." },
      { key: "restricoesAtendidas", label: "Restrições atendidas", placeholder: "Lactose, vegetarianismo, diabetes..." },
    ],
  },
  {
    role: "influencer",
    label: "Influencer",
    headline: "Posicionamento para presença social e parcerias.",
    accent: "text-amber-300",
    fields: [
      { key: "nicho", label: "Nicho", placeholder: "Fitness, lifestyle, nutrição..." },
      { key: "redePrincipal", label: "Rede principal", placeholder: "Instagram, TikTok, YouTube..." },
      { key: "publico", label: "Público", placeholder: "Quem acompanha seu conteúdo" },
      { key: "mediaKit", label: "Mídia kit ou link", placeholder: "URL pública" },
      { key: "objetivosParceria", label: "Objetivos de parceria", type: "textarea", placeholder: "O que você busca construir no app." },
    ],
  },
  {
    role: "default",
    label: "Perfil ativo",
    headline: "Dados básicos para usar o AtivoraFit com contexto.",
    accent: "text-sky-300",
    fields: [
      { key: "funcao", label: "Função principal", placeholder: "Como você usa o AtivoraFit" },
      { key: "observacoes", label: "Observações", type: "textarea", placeholder: "Dados que podem ajudar no atendimento futuro." },
    ],
  },
];

export const QUICK_MEASUREMENTS = [
  { categoria: "base", slug: "peso", nome: "Massa corporal", unidade: "kg" },
  { categoria: "base", slug: "altura", nome: "Estatura", unidade: "cm" },
  { categoria: "perimetros", slug: "cintura", nome: "Cintura", unidade: "cm" },
  { categoria: "perimetros", slug: "quadril", nome: "Quadril", unidade: "cm" },
] as const;

export const FULL_MEASUREMENTS = [
  ...QUICK_MEASUREMENTS,
  { categoria: "dobras", slug: "dobra_tricipital", nome: "Dobra tricipital", unidade: "mm" },
  { categoria: "dobras", slug: "dobra_subescapular", nome: "Dobra subescapular", unidade: "mm" },
  { categoria: "dobras", slug: "dobra_bicipital", nome: "Dobra bicipital", unidade: "mm" },
  { categoria: "dobras", slug: "dobra_axilar", nome: "Dobra axilar", unidade: "mm" },
  { categoria: "dobras", slug: "dobra_iliaca", nome: "Dobra ilíaca", unidade: "mm" },
  { categoria: "dobras", slug: "dobra_supraespinhal", nome: "Dobra supraespinhal", unidade: "mm" },
  { categoria: "dobras", slug: "dobra_abdominal", nome: "Dobra abdominal", unidade: "mm" },
  { categoria: "dobras", slug: "dobra_coxa", nome: "Dobra da coxa", unidade: "mm" },
  { categoria: "dobras", slug: "dobra_panturrilha", nome: "Dobra da panturrilha", unidade: "mm" },
  { categoria: "perimetros", slug: "braco_relaxado", nome: "Braço direito relaxado", unidade: "cm" },
  { categoria: "perimetros", slug: "braco_contraido", nome: "Braço direito contraído", unidade: "cm" },
  { categoria: "perimetros", slug: "braco_esquerdo_relaxado", nome: "Braço esquerdo relaxado", unidade: "cm" },
  { categoria: "perimetros", slug: "braco_esquerdo_contraido", nome: "Braço esquerdo contraído", unidade: "cm" },
  { categoria: "perimetros", slug: "torax", nome: "Tórax", unidade: "cm" },
  { categoria: "perimetros", slug: "coxa_direita", nome: "Coxa direita", unidade: "cm" },
  { categoria: "perimetros", slug: "coxa_esquerda", nome: "Coxa esquerda", unidade: "cm" },
  { categoria: "perimetros", slug: "panturrilha_direita", nome: "Panturrilha direita", unidade: "cm" },
  { categoria: "perimetros", slug: "panturrilha_esquerda", nome: "Panturrilha esquerda", unidade: "cm" },
  { categoria: "diametros", slug: "diametro_umero", nome: "Diâmetro do úmero", unidade: "cm" },
  { categoria: "diametros", slug: "diametro_femur", nome: "Diâmetro do fêmur", unidade: "cm" },
] as const;

export const ADVANCED_PROTOCOLS = [
  "Durnin & Womersley (1974)",
  "Forsith & Sinning (1973)",
  "Katch & McArdle (1973)",
  "Sloan (1967)",
  "Sloan, Burt & Blyth (1962)",
  "Thorland & cols (1984)",
  "Wilmore & Behnke (1969)",
  "Withers & cols (1987)",
  "Yuhasz (1974)",
  "Guedes (1985)",
  "Petroski (1995)",
  "Slaughter & cols (1988)",
  "Faulkner (1968)",
  "Williams & cols (1993)",
] as const;

function asNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function round(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2) return sorted[middle];
  return (sorted[middle - 1] + sorted[middle]) / 2;
}

export function normalizeMeasurement(measure: PerfilAvaliacaoMedida): PerfilAvaliacaoMedida {
  const values = [asNumber(measure.rodada1), asNumber(measure.rodada2), asNumber(measure.rodada3)]
    .filter((value): value is number => value !== null);
  const mediana = values.length ? round(median(values), 2) : null;
  const erroPercentual = values.length >= 2 && mediana
    ? round(((Math.max(...values) - Math.min(...values)) / mediana) * 100, 2)
    : null;

  return {
    ...measure,
    rodada1: asNumber(measure.rodada1),
    rodada2: asNumber(measure.rodada2),
    rodada3: asNumber(measure.rodada3),
    mediana,
    erroPercentual,
    consistencia: erroPercentual == null
      ? null
      : erroPercentual <= 5
        ? "Boa consistência"
        : "Revisar medida",
  };
}

function getMeasure(measures: PerfilAvaliacaoMedida[], slug: string) {
  return measures.find(item => item.slug === slug)?.mediana ?? null;
}

function classifyImc(imc: number) {
  if (imc < 18.5) return "Abaixo do peso";
  if (imc < 25) return "Desejável";
  if (imc < 30) return "Sobrepeso";
  if (imc < 35) return "Obesidade grau 1";
  if (imc < 40) return "Obesidade grau 2";
  return "Obesidade grau 3";
}

function ageFromDate(date?: string | null) {
  if (!date) return 30;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 30;
  const today = new Date();
  let age = today.getFullYear() - parsed.getFullYear();
  const m = today.getMonth() - parsed.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < parsed.getDate())) age -= 1;
  return Math.max(20, Math.min(69, age));
}

function rcqBand(sexo: string, idade: number) {
  const female = sexo === "feminino";
  const bands = female
    ? [
        { min: 20, low: 0.71, moderate: 0.77, high: 0.82 },
        { min: 30, low: 0.72, moderate: 0.78, high: 0.84 },
        { min: 40, low: 0.73, moderate: 0.79, high: 0.87 },
        { min: 50, low: 0.74, moderate: 0.81, high: 0.88 },
        { min: 60, low: 0.76, moderate: 0.83, high: 0.90 },
      ]
    : [
        { min: 20, low: 0.83, moderate: 0.88, high: 0.94 },
        { min: 30, low: 0.84, moderate: 0.91, high: 0.96 },
        { min: 40, low: 0.88, moderate: 0.95, high: 1.0 },
        { min: 50, low: 0.90, moderate: 0.96, high: 1.02 },
        { min: 60, low: 0.91, moderate: 0.98, high: 1.03 },
      ];
  return [...bands].reverse().find(item => idade >= item.min) ?? bands[0];
}

function classifyRcq(rcq: number, sexo: string, idade: number) {
  const band = rcqBand(sexo, idade);
  if (rcq < band.low) return "Baixo";
  if (rcq <= band.moderate) return "Moderado";
  if (rcq <= band.high) return "Alto";
  return "Muito alto";
}

export function calculateAssessmentResults(input: {
  medidas: PerfilAvaliacaoMedida[];
  sexo?: string | null;
  dataNascimento?: string | null;
  percentualGorduraInformado?: number | null;
}) {
  const medidas = input.medidas.map(normalizeMeasurement);
  const results: PerfilAvaliacaoResultado[] = [];
  const peso = getMeasure(medidas, "peso");
  const altura = getMeasure(medidas, "altura");
  const cintura = getMeasure(medidas, "cintura");
  const quadril = getMeasure(medidas, "quadril");
  const sexo = String(input.sexo || "masculino").toLowerCase().includes("fem") ? "feminino" : "masculino";
  const idade = ageFromDate(input.dataNascimento);

  if (peso && altura) {
    const imc = peso / ((altura / 100) ** 2);
    results.push({
      metodo: "IMC",
      valor: round(imc, 1),
      unidade: "kg/m²",
      classificacao: classifyImc(imc),
      observacao: "Indicador geral de massa corporal. Não substitui avaliação profissional.",
      origem: "calculado",
    });
  }

  if (cintura && quadril) {
    const rcq = cintura / quadril;
    results.push({
      metodo: "RCQ",
      valor: round(rcq, 2),
      unidade: "razão",
      classificacao: classifyRcq(rcq, sexo, idade),
      observacao: "Relação cintura-quadril classificada por sexo e faixa etária.",
      origem: "calculado",
    });
  }

  let gorduraPercentual = asNumber(input.percentualGorduraInformado);
  if (altura && cintura) {
    const rfm = sexo === "feminino"
      ? 76 - (20 * (altura / cintura))
      : 64 - (20 * (altura / cintura));
    const safeRfm = Math.max(2, Math.min(65, rfm));
    gorduraPercentual = gorduraPercentual ?? safeRfm;
    results.push({
      metodo: "RFM",
      valor: round(safeRfm, 1),
      unidade: "%",
      classificacao: "Estimativa de apoio",
      observacao: "Estimativa por altura e cintura; deve ser revisada por profissional.",
      origem: "calculado",
    });
  } else if (gorduraPercentual) {
    results.push({
      metodo: "% de gordura informado",
      valor: round(gorduraPercentual, 1),
      unidade: "%",
      classificacao: "Informado manualmente",
      observacao: "Resultado registrado pelo usuário ou profissional.",
      origem: "manual",
    });
  }

  if (peso && gorduraPercentual) {
    const massaGorda = peso * (gorduraPercentual / 100);
    const massaMagra = peso - massaGorda;
    results.push({
      metodo: "Massa gorda estimada",
      valor: round(massaGorda, 1),
      unidade: "kg",
      classificacao: "Estimativa",
      observacao: "Calculada a partir do percentual de gordura disponível.",
      origem: "calculado",
    });
    results.push({
      metodo: "Massa magra estimada",
      valor: round(massaMagra, 1),
      unidade: "kg",
      classificacao: "Estimativa",
      observacao: "Calculada a partir do percentual de gordura disponível.",
      origem: "calculado",
    });
  }

  return { medidas, resultados: results };
}

export function getRoleConfig(role?: string | null) {
  const normalized = String(role || "default").toLowerCase();
  if (normalized === "nutricionista") return ROLE_PROFILE_CONFIGS.find(item => item.role === "nutri")!;
  return ROLE_PROFILE_CONFIGS.find(item => item.role === normalized) ?? ROLE_PROFILE_CONFIGS.find(item => item.role === "default")!;
}
