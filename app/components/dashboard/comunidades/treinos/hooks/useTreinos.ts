// app/components/dashboard/comunidades/treinos/hooks/useTreinos.ts
"use client";

import { useState, useCallback, useMemo } from "react";
import type {
  Treino, SolicitacaoTreino, HistoricoTreino, FocoTreino,
} from "../types";
import { uid, now, clonarTreino } from "../utils";
import { IA_SUGESTOES } from "../constants";

export function useTreinos(communityId: string, userId: string) {
  const [treinos, setTreinos]           = useState<Treino[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoTreino[]>([]);
  const [historico, setHistorico]       = useState<HistoricoTreino[]>([]);
  const [gerandoIA, setGerandoIA]       = useState(false);

  // ── CRUD ──────────────────────────────────────────────────────
  const salvarTreino = useCallback((t: Treino) => {
    setTreinos(prev => {
      const existe = prev.find(x => x.id === t.id);
      const atualizado = { ...t, atualizadoEm: now() };
      return existe
        ? prev.map(x => x.id === t.id ? atualizado : x)
        : [...prev, atualizado];
    });
  }, []);

  const removerTreino = useCallback((id: string) => {
    setTreinos(prev => prev.filter(t => t.id !== id));
  }, []);

  const duplicarTreino = useCallback((t: Treino) => {
    const clone = clonarTreino(t);
    setTreinos(prev => [...prev, clone]);
    return clone;
  }, []);

  const publicarTreino = useCallback((id: string) => {
    setTreinos(prev =>
      prev.map(t => t.id === id
        ? { ...t, status: "published", atualizadoEm: now() }
        : t
      )
    );
  }, []);

  // ── Solicitações ──────────────────────────────────────────────
  const solicitarTreino = useCallback((
    alunoId: string,
    alunoNome: string,
    foco: FocoTreino,
    obs?: string,
  ) => {
    const nova: SolicitacaoTreino = {
      id: uid(),
      alunoId,
      alunoNome,
      foco,
      obs,
      criadoEm: now(),
      status: "pendente",
    };
    setSolicitacoes(prev => [...prev, nova]);
  }, []);

  const removerSolicitacao = useCallback((id: string) => {
    setSolicitacoes(prev => prev.filter(s => s.id !== id));
  }, []);

  // ── IA ────────────────────────────────────────────────────────
  const gerarComIA = useCallback(async (
    foco: FocoTreino,
    solicitacaoId?: string,
  ): Promise<Treino> => {
    setGerandoIA(true);
    // Simula latência da IA (substituir por chamada real à API)
    await new Promise(r => setTimeout(r, 1800));

    const base = IA_SUGESTOES[foco];
    const treino: Treino = {
      ...base,
      id: uid(),
      status: "draft",
      criadoEm: now(),
      atualizadoEm: now(),
      paraTodos: true,
      // Clona profundo para não mutar a constante
      grupos: JSON.parse(JSON.stringify(base.grupos)),
    };

    if (solicitacaoId) {
      setSolicitacoes(prev =>
        prev.map(s => s.id === solicitacaoId
          ? { ...s, status: "em_andamento" }
          : s
        )
      );
    }

    setGerandoIA(false);
    return treino;
  }, []);

  // ── Execução / Histórico ──────────────────────────────────────
  const marcarExercicioConcluido = useCallback((
    treinoId: string,
    exercicioId: string,
  ) => {
    setTreinos(prev => prev.map(t => {
      if (t.id !== treinoId) return t;
      return {
        ...t,
        grupos: t.grupos.map(g => ({
          ...g,
          exercicios: g.exercicios.map(e =>
            e.id === exercicioId ? { ...e, concluido: !e.concluido } : e
          ),
        })),
      };
    }));
  }, []);

  const concluirTreino = useCallback((treinoId: string) => {
    const treino = treinos.find(t => t.id === treinoId);
    if (!treino) return;
    const exerciciosConcluidos = treino.grupos
      .flatMap(g => g.exercicios)
      .filter(e => e.concluido)
      .map(e => e.id);

    const registro: HistoricoTreino = {
      id: uid(),
      treinoId,
      treinoTitulo: treino.titulo,
      alunoId: userId,
      concluidoEm: now(),
      exerciciosConcluidos,
    };
    setHistorico(prev => [registro, ...prev]);
  }, [treinos, userId]);

  // ── Derivados ─────────────────────────────────────────────────
  const treinosPublicados = useMemo(
    () => treinos.filter(t => t.status === "published"),
    [treinos]
  );

  const solicitacoesPendentes = useMemo(
    () => solicitacoes.filter(s => s.status === "pendente"),
    [solicitacoes]
  );

  return {
    treinos,
    treinosPublicados,
    solicitacoes,
    solicitacoesPendentes,
    historico,
    gerandoIA,
    salvarTreino,
    removerTreino,
    duplicarTreino,
    publicarTreino,
    solicitarTreino,
    removerSolicitacao,
    gerarComIA,
    marcarExercicioConcluido,
    concluirTreino,
  };
}
