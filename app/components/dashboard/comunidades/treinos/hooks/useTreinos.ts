// app/components/dashboard/comunidades/treinos/hooks/useTreinos.ts
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import type {
  Treino, SolicitacaoTreino, HistoricoTreino, FocoTreino,
} from "../types";
import { uid, now, clonarTreino } from "../utils";
import { IA_SUGESTOES } from "../constants";

function mapApiTreino(row: any): Treino {
  const exercicios = Array.isArray(row.exercicios) ? row.exercicios : [];
  return {
    id: row.id,
    titulo: row.titulo ?? "Treino",
    dia: row.dia_semana ?? "Livre",
    foco: row.foco ?? "hipertrofia",
    status: row.status === "published" ? "published" : row.status === "arquivado" ? "archived" : "draft",
    grupos: [{
      id: `${row.id}-grupo`,
      nome: row.descricao || row.foco || "Treino",
      exercicios: exercicios.map((ex: any) => ({
        id: ex.id,
        nome: ex.nome ?? "",
        series: Number(ex.series ?? 0),
        repeticoes: ex.reps ?? "",
        descanso: ex.descanso ?? "",
        obs: [ex.obs, ex.cadencia ? `Cadencia: ${ex.cadencia}` : "", ex.rpe ? `RPE: ${ex.rpe}` : ""]
          .filter(Boolean)
          .join(" | "),
        videoUrl: ex.video_url ?? undefined,
      })),
    }],
    obs: row.obs ?? "",
    criadoEm: row.created_at ?? new Date().toISOString(),
    atualizadoEm: row.updated_at ?? new Date().toISOString(),
    paraTodos: row.alvo === "todos",
    paraAluno: row.alvo_user_id ?? row.aluno_id ?? undefined,
    solicitacaoId: row.solicitacao_id ?? undefined,
  };
}

function toApiPayload(t: Treino, communityId: string, userId: string) {
  return {
    id: t.id,
    titulo: t.titulo || "Treino",
    descricao: t.grupos.map(g => g.nome).filter(Boolean).join(" + ") || null,
    dia_semana: t.dia ?? "Livre",
    foco: t.foco,
    status: t.status === "archived" ? "arquivado" : t.status,
    alvo: t.paraTodos ? "todos" : "individual",
    alvo_user_id: t.paraAluno ?? null,
    aluno_id: t.paraAluno ?? null,
    solicitacao_id: t.solicitacaoId ?? null,
    obs: t.obs ?? null,
    criado_por: userId,
    gerado_por_ia: false,
    exercicios: t.grupos.flatMap(g =>
      g.exercicios.map(ex => ({
        nome: ex.nome,
        series: ex.series,
        reps: ex.repeticoes,
        descanso: ex.descanso,
        video_url: ex.videoUrl ?? ex.linkExterno ?? null,
        obs: [g.nome ? `Grupo: ${g.nome}` : "", ex.obs ?? ""].filter(Boolean).join(" | "),
      })),
    ),
  };
}

