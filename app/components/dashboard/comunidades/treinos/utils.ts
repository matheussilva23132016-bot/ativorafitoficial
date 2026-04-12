// app/components/dashboard/comunidades/treinos/utils.ts

import type { Treino, GrupoExercicios, Exercicio, FocoTreino } from "./types";

export const uid = () =>
  Math.random().toString(36).slice(2) + Date.now().toString(36);

export const now = () => new Date().toISOString();

export const novoExercicio = (): Exercicio => ({
  id: uid(),
  nome: "",
  series: 3,
  repeticoes: "12",
  descanso: "60s",
});

export const novoGrupo = (): GrupoExercicios => ({
  id: uid(),
  nome: "",
  exercicios: [novoExercicio()],
});

export const novoTreino = (foco: FocoTreino = "hipertrofia"): Treino => ({
  id: uid(),
  titulo: "",
  dia: "Segunda",
  foco,
  status: "draft",
  grupos: [novoGrupo()],
  criadoEm: now(),
  atualizadoEm: now(),
  paraTodos: true,
});

export const clonarTreino = (t: Treino): Treino => ({
  ...JSON.parse(JSON.stringify(t)),
  id: uid(),
  titulo: `${t.titulo} (cópia)`,
  status: "draft" as const,
  criadoEm: now(),
  atualizadoEm: now(),
});

export const totalExercicios = (t: Treino) =>
  t.grupos.reduce((acc, g) => acc + g.exercicios.length, 0);

export const percentualConcluido = (t: Treino): number => {
  const total = totalExercicios(t);
  if (total === 0) return 0;
  const concluidos = t.grupos.reduce(
    (acc, g) => acc + g.exercicios.filter(e => e.concluido).length,
    0
  );
  return Math.round((concluidos / total) * 100);
};
