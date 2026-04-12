// app/components/dashboard/comunidades/nutricao/hooks/useNutricao.ts
"use client";

import { useState, useCallback, useMemo } from "react";
import type {
  Cardapio, SolicitacaoCardapio, MedidasCorporais,
  FocoNutricional, StatusSolicitacao, DiaSemana,
  Refeicao, DiaCardapio,
} from "../types";
import {
  uid, now, processarMedidas,
  novoCardapio, novaRefeicao, novoDia,
} from "../utils";
import { semanaAtual, buildIAPrompt, DIAS_SEMANA } from "../constants";

// ══════════════════════════════════════════════════════════════════
// TIPOS INTERNOS
// ══════════════════════════════════════════════════════════════════
export interface EnviarSolicitacaoInput {
  communityId: string;
  alunoId:     string;
  alunoNome:   string;
  foco:        FocoNutricional;
  objetivo:    string;
  restricoes:  string[];
  medidas?:    Omit<MedidasCorporais,
    "id" | "imc" | "rcq" | "gorduraEst" | "classificacaoRCQ" | "metodoCalculo">;
}

export interface GerarCardapioIAInput {
  solicitacao:  SolicitacaoCardapio;
  communityId:  string;
}

// Membro simplificado para o seletor de avaliações
export interface MembroSimples {
  id:   string;
  nome: string;
}