export function useTreinos(communityId: string, userId: string) {
  const [treinos, setTreinos]           = useState<Treino[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoTreino[]>([]);
  const [historico, setHistorico]       = useState<HistoricoTreino[]>([]);
  const [gerandoIA, setGerandoIA]       = useState(false);

  const sincronizar = useCallback(async () => {
    if (!communityId || !userId) return;
    try {
      const [treinosRes, requestsRes] = await Promise.all([
        fetch(`/api/communities/${communityId}/treinos?userId=${encodeURIComponent(userId)}`),
        fetch(`/api/communities/${communityId}/treinos/requests?userId=${encodeURIComponent(userId)}`),
      ]);
      const treinosData = treinosRes.ok ? await treinosRes.json() : {};
      const requestsData = requestsRes.ok ? await requestsRes.json() : {};
      if (Array.isArray(treinosData.treinos)) {
        setTreinos(treinosData.treinos.map(mapApiTreino));
      }
      if (Array.isArray(requestsData.solicitacoes)) {
        setSolicitacoes(requestsData.solicitacoes);
      }
    } catch {
      // Mantem a experiencia local se a API nao responder.
    }
  }, [communityId, userId]);

  useEffect(() => {
    sincronizar();
  }, [sincronizar]);

  const persistirTreino = useCallback(async (t: Treino) => {
    if (!communityId || !userId) return;
    try {
      await fetch(`/api/communities/${communityId}/treinos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toApiPayload(t, communityId, userId)),
      });
    } catch {
      // Estado local continua funcionando offline.
    }
  }, [communityId, userId]);

  // ── CRUD ──────────────────────────────────────────────────────
  const salvarTreino = useCallback((t: Treino) => {
    setTreinos(prev => {
      const existe = prev.find(x => x.id === t.id);
      const atualizado = { ...t, atualizadoEm: now() };
      void persistirTreino(atualizado);
      return existe
        ? prev.map(x => x.id === t.id ? atualizado : x)
        : [...prev, atualizado];
    });
  }, [persistirTreino]);

  const removerTreino = useCallback((id: string) => {
    setTreinos(prev => prev.filter(t => t.id !== id));
  }, []);

  const duplicarTreino = useCallback((t: Treino) => {
    const clone = clonarTreino(t);
    setTreinos(prev => [...prev, clone]);
    return clone;
  }, []);

  const publicarTreino = useCallback((id: string) => {
    let publicado: Treino | null = null;
    setTreinos(prev =>
      prev.map(t => {
        if (t.id !== id) return t;
        publicado = { ...t, status: "published", atualizadoEm: now() };
        return publicado;
      })
    );
    setTimeout(() => {
      if (publicado) void persistirTreino(publicado);
    }, 0);
  }, [persistirTreino]);

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
    fetch(`/api/communities/${communityId}/treinos/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nova),
    }).catch(() => {});
  }, [communityId]);

  const removerSolicitacao = useCallback((id: string) => {
    setSolicitacoes(prev => prev.filter(s => s.id !== id));
    fetch(`/api/communities/${communityId}/treinos/requests?requesterId=${encodeURIComponent(userId)}&requestId=${encodeURIComponent(id)}`, {
      method: "DELETE",
    }).catch(() => {});
  }, [communityId, userId]);

  // ── IA ────────────────────────────────────────────────────────
  const gerarComIA = useCallback(async (
    foco: FocoTreino,
    solicitacaoId?: string,
  ): Promise<Treino> => {
    const solicitacao = solicitacaoId
      ? solicitacoes.find(s => s.id === solicitacaoId)
      : undefined;

    setGerandoIA(true);
    try {
      const res = await fetch("/api/ia/treinos/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foco,
          alunoNome: solicitacao?.alunoNome ?? "Atleta",
          nivel: "Intermediario",
          dias: 5,
          obs: [
            solicitacao?.obs,
            solicitacaoId ? "Solicitacao feita dentro da comunidade." : "",
          ].filter(Boolean).join("\n"),
        }),
      });
      const data = res.ok ? await res.json() : null;
      const workout = data?.plan?.workouts?.[0];

      if (data?.success && workout) {
        const treinoGerado: Treino = {
          id: uid(),
          titulo: workout.titulo || `Treino ${String(foco).toUpperCase()}`,
          dia: workout.dia || "Livre",
          foco,
          status: "draft",
          grupos: [
            {
              id: uid(),
              nome: workout.foco || workout.objetivo_fisiologico || "Treino IA",
              exercicios: (Array.isArray(workout.exercicios) ? workout.exercicios : [])
                .map((ex: any) => ({
                  id: uid(),
                  nome: String(ex?.nome || "").trim(),
                  series: Number(ex?.series ?? 0),
                  repeticoes: String(ex?.reps || ""),
                  descanso: String(ex?.descanso || ""),
                  obs: [ex?.observacao, ex?.cadencia ? `Cadencia: ${ex.cadencia}` : "", ex?.rpe ? `RPE: ${ex.rpe}` : ""]
                    .filter(Boolean)
                    .join(" | "),
                }))
                .filter((ex: any) => ex.nome),
            },
          ],
          obs: [
            workout.objetivo_fisiologico,
            workout.intensidade_geral ? `Intensidade: ${workout.intensidade_geral}` : "",
            workout.tempo ? `Tempo: ${workout.tempo}` : "",
          ].filter(Boolean).join("\n"),
          criadoEm: now(),
          atualizadoEm: now(),
          paraTodos: !solicitacao?.alunoId,
          paraAluno: solicitacao?.alunoId,
          solicitacaoId,
        };

        if (solicitacaoId) {
          setSolicitacoes(prev =>
            prev.map(s => s.id === solicitacaoId
              ? { ...s, status: "em_andamento" }
              : s
            )
          );
          fetch(`/api/communities/${communityId}/treinos/requests`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: solicitacaoId, status: "em_andamento", requesterId: userId }),
          }).catch(() => {});
        }

        setGerandoIA(false);
        return treinoGerado;
      }
    } catch {
      // Fallback local abaixo se a OpenAI estiver indisponivel.
    }
    const base = IA_SUGESTOES[foco];
    const treino: Treino = {
      ...base,
      id: uid(),
      status: "draft",
      criadoEm: now(),
      atualizadoEm: now(),
      paraTodos: !solicitacao?.alunoId,
      paraAluno: solicitacao?.alunoId,
      solicitacaoId,
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
      fetch(`/api/communities/${communityId}/treinos/requests`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: solicitacaoId, status: "em_andamento", requesterId: userId }),
      }).catch(() => {});
    }

    setGerandoIA(false);
    return treino;
  }, [communityId, userId, solicitacoes]);

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
    sincronizar,
  };
}
