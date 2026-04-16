// app/components/dashboard/comunidades/nutricao/constants.ts

import {
  Flame, Dumbbell, Scale, Heart,
  Zap, RefreshCw,
} from "lucide-react";
import type { FocoNutricional, DiaSemana } from "./types";

// ── Focos nutricionais ────────────────────────────────────────────
export const FOCOS_NUTRICAO: {
  id:     FocoNutricional;
  label:  string;
  desc:   string;
  icon:   any;
  cor:    string;
  bg:     string;
  border: string;
}[] = [
  {
    id:     "emagrecimento",
    label:  "Emagrecimento",
    desc:   "Déficit calórico controlado",
    icon:   Flame,
    cor:    "text-rose-500",
    bg:     "bg-rose-500/10",
    border: "border-rose-500/30",
  },
  {
    id:     "hipertrofia",
    label:  "Hipertrofia",
    desc:   "Superávit para ganho muscular",
    icon:   Dumbbell,
    cor:    "text-sky-500",
    bg:     "bg-sky-500/10",
    border: "border-sky-500/30",
  },
  {
    id:     "manutencao",
    label:  "Manutenção",
    desc:   "Equilíbrio calórico",
    icon:   Scale,
    cor:    "text-emerald-500",
    bg:     "bg-emerald-500/10",
    border: "border-emerald-500/30",
  },
  {
    id:     "saude_geral",
    label:  "Saúde Geral",
    desc:   "Qualidade alimentar e bem-estar",
    icon:   Heart,
    cor:    "text-pink-500",
    bg:     "bg-pink-500/10",
    border: "border-pink-500/30",
  },
  {
    id:     "performance",
    label:  "Performance",
    desc:   "Energia e rendimento esportivo",
    icon:   Zap,
    cor:    "text-amber-500",
    bg:     "bg-amber-500/10",
    border: "border-amber-500/30",
  },
  {
    id:     "recomposicao",
    label:  "Recomposição",
    desc:   "Perder gordura e ganhar músculo",
    icon:   RefreshCw,
    cor:    "text-violet-500",
    bg:     "bg-violet-500/10",
    border: "border-violet-500/30",
  },
];

// ── Dias da semana ────────────────────────────────────────────────
export const DIAS_SEMANA: DiaSemana[] = [
  "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo",
];

// ── Refeições padrão ──────────────────────────────────────────────
export const REFEICOES_PADRAO = [
  { nome: "Café da manhã",  horario: "07:00" },
  { nome: "Lanche manhã",   horario: "10:00" },
  { nome: "Almoço",         horario: "12:30" },
  { nome: "Lanche tarde",   horario: "16:00" },
  { nome: "Jantar",         horario: "19:30" },
  { nome: "Ceia",           horario: "21:30" },
];

// ── Restrições alimentares comuns ─────────────────────────────────
export const RESTRICOES_COMUNS = [
  "Glúten",
  "Lactose",
  "Vegano",
  "Vegetariano",
  "Frutos do mar",
  "Amendoim",
  "Ovos",
  "Soja",
];

// ── Disclaimer obrigatório ────────────────────────────────────────
export const DISCLAIMER_COMPOSICAO =
  "Estimativa de apoio calculada por RFM a partir de sexo biológico, altura e cintura. " +
  "Não substitui avaliação clínica ou exame de bioimpedância. " +
  "Sempre sujeita à revisão do profissional responsável.";

// ── Semana ISO ────────────────────────────────────────────────────
export function semanaAtual(): string {
  const now  = new Date();
  const year = now.getFullYear();
  const start = new Date(year, 0, 1);
  const week  = Math.ceil(
    ((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7
  );
  return `${year}-W${String(week).padStart(2, "0")}`;
}

// ── Prompt base para IA ───────────────────────────────────────────
export function buildIAPrompt(params: {
  alunoNome:   string;
  foco:        FocoNutricional;
  objetivo:    string;
  restricoes:  string[];
  imc?:        number;
  gorduraEst?: number;
  rcq?:        number;
  peso?:       number;
  altura?:     number;
  sexo?:       string;
}): string {
  const { alunoNome, foco, objetivo, restricoes, imc, gorduraEst, rcq, peso, altura, sexo } = params;

  const focoLabel = FOCOS_NUTRICAO.find(f => f.id === foco)?.label ?? foco;
  const restricoesStr = restricoes.length > 0
    ? restricoes.join(", ")
    : "nenhuma restrição informada";

  const dadosCorporais = [
    peso    ? `Peso: ${peso}kg`                           : null,
    altura  ? `Altura: ${altura}cm`                       : null,
    sexo    ? `Sexo: ${sexo}`                             : null,
    imc     ? `IMC: ${imc.toFixed(1)}`                    : null,
    gorduraEst ? `Gordura corporal estimada por RFM: ${gorduraEst.toFixed(1)}%` : null,
    rcq     ? `RCQ: ${rcq.toFixed(2)}`                    : null,
  ].filter(Boolean).join(" | ");

  return `
Você é um nutricionista esportivo especializado. Monte um cardápio semanal completo (7 dias) para:

Aluno: ${alunoNome}
Foco: ${focoLabel}
Objetivo declarado: ${objetivo}
Restrições alimentares: ${restricoesStr}
${dadosCorporais ? `Dados corporais: ${dadosCorporais}` : ""}

Estruture o cardápio com 5-6 refeições por dia (café da manhã, lanche manhã, almoço, lanche tarde, jantar, ceia opcional).
ATENÇÃO À VARIEDADE: O cardápio deve ter alta diversidade alimentar ao longo dos 7 dias. Não coloque exatamente as mesmas refeições todos os dias da semana. Gire os carboidratos (arroz, batata doce, macarrão, mandioca, aveia), as proteínas (frango, carne magra, ovos, peixes) e as fontes de gordura/fibras ao decorrer da semana para evitar monotonia.
Para cada alimento, informe quantidade, calorias aproximadas, proteínas, carboidratos e gorduras.
Inclua observações personalizadas ao final.
Responda em JSON seguindo exatamente a estrutura de DiaCardapio[].
  `.trim();
}
