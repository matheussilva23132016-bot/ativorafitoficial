"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock3,
  Dumbbell,
  Flame,
  Loader2,
  Megaphone,
  RefreshCw,
  ShieldCheck,
  Target,
  Trophy,
  Users,
  UtensilsCrossed,
  Zap,
} from "lucide-react";
import Image from "next/image";

interface CommunityPremiumDashboardProps {
  communityId: string;
  currentUser: any;
  userTags: string[];
  onNavigate: (tab: string) => void;
}

interface DashboardData {
  community: {
    nome: string;
    descricao?: string | null;
    foco?: string | null;
  };
  userTags: string[];
  week: { start: string; end: string };
  metrics: {
    membros: number;
    pedidosEntrada: number;
    desafiosAtivos: number;
    treinosPublicados: number;
  };
  regras?: any[];
  treinoAtual: any | null;
  cardapioAtual: any | null;
  desafiosHoje: any[];
  ranking: {
    top: any[];
    me: any | null;
  };
  notificacoes: any[];
  selos: any[];
  membrosDestaque: any[];
  solicitacoes: {
    treino: any | null;
    nutricao: any | null;
  };
}

const isValidUrl = (url: unknown): url is string =>
  typeof url === "string" && url.startsWith("http");

function avatarFallback(name: string) {
  return (name || "A")[0]?.toUpperCase() ?? "A";
}

function formatStatus(status: string | null | undefined) {
  const map: Record<string, string> = {
    pendente: "pendente",
    em_andamento: "em andamento",
    concluida: "concluida",
    rejeitada: "rejeitada",
    aprovado: "aprovado",
    reprovado: "reprovado",
    reenvio: "reenviar",
  };
  return map[status ?? ""] ?? "sem pedido";
}

