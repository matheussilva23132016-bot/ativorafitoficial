// app/components/dashboard/comunidades/nutricao/utils.ts

import type { MedidasCorporais, SexoBio } from "./types";
import { DISCLAIMER_COMPOSICAO } from "./constants";

// ── uid simples ───────────────────────────────────────────────────
export const uid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

// ── ISO now ───────────────────────────────────────────────────────
export const now = () => new Date().toISOString();

// ══════════════════════════════════════════════════════════════════
// IMC
// ══════════════════════════════════════════════════════════════════
export function calcularIMC(peso: number, altura: number): number {
  const altM = altura / 100;
  return parseFloat((peso / (altM * altM)).toFixed(1));
}

export function classificarIMC(imc: number): string {
  if (imc < 18.5) return "Abaixo do peso";
  if (imc < 25.0) return "Peso normal";
  if (imc < 30.0) return "Sobrepeso";
  if (imc < 35.0) return "Obesidade grau I";
  if (imc < 40.0) return "Obesidade grau II";
  return "Obesidade grau III";
}

// ══════════════════════════════════════════════════════════════════
// RCQ — Razão Cintura / Quadril
// ══════════════════════════════════════════════════════════════════
export function calcularRCQ(cintura: number, quadril: number): number {
  return parseFloat((cintura / quadril).toFixed(3));
}

/**
 * Classificação OMS simplificada por sexo
 * Masculino: <0.90 baixo | 0.90–0.99 moderado | ≥1.00 alto
 * Feminino:  <0.80 baixo | 0.80–0.84 moderado | ≥0.85 alto
 */
export function classificarRCQ(rcq: number, sexo: SexoBio): {
  label: string;
  cor:   string;
} {
  if (sexo === "masculino") {
    if (rcq < 0.90) return { label: "Baixo risco",     cor: "text-emerald-500" };
    if (rcq < 1.00) return { label: "Risco moderado",  cor: "text-amber-500"   };
    return                  { label: "Alto risco",      cor: "text-rose-500"    };
  }
  // feminino
  if (rcq < 0.80) return   { label: "Baixo risco",     cor: "text-emerald-500" };
  if (rcq < 0.85) return   { label: "Risco moderado",  cor: "text-amber-500"   };
  return                   { label: "Alto risco",       cor: "text-rose-500"    };
}

// ══════════════════════════════════════════════════════════════════
// % GORDURA — Método Navy (U.S. Navy Body Fat Formula)
// Requer: cintura, pescoço, altura (+ quadril para feminino)
// ══════════════════════════════════════════════════════════════════
export function calcularGorduraNavy(
  sexo:    SexoBio,
  altura:  number,   // cm
  cintura: number,   // cm
  pescoco: number,   // cm
  quadril?: number,  // cm — obrigatório para feminino
): number | null {
  if (sexo === "masculino") {
    // %BF = 495 / (1.0324 − 0.19077×log10(cintura−pescoco) + 0.15456×log10(altura)) − 450
    const diff = cintura - pescoco;
    if (diff <= 0) return null;
    const bf =
      495 /
      (1.0324 -
        0.19077 * Math.log10(diff) +
        0.15456 * Math.log10(altura)) -
      450;
    return parseFloat(Math.max(3, Math.min(bf, 50)).toFixed(1));
  }

  // feminino
  if (!quadril) return null;
  // %BF = 495 / (1.29579 − 0.35004×log10(cintura+quadril−pescoco) + 0.22100×log10(altura)) − 450
  const soma = cintura + quadril - pescoco;
  if (soma <= 0) return null;
  const bf =
    495 /
    (1.29579 -
      0.35004 * Math.log10(soma) +
      0.221   * Math.log10(altura)) -
    450;
  return parseFloat(Math.max(10, Math.min(bf, 60)).toFixed(1));
}

// ══════════════════════════════════════════════════════════════════
// % GORDURA — Fallback via RCQ (quando não há pescoço)
// Estimativa grosseira — menos precisa, mas sempre disponível
// ══════════════════════════════════════════════════════════════════
export function estimarGorduraPorRCQ(
  rcq:  number,
  sexo: SexoBio,
  imc:  number,
): number {
  // Fórmula empírica simplificada baseada em correlações publicadas
  // Deurenberg et al. (adaptado)
  const idade = 30; // idade neutra quando não informada
  const sexoFator = sexo === "masculino" ? 1 : 0;
  const bf = 1.20 * imc + 0.23 * idade - 10.8 * sexoFator - 5.4;
  // Ajuste leve pelo RCQ
  const ajuste = (rcq - (sexo === "masculino" ? 0.9 : 0.8)) * 10;
  return parseFloat(Math.max(3, Math.min(bf + ajuste, 60)).toFixed(1));
}