// ══════════════════════════════════════════════════════════════════
// HOOK
// ══════════════════════════════════════════════════════════════════
export function useNutricao(
  communityId:     string,
  userId:          string,
  currentUserNome: string = "Você",   // ← garante que o próprio usuário aparece na lista
) {

  const [cardapios,        setCardapios]        = useState<Cardapio[]>([]);
  const [solicitacoes,     setSolicitacoes]      = useState<SolicitacaoCardapio[]>([]);
  const [historicoMedidas, setHistoricoMedidas]  = useState<MedidasCorporais[]>([]);
  const [membros,          setMembros]           = useState<MembroSimples[]>([]);
  const [gerandoIA,        setGerandoIA]         = useState(false);
  const [loadingSync,      setLoadingSync]       = useState(false);
  const [erro,             setErro]              = useState<string | null>(null);

  // ══════════════════════════════════════════════════════════════
  // SYNC COM API
  // ══════════════════════════════════════════════════════════════

  const sincronizar = useCallback(async () => {
    if (!communityId) return;
    setLoadingSync(true);
    setErro(null);
    try {
      const [cardRes, solRes, membrosRes] = await Promise.all([
        fetch(`/api/communities/${communityId}/nutrition/cardapios`),
        fetch(`/api/communities/${communityId}/nutrition/solicitacoes`),
        fetch(`/api/communities/${communityId}/members?simple=true`),
      ]);

      if (cardRes.ok) {
        const cardData = await cardRes.json();
        if (Array.isArray(cardData.cardapios)) {
          setCardapios(cardData.cardapios);
        }
      }

      if (solRes.ok) {
        const solData = await solRes.json();
        if (Array.isArray(solData.solicitacoes)) {
          setSolicitacoes(solData.solicitacoes);
        }
      }

      // Membros — endpoint retorna { members: [{ id, name }] }
      if (membrosRes.ok) {
        const membrosData = await membrosRes.json();
        const lista: MembroSimples[] = (
          Array.isArray(membrosData.members)
            ? membrosData.members
            : Array.isArray(membrosData.membros)
              ? membrosData.membros
              : []
        ).map((m: { id: string; name?: string; nome?: string }) => ({
          id:   m.id,
          nome: m.name ?? m.nome ?? "Membro",
        }));

        // Garante que o próprio usuário sempre aparece no topo da lista
        const jaEsta = lista.some(m => m.id === userId);
        if (!jaEsta && userId) {
          lista.unshift({ id: userId, nome: currentUserNome });
        }

        setMembros(lista);
      }
    } catch {
      // Silencioso — mantém estado local intacto
    } finally {
      setLoadingSync(false);
    }
  }, [communityId, userId, currentUserNome]);

  const carregarMedidas = useCallback(async (alunoId: string) => {
    if (!communityId) return;
    try {
      const res  = await fetch(
        `/api/communities/${communityId}/nutrition/medidas?alunoId=${alunoId}`
      );
      const data = res.ok ? await res.json() : {};
      if (Array.isArray(data.medidas)) {
        setHistoricoMedidas(data.medidas);
      }
    } catch {
      // silencioso
    }
  }, [communityId]);

  // ══════════════════════════════════════════════════════════════
  // MEDIDAS — SALVAR (qualquer cargo, qualquer membro)
  // ══════════════════════════════════════════════════════════════

  const salvarMedida = useCallback(async (
    medidas: MedidasCorporais,
  ): Promise<void> => {
    // Optimistic update imediato
    setHistoricoMedidas(prev => {
      const mesmoAlunoDia = prev.find(
        m => m.alunoId === medidas.alunoId &&
             m.data.slice(0, 10) === medidas.data.slice(0, 10)
      );
      if (mesmoAlunoDia) {
        return prev.map(m =>
          m.alunoId === medidas.alunoId &&
          m.data.slice(0, 10) === medidas.data.slice(0, 10)
            ? { ...medidas, id: m.id }
            : m
        );
      }
      return [medidas, ...prev];
    });

    try {
      await fetch(
        `/api/communities/${communityId}/nutrition/medidas`,
        {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(medidas),
        }
      );
    } catch {
      // Mantém estado otimista mesmo sem API
    }
  }, [communityId]);

  // ══════════════════════════════════════════════════════════════
  // SOLICITAÇÕES
  // ══════════════════════════════════════════════════════════════

  const enviarSolicitacao = useCallback(async (
    input: EnviarSolicitacaoInput,
  ): Promise<SolicitacaoCardapio> => {
    setErro(null);

    const medidasProcessadas = input.medidas
      ? processarMedidas({ ...input.medidas, alunoId: input.alunoId })
      : undefined;

    const nova: SolicitacaoCardapio = {
      id:          uid(),
      communityId: input.communityId,
      alunoId:     input.alunoId,
      alunoNome:   input.alunoNome,
      foco:        input.foco,
      objetivo:    input.objetivo,
      restricoes:  input.restricoes,
      medidas:     medidasProcessadas,
      status:      "pendente",
      criadoEm:    now(),
    };

    setSolicitacoes(prev => [nova, ...prev]);

    if (medidasProcessadas) {
      setHistoricoMedidas(prev => [medidasProcessadas, ...prev]);
    }

    try {
      const res = await fetch(
        `/api/communities/${input.communityId}/nutrition/solicitacoes`,
        {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(nova),
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.solicitacao) {
          setSolicitacoes(prev =>
            prev.map(s => s.id === nova.id
              ? { ...nova, ...data.solicitacao }
              : s
            )
          );
          return data.solicitacao;
        }
      }
    } catch {
      // Mantém estado otimista
    }

    return nova;
  }, []);

  const atualizarStatusSolicitacao = useCallback(async (
    id:     string,
    status: StatusSolicitacao,
    obs?:   string,
  ) => {
    setSolicitacoes(prev =>
      prev.map(s => s.id === id
        ? { ...s, status, obs, respondidoEm: now() }
        : s
      )
    );
    try {
      await fetch(
        `/api/communities/${communityId}/nutrition/solicitacoes/${id}`,
        {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ status, obs }),
        }
      );
    } catch {
      setSolicitacoes(prev =>
        prev.map(s => s.id === id ? { ...s, status: "pendente" } : s)
      );
    }
  }, [communityId]);

  const removerSolicitacao = useCallback(async (id: string) => {
    setSolicitacoes(prev => prev.filter(s => s.id !== id));
    try {
      await fetch(
        `/api/communities/${communityId}/nutrition/solicitacoes/${id}`,
        { method: "DELETE" }
      );
    } catch { /* silencioso */ }
  }, [communityId]);

  // ══════════════════════════════════════════════════════════════
  // CARDÁPIOS — CRUD
  // ══════════════════════════════════════════════════════════════

  const salvarCardapio = useCallback(async (c: Cardapio): Promise<Cardapio> => {
    const atualizado = { ...c, atualizadoEm: now() };

    setCardapios(prev => {
      const existe = prev.find(x => x.id === c.id);
      return existe
        ? prev.map(x => x.id === c.id ? atualizado : x)
        : [atualizado, ...prev];
    });

    try {
      const res = await fetch(
        `/api/communities/${communityId}/nutrition/cardapios`,
        {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(atualizado),
        }
      );
      if (res.ok) {
        const data  = await res.json();
        const final = { ...atualizado, ...data.cardapio };
        setCardapios(prev => prev.map(x => x.id === c.id ? final : x));
        return final;
      }
    } catch {
      setErro("Falha ao salvar cardápio.");
    }

    return atualizado;
  }, [communityId]);

  const publicarCardapio = useCallback(async (
    id:             string,
    solicitacaoId?: string,
  ) => {
    setCardapios(prev =>
      prev.map(c => c.id === id
        ? { ...c, status: "published", atualizadoEm: now(), solicitacaoId }
        : c
      )
    );

    if (solicitacaoId) {
      setSolicitacoes(prev =>
        prev.map(s => s.id === solicitacaoId
          ? { ...s, status: "concluida", cardapioId: id, respondidoEm: now() }
          : s
        )
      );
    }

    try {
      await fetch(
        `/api/communities/${communityId}/nutrition/cardapios/${id}/publish`,
        {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ solicitacaoId }),
        }
      );
    } catch {
      setCardapios(prev =>
        prev.map(c => c.id === id ? { ...c, status: "draft" } : c)
      );
    }
  }, [communityId]);

  const removerCardapio = useCallback(async (id: string) => {
    setCardapios(prev => prev.filter(c => c.id !== id));
    try {
      await fetch(
        `/api/communities/${communityId}/nutrition/cardapios/${id}`,
        { method: "DELETE" }
      );
    } catch { /* silencioso */ }
  }, [communityId]);

  // ══════════════════════════════════════════════════════════════
  // CARDÁPIOS — EDIÇÃO GRANULAR
  // ══════════════════════════════════════════════════════════════

  const updateCardapioField = useCallback(<K extends keyof Cardapio>(
    id: string, key: K, value: Cardapio[K],
  ) => {
    setCardapios(prev =>
      prev.map(c => c.id === id
        ? { ...c, [key]: value, atualizadoEm: now() }
        : c
      )
    );
  }, []);

  const updateRefeicao = useCallback((
    cardapioId: string,
    dia:        DiaSemana,
    refeicaoId: string,
    patch:      Partial<Refeicao>,
  ) => {
    setCardapios(prev => prev.map(c => {
      if (c.id !== cardapioId) return c;
      return {
        ...c,
        atualizadoEm: now(),
        dias: c.dias.map(d => {
          if (d.dia !== dia) return d;
          return {
            ...d,
            refeicoes: d.refeicoes.map(r =>
              r.id === refeicaoId ? { ...r, ...patch } : r
            ),
          };
        }),
      };
    }));
  }, []);

  const addRefeicao = useCallback((
    cardapioId: string,
    dia:        DiaSemana,
    nome?:      string,
    horario?:   string,
  ) => {
    const nova = novaRefeicao(nome, horario);
    setCardapios(prev => prev.map(c => {
      if (c.id !== cardapioId) return c;
      return {
        ...c,
        atualizadoEm: now(),
        dias: c.dias.map(d =>
          d.dia === dia
            ? { ...d, refeicoes: [...d.refeicoes, nova] }
            : d
        ),
      };
    }));
    return nova.id;
  }, []);

  const removeRefeicao = useCallback((
    cardapioId: string,
    dia:        DiaSemana,
    refeicaoId: string,
  ) => {
    setCardapios(prev => prev.map(c => {
      if (c.id !== cardapioId) return c;
      return {
        ...c,
        atualizadoEm: now(),
        dias: c.dias.map(d =>
          d.dia === dia
            ? { ...d, refeicoes: d.refeicoes.filter(r => r.id !== refeicaoId) }
            : d
        ),
      };
    }));
  }, []);

  const toggleRefeicaoConcluida = useCallback((
    cardapioId: string,
    dia:        DiaSemana,
    refeicaoId: string,
  ) => {
    setCardapios(prev => prev.map(c => {
      if (c.id !== cardapioId) return c;
      return {
        ...c,
        dias: c.dias.map(d => {
          if (d.dia !== dia) return d;
          return {
            ...d,
            refeicoes: d.refeicoes.map(r =>
              r.id === refeicaoId ? { ...r, concluida: !r.concluida } : r
            ),
          };
        }),
      };
    }));
  }, []);

  // ══════════════════════════════════════════════════════════════
  // IA
  // ══════════════════════════════════════════════════════════════

  const gerarComIA = useCallback(async (
    input: GerarCardapioIAInput,
  ): Promise<Cardapio> => {
    setGerandoIA(true);
    setErro(null);

    const { solicitacao } = input;
    const m = solicitacao.medidas;

    const prompt = buildIAPrompt({
      alunoNome:  solicitacao.alunoNome,
      foco:       solicitacao.foco,
      objetivo:   solicitacao.objetivo,
      restricoes: solicitacao.restricoes,
      imc:        m?.imc,
      gorduraEst: m?.gorduraEst,
      rcq:        m?.rcq,
      peso:       m?.peso,
      altura:     m?.altura,
      sexo:       m?.sexo,
    });

    try {
      const res = await fetch("/api/ia/nutrition", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ prompt, solicitacaoId: solicitacao.id }),
      });

      if (!res.ok) throw new Error("Falha na geração por IA");

      const data = await res.json();

      const cardapio: Cardapio = {
        id:            uid(),
        communityId:   input.communityId,
        alunoId:       solicitacao.alunoId,
        alunoNome:     solicitacao.alunoNome,
        titulo:        `Cardápio ${solicitacao.alunoNome} — ${semanaAtual()}`,
        foco:          solicitacao.foco,
        semana:        semanaAtual(),
        dias:          data.dias ?? gerarDiasVazios(),
        calorias_dia:  data.calorias_dia  ?? 2000,
        proteinas_dia: data.proteinas_dia ?? 150,
        obs:           data.obs           ?? "",
        status:        "draft",
        geradoPorIA:   true,
        criadoEm:      now(),
        atualizadoEm:  now(),
        solicitacaoId: solicitacao.id,
      };

      setCardapios(prev => [cardapio, ...prev]);
      setSolicitacoes(prev =>
        prev.map(s => s.id === solicitacao.id
          ? { ...s, status: "em_andamento" }
          : s
        )
      );

      return cardapio;

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro desconhecido";
      setErro(msg);
      const fallback = novoCardapio(
        input.communityId,
        solicitacao.alunoId,
        solicitacao.alunoNome,
      );
      fallback.foco          = solicitacao.foco;
      fallback.solicitacaoId = solicitacao.id;
      setCardapios(prev => [fallback, ...prev]);
      return fallback;
    } finally {
      setGerandoIA(false);
    }
  }, [communityId]);

  // ══════════════════════════════════════════════════════════════
  // DERIVADOS
  // ══════════════════════════════════════════════════════════════

  const meuCardapio = useMemo(
    () => cardapios.find(
      c => c.alunoId === userId && c.status === "published"
    ) ?? null,
    [cardapios, userId]
  );

  const cardapiosPublicados = useMemo(
    () => cardapios.filter(c => c.status === "published"),
    [cardapios]
  );

  const solicitacoesPendentes = useMemo(
    () => solicitacoes.filter(s => s.status === "pendente"),
    [solicitacoes]
  );

  const ultimaMedida = useMemo(
    () => historicoMedidas
      .filter(m => m.alunoId === userId)
      .sort((a, b) => b.data.localeCompare(a.data))[0] ?? null,
    [historicoMedidas, userId]
  );

  const minhaSolicitacao = useMemo(
    () => solicitacoes.find(
      s => s.alunoId === userId && s.status !== "rejeitada"
    ) ?? null,
    [solicitacoes, userId]
  );

  // ══════════════════════════════════════════════════════════════
  // RETURN
  // ══════════════════════════════════════════════════════════════
  return {
    // ── Estado ──────────────────────────────────────────────────
    cardapios,
    solicitacoes,
    historicoMedidas,
    membros,
    gerandoIA,
    loadingSync,
    erro,

    // ── Derivados ────────────────────────────────────────────────
    meuCardapio,
    cardapiosPublicados,
    solicitacoesPendentes,
    ultimaMedida,
    minhaSolicitacao,

    // ── Sync ─────────────────────────────────────────────────────
    sincronizar,
    carregarMedidas,

    // ── Medidas ──────────────────────────────────────────────────
    salvarMedida,

    // ── Solicitações ─────────────────────────────────────────────
    enviarSolicitacao,
    atualizarStatusSolicitacao,
    removerSolicitacao,

    // ── Cardápios ────────────────────────────────────────────────
    salvarCardapio,
    publicarCardapio,
    removerCardapio,
    updateCardapioField,
    updateRefeicao,
    addRefeicao,
    removeRefeicao,
    toggleRefeicaoConcluida,

    // ── IA ───────────────────────────────────────────────────────
    gerarComIA,
  };
}

// ── Helper interno ────────────────────────────────────────────────
function gerarDiasVazios(): DiaCardapio[] {
  return DIAS_SEMANA.map(dia => novoDia(dia));
}
