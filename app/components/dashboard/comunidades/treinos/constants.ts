// app/components/dashboard/comunidades/treinos/constants.ts

import {
  Flame, Swords, HeartPulse, Scale,
  Move, Activity,
} from "lucide-react";
import type { FocoTreino, DiaSemana, Treino } from "./types";

// ── Focos de treino ───────────────────────────────────────────
export const FOCOS: Record<FocoTreino, {
  label: string;
  icon: React.ElementType;
  cor: string;
  bg: string;
  border: string;
  descricao: string;
}> = {
  emagrecimento: {
    label: "Emagrecimento",
    icon: Flame,
    cor: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    descricao: "Queima calórica, circuitos e cardio",
  },
  hipertrofia: {
    label: "Hipertrofia",
    icon: Swords,
    cor: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/30",
    descricao: "Ganho de massa muscular",
  },
  resistencia: {
    label: "Resistência",
    icon: HeartPulse,
    cor: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    descricao: "Capacidade aeróbica e muscular",
  },
  definicao: {
    label: "Definição",
    icon: Scale,
    cor: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    descricao: "Tonificação e baixo percentual de gordura",
  },
  condicionamento: {
    label: "Condicionamento",
    icon: Activity,
    cor: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    descricao: "Performance e capacidade física geral",
  },
  mobilidade: {
    label: "Mobilidade",
    icon: Move,
    cor: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    descricao: "Flexibilidade, postura e amplitude",
  },
};

export const FOCOS_LIST = Object.entries(FOCOS).map(([id, v]) => ({
  id: id as FocoTreino,
  ...v,
}));

// ── Dias da semana ────────────────────────────────────────────
export const DIAS: DiaSemana[] = [
  "Livre",
  "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo",
];

// ── Roles com permissão de gestão ────────────────────────────
export const ROLES_GESTAO = ["owner", "admin", "instructor"] as const;

// ── Sugestões da IA por foco ──────────────────────────────────
export const IA_SUGESTOES: Record<FocoTreino, Omit<Treino,
  "id" | "criadoEm" | "atualizadoEm" | "status" | "paraTodos"
