// Estimativa de BF% — apenas apoio, nunca diagnóstico clínico
export interface MedidasInput {
  sexo:      "M" | "F";
  cintura_cm: number;
  quadril_cm: number;
  altura_cm:  number;
  peso_kg:    number;
}

export interface BFResult {
  bf_estimado:   number;
  classificacao: string;
  aviso:         string;
}

// Fórmula Navy (simplificada para coleta remota)
export function estimarBF(m: MedidasInput): BFResult {
  let bf: number;

  if (m.sexo === "M") {
    // Homem: usa cintura e altura
    bf = 495 / (1.0324 - 0.19077 * Math.log10(m.cintura_cm - 0) + 0.15456 * Math.log10(m.altura_cm)) - 450;
  } else {
    // Mulher: usa cintura, quadril e altura
    bf = 495 / (1.29579 - 0.35004 * Math.log10(m.cintura_cm + m.quadril_cm) + 0.22100 * Math.log10(m.altura_cm)) - 450;
  }

  bf = Math.max(3, Math.min(60, parseFloat(bf.toFixed(1))));

  const classificacao = getClassificacao(bf, m.sexo);

  return {
    bf_estimado: bf,
    classificacao,
    aviso: "⚠️ Estimativa matemática de apoio para acompanhamento remoto. Não substitui bioimpedância ou avaliação presencial. Sujeita à revisão profissional.",
  };
}

function getClassificacao(bf: number, sexo: "M" | "F"): string {
  if (sexo === "M") {
    if (bf < 6)  return "Atlético Extremo";
    if (bf < 14) return "Atlético";
    if (bf < 18) return "Fitness";
    if (bf < 25) return "Aceitável";
    return "Acima do Ideal";
  } else {
    if (bf < 14) return "Atlético Extremo";
    if (bf < 21) return "Atlético";
    if (bf < 25) return "Fitness";
    if (bf < 32) return "Aceitável";
    return "Acima do Ideal";
  }
}
