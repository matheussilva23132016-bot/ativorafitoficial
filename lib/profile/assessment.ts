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
  { categoria: "perimetros", slug: "pescoco", nome: "Pescoço", unidade: "cm" },
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

function classifyRcq(rcq: number, sexo: "masculino" | "feminino") {
  // Referencia: WHO (2011) waist circumference and waist-hip ratio report.
  if (sexo === "feminino") {
    if (rcq <= 0.85) return "Risco reduzido";
    if (rcq <= 0.9) return "Risco aumentado";
    return "Risco muito aumentado";
  }
  if (rcq <= 0.9) return "Risco reduzido";
  if (rcq <= 1.0) return "Risco aumentado";
  return "Risco muito aumentado";
}

function classifyWaistCircumference(cintura: number, sexo: "masculino" | "feminino") {
  // Referencia: WHO (2011), pontos de corte por sexo para cintura.
  if (sexo === "feminino") {
    if (cintura < 80) return "Risco reduzido";
    if (cintura < 88) return "Risco aumentado";
    return "Risco muito aumentado";
  }
  if (cintura < 94) return "Risco reduzido";
  if (cintura < 102) return "Risco aumentado";
  return "Risco muito aumentado";
}

function classifyRce(rce: number) {
  if (rce < 0.4) return "Baixo";
  if (rce < 0.5) return "Adequado";
  if (rce < 0.6) return "Alto";
  return "Muito alto";
}

function classifyBodyFat(percentual: number, sexo: "masculino" | "feminino") {
  if (sexo === "feminino") {
    if (percentual < 14) return "Muito baixo";
    if (percentual < 21) return "Atletico";
    if (percentual < 33) return "Saudavel";
    if (percentual < 40) return "Elevado";
    return "Muito elevado";
  }
  if (percentual < 6) return "Muito baixo";
  if (percentual < 14) return "Atletico";
  if (percentual < 25) return "Saudavel";
  if (percentual < 31) return "Elevado";
  return "Muito elevado";
}