>> = {
  hipertrofia: {
    titulo: "HIPERTROFIA — PUSH A",
    dia: "Segunda",
    letra: "A",
    foco: "hipertrofia",
    obs: "Descanso de 60–90s entre séries. Foco em contração muscular.",
    grupos: [
      {
        id: "g1", nome: "Peito",
        exercicios: [
          { id: "e1", nome: "Supino Reto com Barra", series: 4, repeticoes: "8-12", descanso: "90s", obs: "Controle na descida" },
          { id: "e2", nome: "Supino Inclinado com Halteres", series: 3, repeticoes: "10-12", descanso: "75s" },
          { id: "e3", nome: "Crossover na Polia", series: 3, repeticoes: "12-15", descanso: "60s", obs: "Espremer no final" },
        ],
      },
      {
        id: "g2", nome: "Ombros",
        exercicios: [
          { id: "e4", nome: "Desenvolvimento com Halteres", series: 4, repeticoes: "10-12", descanso: "75s" },
          { id: "e5", nome: "Elevação Lateral", series: 3, repeticoes: "12-15", descanso: "60s" },
          { id: "e6", nome: "Elevação Frontal", series: 3, repeticoes: "12", descanso: "60s" },
        ],
      },
      {
        id: "g3", nome: "Tríceps",
        exercicios: [
          { id: "e7", nome: "Tríceps Testa com Barra", series: 3, repeticoes: "10-12", descanso: "75s" },
          { id: "e8", nome: "Tríceps Corda na Polia", series: 3, repeticoes: "12-15", descanso: "60s" },
        ],
      },
    ],
    cardio: { tipo: "Esteira", duracao: "15min", intensidade: "Moderada", obs: "Pós-treino" },
  },
  emagrecimento: {
    titulo: "EMAGRECIMENTO — CIRCUITO A",
    dia: "Segunda",
    letra: "A",
    foco: "emagrecimento",
    obs: "Pouco descanso entre exercícios. Manter frequência cardíaca elevada.",
    grupos: [
      {
        id: "g1", nome: "Circuito Inferior",
        exercicios: [
          { id: "e1", nome: "Agachamento Livre", series: 4, repeticoes: "15-20", descanso: "45s" },
          { id: "e2", nome: "Afundo Alternado", series: 3, repeticoes: "12 cada", descanso: "45s" },
          { id: "e3", nome: "Leg Press 45°", series: 3, repeticoes: "15", descanso: "60s" },
        ],
      },
      {
        id: "g2", nome: "Circuito Superior",
        exercicios: [
          { id: "e4", nome: "Remada Curvada", series: 3, repeticoes: "15", descanso: "45s" },
          { id: "e5", nome: "Supino com Halteres", series: 3, repeticoes: "15", descanso: "45s" },
          { id: "e6", nome: "Desenvolvimento Arnold", series: 3, repeticoes: "12", descanso: "45s" },
        ],
      },
      {
        id: "g3", nome: "Core",
        exercicios: [
          { id: "e7", nome: "Prancha Abdominal", series: 3, repeticoes: "45s", descanso: "30s" },
          { id: "e8", nome: "Abdominal Bicicleta", series: 3, repeticoes: "20", descanso: "30s" },
        ],
      },
    ],
    cardio: { tipo: "Bike", duracao: "25min", intensidade: "Alta", obs: "Intervalado: 1min forte / 1min leve" },
  },
  resistencia: {
    titulo: "RESISTÊNCIA — FULL BODY A",
    dia: "Segunda",
    letra: "A",
    foco: "resistencia",
    obs: "Séries longas com carga moderada. Foco em resistência muscular.",
    grupos: [
      {
        id: "g1", nome: "Membros Inferiores",
        exercicios: [
          { id: "e1", nome: "Agachamento Goblet", series: 4, repeticoes: "20", descanso: "60s" },
          { id: "e2", nome: "Cadeira Extensora", series: 3, repeticoes: "20-25", descanso: "45s" },
          { id: "e3", nome: "Mesa Flexora", series: 3, repeticoes: "20", descanso: "45s" },
        ],
      },
      {
        id: "g2", nome: "Membros Superiores",
        exercicios: [
          { id: "e4", nome: "Puxada Frontal", series: 4, repeticoes: "15-20", descanso: "60s" },
          { id: "e5", nome: "Rosca Direta", series: 3, repeticoes: "15-20", descanso: "45s" },
          { id: "e6", nome: "Tríceps Banco", series: 3, repeticoes: "15-20", descanso: "45s" },
        ],
      },
    ],
    cardio: { tipo: "Corda", duracao: "10min", intensidade: "Moderada" },
  },
  definicao: {
    titulo: "DEFINIÇÃO — UPPER A",
    dia: "Segunda",
    letra: "A",
    foco: "definicao",
    obs: "Superséries para maximizar gasto calórico mantendo volume.",
    grupos: [
      {
        id: "g1", nome: "Costas + Bíceps",
        exercicios: [
          { id: "e1", nome: "Puxada Pronada", series: 4, repeticoes: "12", descanso: "60s" },
          { id: "e2", nome: "Remada Unilateral", series: 3, repeticoes: "12 cada", descanso: "60s" },
          { id: "e3", nome: "Rosca Alternada", series: 3, repeticoes: "12", descanso: "45s" },
          { id: "e4", nome: "Rosca Martelo", series: 3, repeticoes: "12", descanso: "45s" },
        ],
      },
      {
        id: "g2", nome: "Peito + Tríceps",
        exercicios: [
          { id: "e5", nome: "Supino Reto", series: 4, repeticoes: "12", descanso: "60s" },
          { id: "e6", nome: "Crucifixo Inclinado", series: 3, repeticoes: "12", descanso: "60s" },
          { id: "e7", nome: "Tríceps Francês", series: 3, repeticoes: "12", descanso: "45s" },
        ],
      },
    ],
    cardio: { tipo: "Esteira", duracao: "20min", intensidade: "Moderada" },
  },
  condicionamento: {
    titulo: "CONDICIONAMENTO — FUNCIONAL A",
    dia: "Segunda",
    letra: "A",
    foco: "condicionamento",
    obs: "Movimentos funcionais compostos. Alta intensidade.",
    grupos: [
      {
        id: "g1", nome: "Aquecimento Ativo",
        exercicios: [
          { id: "e1", nome: "Polichinelo", series: 3, repeticoes: "30s", descanso: "15s" },
          { id: "e2", nome: "Agachamento com Salto", series: 3, repeticoes: "10", descanso: "30s" },
        ],
      },
      {
        id: "g2", nome: "Bloco Principal",
        exercicios: [
          { id: "e3", nome: "Burpee", series: 4, repeticoes: "10", descanso: "45s" },
          { id: "e4", nome: "Kettlebell Swing", series: 4, repeticoes: "15", descanso: "45s" },
          { id: "e5", nome: "Box Jump", series: 3, repeticoes: "8", descanso: "60s" },
          { id: "e6", nome: "Farmer Walk", series: 3, repeticoes: "30m", descanso: "60s" },
        ],
      },
    ],
    cardio: { tipo: "Remo Ergométrico", duracao: "10min", intensidade: "Alta" },
  },
  mobilidade: {
    titulo: "MOBILIDADE — FULL BODY",
    dia: "Segunda",
    letra: "A",
    foco: "mobilidade",
    obs: "Respiração controlada. Sem pressa. Foco em amplitude.",
    grupos: [
      {
        id: "g1", nome: "Quadril e Lombar",
        exercicios: [
          { id: "e1", nome: "Hip 90/90", series: 3, repeticoes: "60s cada lado", descanso: "30s" },
          { id: "e2", nome: "Pigeon Pose", series: 3, repeticoes: "60s cada lado", descanso: "30s" },
          { id: "e3", nome: "Rotação Torácica", series: 3, repeticoes: "10 cada lado", descanso: "30s" },
        ],
      },
      {
        id: "g2", nome: "Ombros e Coluna",
        exercicios: [
          { id: "e4", nome: "Cat-Cow", series: 3, repeticoes: "10", descanso: "20s" },
          { id: "e5", nome: "Thread the Needle", series: 3, repeticoes: "8 cada lado", descanso: "30s" },
          { id: "e6", nome: "Dislocação com Bastão", series: 3, repeticoes: "10", descanso: "30s" },
        ],
      },
    ],
  },
};