// ══════════════════════════════════════════════════════════════════
// Classificação % gordura por sexo
// ══════════════════════════════════════════════════════════════════
export function classificarGordura(
  gordura: number,
  sexo:    SexoBio,
): { label: string; cor: string } {
  if (sexo === "masculino") {
    if (gordura < 6)  return { label: "Essencial",   cor: "text-sky-400"     };
    if (gordura < 14) return { label: "Atlético",    cor: "text-emerald-500" };
    if (gordura < 18) return { label: "Boa forma",   cor: "text-emerald-400" };
    if (gordura < 25) return { label: "Aceitável",   cor: "text-amber-500"   };
    return                   { label: "Excesso",     cor: "text-rose-500"    };
  }
  // feminino
  if (gordura < 14) return   { label: "Essencial",   cor: "text-sky-400"     };
  if (gordura < 21) return   { label: "Atlético",    cor: "text-emerald-500" };
  if (gordura < 25) return   { label: "Boa forma",   cor: "text-emerald-400" };
  if (gordura < 32) return   { label: "Aceitável",   cor: "text-amber-500"   };
  return                     { label: "Excesso",     cor: "text-rose-500"    };
}

// ══════════════════════════════════════════════════════════════════
// Função principal — calcula tudo e retorna MedidasCorporais
// ══════════════════════════════════════════════════════════════════
export function processarMedidas(
  input: Omit<MedidasCorporais, "id" | "imc" | "rcq" | "gorduraEst" | "classificacaoRCQ" | "metodoCalculo">,
): MedidasCorporais {
  const { peso, altura, cintura, quadril, pescoco, sexo } = input;

  const imc = calcularIMC(peso, altura);
  const rcq = calcularRCQ(cintura, quadril);
  const { label: classificacaoRCQ } = classificarRCQ(rcq, sexo);

  let gorduraEst: number | null = null;
  let metodoCalculo: "navy" | "rcq" = "rcq";

  // Tenta Navy se tiver pescoço
  if (pescoco && pescoco > 0) {
    gorduraEst = calcularGorduraNavy(sexo, altura, cintura, pescoco, quadril);
    if (gorduraEst !== null) metodoCalculo = "navy";
  }

  // Fallback RCQ
  if (gorduraEst === null) {
    gorduraEst = estimarGorduraPorRCQ(rcq, sexo, imc);
    metodoCalculo = "rcq";
  }

  return {
    ...input,
    id:              uid(),
    imc,
    rcq,
    gorduraEst,
    classificacaoRCQ,
    metodoCalculo,
  };
}

// ── Disclaimer ────────────────────────────────────────────────────
export { DISCLAIMER_COMPOSICAO };

// ── Helpers de cardápio ───────────────────────────────────────────
export function somarCalorias(refeicoes: import("./types").Refeicao[]): number {
  return refeicoes.reduce((acc, r) => {
    const cal = r.calorias
      ?? r.alimentos.reduce((a, al) => a + (al.calorias ?? 0), 0);
    return acc + cal;
  }, 0);
}

export function novoAlimento(): import("./types").Alimento {
  return { id: uid(), nome: "", quantidade: "", calorias: 0, proteinas: 0, carbos: 0, gorduras: 0 };
}

export function novaRefeicao(nome = "Nova refeição", horario = "12:00"): import("./types").Refeicao {
  return { id: uid(), nome, horario, alimentos: [], concluida: false };
}

export function novoDia(dia: import("./types").DiaSemana): import("./types").DiaCardapio {
  return { dia, refeicoes: [] };
}

export function novoCardapio(
  communityId: string,
  alunoId:     string,
  alunoNome:   string,
): import("./types").Cardapio {
  const { DIAS_SEMANA, REFEICOES_PADRAO, semanaAtual } = require("./constants");
  return {
    id:           uid(),
    communityId,
    alunoId,
    alunoNome,
    titulo:       "Novo Cardápio",
    foco:         "manutencao",
    semana:       semanaAtual(),
    dias:         DIAS_SEMANA.map((dia: import("./types").DiaSemana) => ({
      dia,
      refeicoes: REFEICOES_PADRAO.map((r: any) => novaRefeicao(r.nome, r.horario)),
    })),
    calorias_dia:  2000,
    proteinas_dia: 150,
    obs:           "",
    status:        "draft",
    geradoPorIA:   false,
    criadoEm:      now(),
    atualizadoEm:  now(),
  };
}