function classifyFfmi(ffmi: number, sexo: "masculino" | "feminino") {
  if (sexo === "feminino") {
    if (ffmi < 14) return "Baixo";
    if (ffmi < 17) return "Moderado";
    return "Elevado";
  }
  if (ffmi < 17) return "Baixo";
  if (ffmi < 20) return "Moderado";
  return "Elevado";
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
  const pescoco = getMeasure(medidas, "pescoco");
  const cintura = getMeasure(medidas, "cintura");
  const quadril = getMeasure(medidas, "quadril");
  const sexo = String(input.sexo || "masculino").toLowerCase().includes("fem") ? "feminino" : "masculino";
  const idade = ageFromDate(input.dataNascimento);
  const alturaM = altura ? altura / 100 : null;

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

  if (cintura) {
    results.push({
      metodo: "Circunferência da cintura",
      valor: round(cintura, 1),
      unidade: "cm",
      classificacao: classifyWaistCircumference(cintura, sexo),
      observacao: "Classificação por sexo para risco cardiometabólico (referência WHO).",
      origem: "calculado",
    });
  }

  if (cintura && altura) {
    const rce = cintura / altura;
    results.push({
      metodo: "RCEst",
      valor: round(rce, 2),
      unidade: "razão",
      classificacao: classifyRce(rce),
      observacao: "Relação cintura-estatura para risco cardiometabólico.",
      origem: "calculado",
    });
  }

  if (cintura && quadril) {
    const rcq = cintura / quadril;
    results.push({
      metodo: "RCQ",
      valor: round(rcq, 2),
      unidade: "razão",
      classificacao: classifyRcq(rcq, sexo),
      observacao: "Relação cintura-quadril com faixas diferentes para homens e mulheres.",
      origem: "calculado",
    });
  }

  let gorduraNavy: number | null = null;
  if (altura && cintura && pescoco) {
    if (sexo === "masculino") {
      const diff = cintura - pescoco;
      if (diff > 0) {
        const densidade = 1.0324 - (0.19077 * Math.log10(diff)) + (0.15456 * Math.log10(altura));
        const valor = (495 / densidade) - 450;
        if (Number.isFinite(valor)) gorduraNavy = Math.max(2, Math.min(65, valor));
      }
    } else if (quadril) {
      const diff = cintura + quadril - pescoco;
      if (diff > 0) {
        const densidade = 1.29579 - (0.35004 * Math.log10(diff)) + (0.221 * Math.log10(altura));
        const valor = (495 / densidade) - 450;
        if (Number.isFinite(valor)) gorduraNavy = Math.max(2, Math.min(65, valor));
      }
    }
  }

  if (gorduraNavy != null) {
    results.push({
      metodo: "% de gordura (US Navy)",
      valor: round(gorduraNavy, 1),
      unidade: "%",
      classificacao: classifyBodyFat(gorduraNavy, sexo),
      observacao: "Estimativa por circunferências (pescoço, cintura, altura e quadril para mulheres).",
      origem: "calculado",
    });
  }

  let gorduraPercentual = asNumber(input.percentualGorduraInformado);
  if (altura && cintura) {
    // Referencia: Woolcott & Bergman (2018), Relative Fat Mass (RFM).
    const rfm = sexo === "feminino"
      ? 76 - (20 * (altura / cintura))
      : 64 - (20 * (altura / cintura));
    const safeRfm = Math.max(2, Math.min(65, rfm));
    gorduraPercentual = gorduraPercentual ?? gorduraNavy ?? safeRfm;
    results.push({
      metodo: "RFM",
      valor: round(safeRfm, 1),
      unidade: "%",
      classificacao: classifyBodyFat(safeRfm, sexo),
      observacao: "Estimativa por altura e cintura; deve ser revisada por profissional.",
      origem: "calculado",
    });
  } else if (gorduraPercentual) {
    results.push({
      metodo: "% de gordura informado",
      valor: round(gorduraPercentual, 1),
      unidade: "%",
      classificacao: classifyBodyFat(gorduraPercentual, sexo),
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

  if (peso && gorduraPercentual && alturaM) {
    const massaMagra = peso - (peso * (gorduraPercentual / 100));
    const ffmi = massaMagra / (alturaM ** 2);
    results.push({
      metodo: "FFMI estimado",
      valor: round(ffmi, 1),
      unidade: "kg/m2",
      classificacao: classifyFfmi(ffmi, sexo),
      observacao: "Indice de massa magra ajustado por estatura.",
      origem: "calculado",
    });
  }

  if (peso && altura) {
    // Referencia: Mifflin-St Jeor (1990), equacoes diferentes por sexo.
    const tmb = sexo === "feminino"
      ? (10 * peso) + (6.25 * altura) - (5 * idade) - 161
      : (10 * peso) + (6.25 * altura) - (5 * idade) + 5;
    const manutencao = tmb * 1.45;
    results.push({
      metodo: "TMB estimada",
      valor: round(tmb, 0),
      unidade: "kcal/dia",
      classificacao: "Mifflin-St Jeor",
      observacao: "Taxa metabolica basal estimada para ponto de partida.",
      origem: "calculado",
    });
    results.push({
      metodo: "Gasto diario estimado",
      valor: round(manutencao, 0),
      unidade: "kcal/dia",
      classificacao: "Atividade moderada (1.45)",
      observacao: "Estimativa inicial para manutencao calorica.",
      origem: "calculado",
    });
  }

  if (alturaM) {
    const pesoAlvo = 22 * (alturaM ** 2);
    const diferenca = peso ? round(peso - pesoAlvo, 1) : null;
    results.push({
      metodo: "Peso alvo (IMC 22)",
      valor: round(pesoAlvo, 1),
      unidade: "kg",
      classificacao:
        diferenca == null
          ? "Referencia"
          : diferenca > 0
            ? `Ajustar -${Math.abs(diferenca)}kg`
            : `Faixa ok (+${Math.abs(diferenca)}kg)`,
      observacao: "Referencia geral para acompanhamento.",
      origem: "calculado",
    });
  }

  if (peso && altura) {
    const superficieCorporal = 0.007184 * (peso ** 0.425) * (altura ** 0.725);
    results.push({
      metodo: "Superficie corporal",
      valor: round(superficieCorporal, 2),
      unidade: "m2",
      classificacao: "Du Bois",
      observacao: "Indicador auxiliar de contexto clinico.",
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
