"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  CheckCircle2,
  Clock,
  Dumbbell,
  Flame,
  Loader2,
  Medal,
  Megaphone,
  RefreshCw,
  ShieldCheck,
  Target,
  Trophy,
  Users,
  UtensilsCrossed,
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

function formatDate(date: string | null | undefined) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

function formatStatus(status: string | null | undefined) {
  const map: Record<string, string> = {
    pendente: "pendente",
    em_andamento: "em andamento",
    concluida: "concluída",
    rejeitada: "rejeitada",
    aprovado: "aprovado",
    reprovado: "reprovado",
    reenvio: "reenviar",
  };
  return map[status ?? ""] ?? "sem pedido";
}

function avatarFallback(name: string) {
  return (name || "A")[0]?.toUpperCase() ?? "A";
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
  const isProfessional = userTags.some(tag =>
    ["Dono", "ADM", "Instrutor", "Personal", "Nutri", "Nutricionista"].includes(tag),
  );

  const loadDashboard = useCallback(async () => {
    if (!communityId || !currentUser?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/communities/${communityId}/dashboard?userId=${currentUser.id}`,
      );
      const json = res.ok ? await res.json() : null;
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
        detail: ranking ? `${ranking.desafios_ok ?? 0} check-ins` : "comece hoje",
        icon: Flame,
        color: "text-rose-400",
      },
      {
        label: "Ranking",
        value: ranking ? `${ranking.posicao}º` : "-",
        detail: "classificação",
        icon: Trophy,
        color: "text-amber-300",
      },
      {
        label: "Desafios",
        value: String(data?.metrics?.desafiosAtivos ?? 0),
        detail: "ativos",
        icon: Target,
        color: "text-sky-400",
      },
      {
        label: canManage ? "Pedidos" : "Membros",
        value: String(canManage ? data?.metrics?.pedidosEntrada ?? 0 : data?.metrics?.membros ?? 0),
        detail: canManage ? "entrada" : "na comunidade",
        icon: canManage ? ShieldCheck : Users,
        color: "text-emerald-300",
      },
    ];
  }, [canManage, data]);

  if (loading) {
    return (
      <div className="min-h-[420px] flex items-center justify-center">
        <Loader2 className="animate-spin text-sky-400" size={28} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
        <p className="text-sm font-black text-white">Não consegui carregar o hub.</p>
        <button
          onClick={loadDashboard}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-xs font-black text-black"
        >
          <RefreshCw size={14} /> Tentar de novo
        </button>
      </div>
    );
  }

  const treino = data.treinoAtual;
  const cardapio = data.cardapioAtual;
  const treinoStatus = data.solicitacoes?.treino;
  const nutriStatus = data.solicitacoes?.nutricao;

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-[10px] font-black uppercase tracking-widest text-sky-300">
              Hub da comunidade
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
              {data.community.nome}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/45">
              {data.community.descricao
                ? data.community.descricao
                : `Acompanhe treinos, cardápios, desafios e avisos do grupo com foco em ${data.community.foco || "evolução constante"}.`}
            </p>
          </div>
          <button
            onClick={() => onNavigate("avisos")}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-sky-400/20 bg-sky-500/10 px-4 text-xs font-black uppercase tracking-widest text-sky-200 transition hover:bg-sky-500 hover:text-black xl:w-auto"
          >
            <Megaphone size={16} />
            Abrir avisos
          </button>
        </div>
      </section>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {metrics.map(item => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4"
          >
            <item.icon className={item.color} size={18} />
            <p className="mt-3 text-[11px] font-bold text-white/35">{item.label}</p>
            <p className="mt-1 text-xl font-black text-white">{item.value}</p>
            <p className="text-[11px] font-bold text-white/25">{item.detail}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-4">
        <div className="space-y-4">
          <section className="rounded-2xl border border-sky-500/15 bg-[#06101D] p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <p className="text-xs font-black text-sky-300">Plano da semana</p>
                <h2 className="mt-1 text-2xl sm:text-3xl font-black text-white">
                  {treino?.titulo ?? "Treino aguardando publicação"}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-white/45">
                  {treino
                    ? `${treino.dia_semana ?? "Semana livre"} - ${treino.foco ?? "foco aberto"}`
                    : "Solicite seu treino ou aguarde a publicação do instrutor."}
                </p>
              </div>
              <button
                onClick={() => onNavigate("treinos")}
                className="w-full rounded-xl bg-sky-500 px-4 py-3 text-xs font-black text-black sm:w-auto"
              >
                Abrir treinos
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <Dumbbell className="text-sky-300" size={20} />
                <p className="mt-3 text-xs font-black text-white">Treino atual</p>
                <p className="mt-1 text-xs text-white/40">
                {treino ? "Disponível para execução e acompanhamento." : "Nenhum treino publicado para você."}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <UtensilsCrossed className="text-emerald-300" size={20} />
                <p className="mt-3 text-xs font-black text-white">
              {cardapio?.titulo ?? "Cardápio semanal"}
                </p>
                <p className="mt-1 text-xs text-white/40">
                  {cardapio
                    ? `${cardapio.foco ?? "objetivo aberto"} - ${cardapio.calorias_meta ?? "-"} kcal`
                    : "Envie suas medidas e objetivo para a nutri."}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black text-amber-300">Desafios de hoje</p>
                <p className="text-sm text-white/35">Pontos entram somente após aprovação.</p>
              </div>
              <button
                onClick={() => onNavigate("desafios")}
                className="w-full rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-white/60 sm:w-auto"
              >
                Ver todos
              </button>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.desafiosHoje.length > 0 ? data.desafiosHoje.map(desafio => (
                <div key={desafio.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-white">{desafio.titulo}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-white/35">{desafio.descricao}</p>
                    </div>
                    <span className="rounded-md bg-amber-400/15 px-2 py-1 text-[11px] font-black text-amber-200">
                      +{desafio.xp_recompensa} XP
                    </span>
                  </div>
                </div>
              )) : (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/35">
                  Nenhum desafio liberado para hoje.
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black text-amber-300">Top da semana</p>
              <button
                onClick={() => onNavigate("ranking")}
                className="rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-white/60"
              >
                Ranking
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {data.ranking.top.length > 0 ? data.ranking.top.map((row, index) => (
                <div key={row.user_id} className="flex items-center gap-3 rounded-2xl bg-black/20 p-3">
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
                    <p className="text-xs text-white/30">{row.desafios_ok ?? 0} checks</p>
                  </div>
                  <p className="text-sm font-black text-white">{row.xp_total ?? 0} XP</p>
                </div>
              )) : (
                <p className="rounded-2xl bg-black/20 p-4 text-sm text-white/35">
                  O ranking vai ganhar vida quando os desafios forem aprovados.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black text-sky-300">Notificações</p>
              <Bell size={16} className="text-white/30" />
            </div>
            <div className="mt-4 space-y-2">
              {data.notificacoes.length > 0 ? data.notificacoes.slice(0, 4).map(notif => (
                <div key={notif.id} className="rounded-2xl bg-black/20 p-3">
                  <div className="flex items-center gap-2">
                    {!notif.lida && <span className="h-2 w-2 rounded-full bg-sky-400" />}
                    <p className="text-sm font-black text-white">{notif.titulo}</p>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-white/35">{notif.mensagem}</p>
                </div>
              )) : (
                <p className="rounded-2xl bg-black/20 p-4 text-sm text-white/35">
                  Tudo em dia por aqui.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black text-white/70">Regras da comunidade</p>
              <ShieldCheck size={16} className="text-emerald-300" />
            </div>
            <div className="mt-4 space-y-2">
              {(data.regras?.length ?? 0) > 0 ? data.regras?.slice(0, 4).map((regra, index) => (
                <div key={regra.id ?? index} className="rounded-2xl bg-black/20 p-3">
                  <p className="text-sm font-black text-white">{index + 1}. {regra.titulo}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-white/35">{regra.descricao}</p>
                </div>
              )) : (
                <p className="rounded-2xl bg-black/20 p-4 text-sm text-white/35">
                  As regras aparecem aqui depois que o Dono configurar o grupo.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
            <p className="text-xs font-black text-emerald-300">Status do aluno</p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2">
              <button
                onClick={() => onNavigate("treinos")}
                className="flex items-center justify-between rounded-2xl bg-black/20 p-3 text-left"
              >
                <span>
                  <span className="block text-sm font-black text-white">Pedido de treino</span>
                  <span className="text-xs text-white/35">{formatStatus(treinoStatus?.status)}</span>
                </span>
                <Clock size={16} className="text-white/30" />
              </button>
              <button
                onClick={() => onNavigate("nutricao")}
                className="flex items-center justify-between rounded-2xl bg-black/20 p-3 text-left"
              >
                <span>
                  <span className="block text-sm font-black text-white">Pedido nutricional</span>
                  <span className="text-xs text-white/35">{formatStatus(nutriStatus?.status)}</span>
                </span>
                <Clock size={16} className="text-white/30" />
              </button>
            </div>
          </section>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black text-white/70">Membros em destaque</p>
            <Users size={16} className="text-white/30" />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {data.membrosDestaque.map(member => (
              <div key={member.id} className="flex items-center gap-2 rounded-2xl bg-black/20 px-3 py-2">
                <div className="relative h-8 w-8 overflow-hidden rounded-lg bg-white/10">
                  {isValidUrl(member.foto_url) ? (
                    <Image src={member.foto_url} alt={member.nickname ?? "Atleta"} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-black text-white/40">
                      {avatarFallback(member.nickname)}
                    </div>
                  )}
                </div>
                <div>
                  <p className="max-w-[130px] truncate text-xs font-black text-white">{member.nickname ?? "Atleta"}</p>
                  <p className="text-[11px] text-white/30">{member.tags?.[0] ?? "Participante"}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black text-white/70">Selos e progresso</p>
            <Medal size={16} className="text-amber-300" />
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.selos.length > 0 ? data.selos.map(selo => (
              <div key={selo.id} className="rounded-2xl bg-black/20 p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-300" />
                  <p className="text-sm font-black text-white">{selo.nome}</p>
                </div>
                <p className="mt-1 text-xs text-white/30">{formatDate(selo.concedido_em)}</p>
              </div>
            )) : (
              <div className="rounded-2xl bg-black/20 p-4 text-sm text-white/35">
                Complete treinos, refeições e desafios para liberar selos.
              </div>
            )}
            {isProfessional && (
              <button
                onClick={() => onNavigate(canManage ? "gestao" : "treinos")}
                className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-4 text-left text-sm font-black text-sky-200"
              >
                {canManage ? `${data.metrics.pedidosEntrada} pedidos de entrada` : "Painel profissional"}
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