export function CommunityPremiumDashboard({
  communityId,
  currentUser,
  userTags,
  onNavigate,
}: CommunityPremiumDashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const canManage = userTags.some(tag => ["Dono", "ADM"].includes(tag));

  const loadDashboard = useCallback(async () => {
    if (!communityId || !currentUser?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/communities/${communityId}/dashboard?userId=${currentUser.id}`,
      );
      const json = response.ok ? await response.json() : null;
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [communityId, currentUser?.id]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const metrics = useMemo(() => {
    const ranking = data?.ranking?.me;
    return [
      {
        label: "Minha semana",
        value: ranking ? `${ranking.xp_total ?? 0} XP` : "0 XP",
        detail: ranking ? `${ranking.desafios_ok ?? 0} desafios concluídos` : "comece hoje",
        icon: Flame,
        tone: "text-rose-300",
      },
      {
        label: "Ranking",
        value: ranking ? `${ranking.posicao}º` : "-",
        detail: "posição atual",
        icon: Trophy,
        tone: "text-amber-300",
      },
      {
        label: "Desafios",
        value: String(data?.metrics?.desafiosAtivos ?? 0),
        detail: "ativos agora",
        icon: Target,
        tone: "text-sky-300",
      },
      {
        label: canManage ? "Pedidos" : "Membros",
        value: String(canManage ? data?.metrics?.pedidosEntrada ?? 0 : data?.metrics?.membros ?? 0),
        detail: canManage ? "entrada pendente" : "no grupo",
        icon: canManage ? ShieldCheck : Users,
        tone: "text-emerald-300",
      },
    ];
  }, [canManage, data]);

  const treino = data?.treinoAtual ?? null;
  const cardapio = data?.cardapioAtual ?? null;
  const desafiosHoje = data?.desafiosHoje ?? [];
  const topRanking = data?.ranking?.top ?? [];
  const notificacoes = data?.notificacoes ?? [];
  const regras = data?.regras ?? [];
  const unreadCount = notificacoes.filter((item: any) => !item?.lida).length;
  const pendingRequests = data?.metrics?.pedidosEntrada ?? 0;

  const immediateFocus = useMemo(() => {
    if (canManage && pendingRequests > 0) {
      const total = pendingRequests;
      return {
        title: "Pedidos aguardando revisão",
        subtitle: `${total} ${total === 1 ? "solicitação pendente" : "solicitações pendentes"} para aprovação.`,
        tab: "gestao",
        button: "Abrir gestao",
      };
    }

    if (desafiosHoje.length > 0) {
      return {
        title: "Desafios ativos hoje",
        subtitle: `${desafiosHoje.length} desafio(s) com pontos disponíveis para evolução da comunidade.`,
        tab: "desafios",
        button: "Abrir desafios",
      };
    }

    if (unreadCount > 0) {
      return {
        title: "Avisos sem leitura",
        subtitle: `${unreadCount} aviso(s) aguardam confirmacao.`,
        tab: "avisos",
        button: "Ler avisos",
      };
    }

    return {
      title: "Fluxo da semana em dia",
      subtitle: "Treino, nutrição e ranking estao sincronizados. Mantenha o ritmo.",
      tab: "treinos",
      button: "Revisar treinos",
    };
  }, [canManage, pendingRequests, desafiosHoje.length, unreadCount]);

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-white/10 bg-white/5">
        <Loader2 className="animate-spin text-sky-400" size={28} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
        <p className="text-sm font-black text-white">Não foi possível carregar o resumo da comunidade.</p>
        <button
          type="button"
          onClick={loadDashboard}
          className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-sky-500 px-4 text-xs font-black uppercase tracking-widest text-black"
        >
          <RefreshCw size={14} />
          Tentar de novo
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-5">
      <section className="rounded-2xl border border-sky-500/15 bg-[#06101D] p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[10px] font-black uppercase tracking-widest text-sky-300">Resumo da comunidade</p>
            <h2 className="mt-2 break-words text-2xl font-black italic leading-none tracking-tighter text-white sm:text-3xl [overflow-wrap:anywhere]">
              {data.community.nome}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/45">
              {data.community.descricao
                ? data.community.descricao
                : `Treino, nutrição e desafios com foco em ${data.community.foco || "evolução constante"}.`}
            </p>
            <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white/50">
              <Zap size={12} className="text-sky-300" />
              <span className="truncate">Foco imediato: {immediateFocus.title}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => onNavigate("avisos")}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-sky-400/25 bg-sky-500/10 px-4 text-[10px] font-black uppercase tracking-widest text-sky-200 transition hover:bg-sky-500 hover:text-black"
            >
              <Megaphone size={14} />
              Abrir avisos
            </button>
            <button
              type="button"
              onClick={() => onNavigate(immediateFocus.tab)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 text-[10px] font-black uppercase tracking-widest text-white/60 transition hover:text-white"
            >
              <ArrowRight size={14} />
              {immediateFocus.button}
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {metrics.map(metric => (
          <motion.article
            key={metric.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4"
          >
            <metric.icon size={17} className={metric.tone} />
            <p className="mt-2 text-[9px] font-black uppercase tracking-widest text-white/30">{metric.label}</p>
            <p className="mt-1 text-base font-black text-white sm:text-lg">{metric.value}</p>
            <p className="text-[10px] text-white/35">{metric.detail}</p>
          </motion.article>
        ))}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-sky-300">Painel de hoje</p>
            <p className="text-sm text-white/40">{immediateFocus.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={loadDashboard}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 text-[10px] font-black uppercase tracking-widest text-white/45 transition hover:text-white"
          >
            <RefreshCw size={13} />
            Atualizar
          </button>
        </div>

        <div className="mt-4 flex gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
          <button
            type="button"
            onClick={() => onNavigate("treinos")}
            className="min-w-[248px] rounded-2xl border border-white/10 bg-black/20 p-4 text-left transition hover:bg-white/[0.08] md:min-w-0"
          >
            <Dumbbell size={18} className="text-sky-300" />
            <p className="mt-2 text-xs font-black uppercase tracking-widest text-white/35">Treino</p>
            <p className="mt-1 text-sm font-black text-white">
              {treino?.titulo ?? "Sem treino publicado"}
            </p>
            <p className="mt-1 text-xs text-white/35">
              {treino ? `${treino.dia_semana ?? "Semana"} - ${treino.foco ?? "foco aberto"}` : "Abra treinos para solicitar ou revisar."}
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate("nutricao")}
            className="min-w-[248px] rounded-2xl border border-white/10 bg-black/20 p-4 text-left transition hover:bg-white/[0.08] md:min-w-0"
          >
            <UtensilsCrossed size={18} className="text-emerald-300" />
            <p className="mt-2 text-xs font-black uppercase tracking-widest text-white/35">Nutrição</p>
            <p className="mt-1 text-sm font-black text-white">
              {cardapio?.titulo ?? "Sem cardápio publicado"}
            </p>
            <p className="mt-1 text-xs text-white/35">
              {cardapio
                ? `${cardapio.foco ?? "objetivo aberto"} - ${cardapio.calorias_meta ?? "-"} kcal`
                : "Envie medidas e objetivo para liberar o plano."}
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate("desafios")}
            className="min-w-[248px] rounded-2xl border border-white/10 bg-black/20 p-4 text-left transition hover:bg-white/[0.08] md:min-w-0"
          >
            <Target size={18} className="text-amber-300" />
            <p className="mt-2 text-xs font-black uppercase tracking-widest text-white/35">Desafios</p>
            <p className="mt-1 text-sm font-black text-white">
              {desafiosHoje.length > 0 ? `${desafiosHoje.length} ativos hoje` : "Nenhum desafio hoje"}
            </p>
            <p className="mt-1 text-xs text-white/35">
              {desafiosHoje.length > 0
                ? `Recompensa até +${Math.max(...desafiosHoje.map((item: any) => Number(item.xp_recompensa || 0)))} XP`
                : "Volte depois para novos desafios."}
            </p>
          </button>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-300">Ranking rápido</p>
            <button
              type="button"
              onClick={() => onNavigate("ranking")}
              className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white/50 transition hover:text-white"
            >
              Ver ranking
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {topRanking.length > 0 ? (
              topRanking.map((row: any, index: number) => (
                <article key={row.user_id || index} className="flex items-center gap-3 rounded-2xl bg-black/20 p-3">
                  <span className="w-6 text-center text-sm font-black text-amber-200">{index + 1}</span>
                  <div className="relative h-9 w-9 overflow-hidden rounded-lg bg-white/10">
                    {isValidUrl(row.foto_url) ? (
                      <Image src={row.foto_url} alt={row.nickname ?? "Atleta"} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-black text-white/40">
                        {avatarFallback(row.nickname)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-white">{row.nickname ?? "Atleta"}</p>
                    <p className="text-xs text-white/30">{row.desafios_ok ?? 0} desafios</p>
                  </div>
                  <p className="text-sm font-black text-white">{row.xp_total ?? 0} XP</p>
                </article>
              ))
            ) : (
              <p className="rounded-2xl bg-black/20 p-4 text-sm text-white/35">
                O ranking aparece quando os desafios forem aprovados.
              </p>
            )}
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <div className="rounded-2xl bg-black/20 p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/35">Pedido de treino</p>
              <p className="mt-1 text-sm font-black text-white">{formatStatus(data.solicitacoes?.treino?.status)}</p>
            </div>
            <div className="rounded-2xl bg-black/20 p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/35">Pedido nutricional</p>
              <p className="mt-1 text-sm font-black text-white">{formatStatus(data.solicitacoes?.nutricao?.status)}</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-sky-300">Avisos e regras</p>
            <button
              type="button"
              onClick={() => onNavigate("avisos")}
              className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 text-[10px] font-black uppercase tracking-widest text-white/50 transition hover:text-white"
            >
              <Bell size={13} />
              Avisos
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {notificacoes.length > 0 ? (
              notificacoes.slice(0, 3).map((notif: any) => (
                <article key={notif.id} className="rounded-2xl bg-black/20 p-3">
                  <div className="flex items-center gap-2">
                    {!notif.lida && <span className="h-2 w-2 rounded-full bg-sky-400" />}
                    <p className="text-sm font-black text-white">{notif.titulo}</p>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-white/35">{notif.mensagem}</p>
                </article>
              ))
            ) : (
              <p className="rounded-2xl bg-black/20 p-4 text-sm text-white/35">Sem avisos pendentes no momento.</p>
            )}
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Regras principais</p>
            <div className="mt-2 space-y-2">
              {regras.length > 0 ? (
                regras.slice(0, 3).map((regra: any, index: number) => (
                  <div key={regra.id || index} className="flex items-start gap-2">
                    <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-300" />
                    <p className="text-xs leading-relaxed text-white/40">{regra.titulo}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-white/35">As regras aparecem após configuração do grupo.</p>
              )}
            </div>
          </div>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white/45">
            <Clock3 size={12} />
            Semana: {data.week?.start || "-"} até {data.week?.end || "-"}
          </div>
        </section>
      </div>
    </div>
  );
}
