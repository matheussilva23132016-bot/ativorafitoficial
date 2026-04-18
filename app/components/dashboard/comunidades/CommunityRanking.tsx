"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Crown, Info, Loader2, RefreshCw, Target, Trophy, Users, Zap } from "lucide-react";
import Image from "next/image";

interface RankingUser {
  posicao: number;
  user_id: string;
  nickname: string;
  full_name?: string;
  avatar_url?: string | null;
  xp_total: number;
  desafios_ok: number;
  desafios_total: number;
  tags?: string[];
}

interface CommunityRankingProps {
  communityId: string;
  currentUser: any;
}

type RankingFiltro = "top10" | "meu_entorno" | "todos";

const RANKING_FILTROS: { id: RankingFiltro; label: string }[] = [
  { id: "top10", label: "Top 10" },
  { id: "meu_entorno", label: "Meu entorno" },
  { id: "todos", label: "Todos" },
];

const isValidUrl = (url: unknown): url is string =>
  typeof url === "string" && url.length > 4 && url.startsWith("http");

const nameOf = (user: RankingUser) =>
  user.nickname || user.full_name || "Atleta";

const firstName = (user: RankingUser) => {
  const nome = nameOf(user).trim();
  if (!nome) return "Atleta";
  const [primeiro] = nome.split(" ");
  return primeiro || "Atleta";
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function CommunityRanking({ communityId, currentUser }: CommunityRankingProps) {
  const [ranking, setRanking] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<RankingFiltro>("top10");
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showAllMobileStats, setShowAllMobileStats] = useState(false);
  const [showMobilePodium, setShowMobilePodium] = useState(true);
  const [mobileRowsLimit, setMobileRowsLimit] = useState(8);

  const loadRanking = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/communities/${communityId}/ranking?semana=atual`);
      const data = res.ok ? await res.json() : {};
      setRanking(data.ranking ?? []);
    } catch {
      setRanking([]);
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  useEffect(() => {
    loadRanking();
  }, [loadRanking]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateViewport = () => setIsMobile(window.innerWidth < 640);
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    if (filtro !== "top10") setShowMobileFilters(true);
  }, [filtro]);

  useEffect(() => {
    setMobileRowsLimit(8);
  }, [filtro, ranking.length]);

  useEffect(() => {
    setShowMobilePodium(!isMobile);
  }, [isMobile]);

  const top3 = useMemo(() => ranking.slice(0, 3), [ranking]);
  const podiumOrder = useMemo(
    () => [top3[1], top3[0], top3[2]].filter(Boolean) as RankingUser[],
    [top3],
  );

  const meuId = String(currentUser?.id ?? "");
  const minhaPosicaoIndex = useMemo(
    () => ranking.findIndex(user => String(user.user_id) === meuId),
    [ranking, meuId],
  );
  const meuRegistro = minhaPosicaoIndex >= 0 ? ranking[minhaPosicaoIndex] : null;

  const totalXpDistribuido = useMemo(
    () => ranking.reduce((acc, user) => acc + (user.xp_total ?? 0), 0),
    [ranking],
  );
  const mediaXp = ranking.length > 0 ? Math.round(totalXpDistribuido / ranking.length) : 0;
  const topXp = ranking[0]?.xp_total ?? 0;
  const cardsResumo = [
    { label: "Participantes", value: ranking.length, icon: Users, tone: "text-sky-300" },
    { label: "Topo da semana", value: `${topXp} XP`, icon: Crown, tone: "text-amber-300" },
    { label: "Média de XP", value: `${mediaXp} XP`, icon: Zap, tone: "text-emerald-300" },
    { label: "Sua posição", value: meuRegistro ? `${meuRegistro.posicao}º` : "--", icon: Target, tone: "text-white" },
  ];
  const cardsResumoVisiveis = isMobile && !showAllMobileStats ? cardsResumo.slice(0, 2) : cardsResumo;

  const rankingFiltrado = useMemo(() => {
    if (filtro === "todos") return ranking;

    if (filtro === "meu_entorno") {
      if (minhaPosicaoIndex < 0) return ranking.slice(0, 10);
      const inicio = Math.max(0, minhaPosicaoIndex - 2);
      const fim = Math.min(ranking.length, minhaPosicaoIndex + 3);
      return ranking.slice(inicio, fim);
    }

    return ranking.slice(0, 10);
  }, [filtro, minhaPosicaoIndex, ranking]);

  const minhaPosicaoVisivel = useMemo(
    () => rankingFiltrado.some(user => String(user.user_id) === meuId),
    [rankingFiltrado, meuId],
  );

  const rankingRenderizado =
    isMobile && filtro === "todos"
      ? rankingFiltrado.slice(0, mobileRowsLimit)
      : rankingFiltrado;
  const hasMoreRankingMobile =
    isMobile && filtro === "todos" && rankingRenderizado.length < rankingFiltrado.length;

  return (
    <div className="space-y-4 text-left sm:space-y-5">
      <section className="rounded-[24px] border border-white/10 bg-[#06101D] p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-amber-200">
              <Trophy size={13} /> Ranking semanal
            </div>
            <h2 className="mt-3 break-words text-2xl font-black italic leading-none tracking-tighter text-white sm:text-3xl">
              Classificação com foco no que importa
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-white/40">
              Compare desempenho real da semana, acompanhe evolução e veja sua posição sem poluição visual.
            </p>
          </div>

          <button
            type="button"
            onClick={loadRanking}
            disabled={loading}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-[10px] font-black uppercase tracking-widest text-white/60 transition hover:text-white disabled:opacity-45"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Atualizar
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {cardsResumoVisiveis.map(card => (
            <article key={card.label} className="rounded-2xl border border-white/10 bg-black/20 p-3 sm:p-4">
              <card.icon size={16} className={card.tone} />
              <p className="mt-2 text-[8px] font-black uppercase tracking-widest text-white/30">{card.label}</p>
              <p className="mt-1 text-sm font-black text-white">{card.value}</p>
            </article>
          ))}
        </div>

        {isMobile && (
          <button
            type="button"
            onClick={() => setShowAllMobileStats(current => !current)}
            className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-[10px] font-black uppercase tracking-widest text-white/50 transition hover:text-white sm:hidden"
          >
            {showAllMobileStats ? "Ver resumo compacto" : "Ver todos os indicadores"}
          </button>
        )}

        {meuRegistro && (
          <article className="mt-3 rounded-2xl border border-sky-500/20 bg-sky-500/10 p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-sky-200/80">Seu desempenho</p>
                <p className="mt-1 text-sm font-black text-sky-100">
                  {firstName(meuRegistro)}, você está em {meuRegistro.posicao}º com {meuRegistro.xp_total} XP.
                </p>
                <p className="mt-1 text-xs text-sky-100/70">
                  {meuRegistro.desafios_ok ?? 0} desafios aprovados de {meuRegistro.desafios_total ?? 0}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFiltro("meu_entorno")}
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-sky-300/25 bg-sky-400/10 px-3 text-[9px] font-black uppercase tracking-widest text-sky-100 transition hover:bg-sky-400/20"
              >
                Ver meu entorno
              </button>
            </div>
          </article>
        )}
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/45">
            Filtro atual: {RANKING_FILTROS.find(item => item.id === filtro)?.label ?? "Top 10"}
          </p>
          <p className="text-[9px] font-black uppercase tracking-widest text-sky-300">{rankingFiltrado.length} posições</p>
        </div>

        <div className="sm:hidden">
          <button
            type="button"
            onClick={() => setShowMobileFilters(current => !current)}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-[10px] font-black uppercase tracking-widest text-white/55 transition hover:text-white"
          >
            {showMobileFilters ? "Ocultar filtros" : "Mostrar filtros"}
          </button>
        </div>

        <div className={`${showMobileFilters ? "block" : "hidden"} sm:hidden`}>
          <select
            value={filtro}
            onChange={event => setFiltro(event.target.value as RankingFiltro)}
            className="min-h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-bold text-white outline-none transition focus:border-sky-500/35"
          >
            {RANKING_FILTROS.map(opcao => (
              <option key={opcao.id} value={opcao.id}>
                {opcao.label}
              </option>
            ))}
          </select>
        </div>

        <div className="hidden grid-cols-3 gap-2 sm:flex sm:flex-wrap">
          {RANKING_FILTROS.map(opcao => (
            <button
              key={opcao.id}
              type="button"
              onClick={() => setFiltro(opcao.id)}
              className={`inline-flex min-h-11 items-center justify-center rounded-xl px-3 text-[9px] font-black uppercase tracking-widest transition-all sm:px-4 ${
                filtro === opcao.id
                  ? "border border-sky-500/30 bg-sky-500/15 text-sky-200"
                  : "border border-white/10 bg-white/5 text-white/45 hover:text-white"
              }`}
            >
              {opcao.label}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader2 className="animate-spin text-sky-400" size={26} />
        </div>
      ) : ranking.length === 0 ? (
        <section className="rounded-[24px] border border-white/10 bg-[#050B14] p-8 text-center">
          <Trophy size={34} className="mx-auto text-white/20" />
          <p className="mt-4 text-sm font-black text-white">Ainda não existe ranking nesta semana.</p>
          <p className="mt-2 text-sm text-white/35">
            Assim que os desafios forem aprovados, a classificação aparece aqui.
          </p>
        </section>
      ) : (
        <>
          {isMobile && (
            <button
              type="button"
              onClick={() => setShowMobilePodium(current => !current)}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-[10px] font-black uppercase tracking-widest text-white/55 transition hover:text-white sm:hidden"
            >
              {showMobilePodium ? "Ocultar pódio" : "Mostrar pódio"}
            </button>
          )}

          {(!isMobile || showMobilePodium) && (
            <section className="rounded-[24px] border border-white/10 bg-[#050B14] p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-white/45">Pódio da semana</h3>
                <p className="text-[10px] font-bold text-white/25">Atualização automática</p>
              </div>

              <div className="mt-4 flex items-end justify-center gap-2 sm:gap-6">
                {podiumOrder.map((user, idx) => {
                  const isFirst = user.posicao === 1;
                  const isSecond = user.posicao === 2;
                  const isMe = String(user.user_id) === meuId;
                  const altura = isFirst ? "h-36 sm:h-44" : isSecond ? "h-28 sm:h-36" : "h-24 sm:h-32";
                  const tone = isFirst
                    ? "border-amber-300 text-amber-200"
                    : isSecond
                      ? "border-zinc-300 text-zinc-200"
                      : "border-orange-400 text-orange-300";

                  return (
                    <motion.div
                      key={user.user_id}
                      initial={{ y: 24, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: idx * 0.08 }}
                      className="flex min-w-0 flex-col items-center"
                    >
                      {isFirst ? <Crown size={24} className="mb-1 text-amber-300" /> : <div className="mb-1 h-6" />}
                      <div
                        className={`relative overflow-hidden rounded-xl border-4 bg-white/10 ${
                          isFirst ? "h-20 w-20 sm:h-24 sm:w-24" : "h-16 w-16 sm:h-20 sm:w-20"
                        } ${tone}`}
                      >
                        {isValidUrl(user.avatar_url) ? (
                          <Image src={user.avatar_url} alt={nameOf(user)} fill className="object-cover" unoptimized />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xl font-black text-white/40">
                            {nameOf(user)[0]}
                          </div>
                        )}
                      </div>
                      <div
                        className={`mt-2 flex w-24 flex-col items-center justify-start rounded-t-xl border border-b-0 border-white/10 bg-white/5 pt-3 sm:w-32 ${altura}`}
                      >
                        <span className={`text-2xl font-black ${tone}`}>{user.posicao}º</span>
                        <span className="mt-2 w-full truncate px-2 text-center text-xs font-black text-white">
                          {firstName(user)}
                        </span>
                        <span className="mt-1 text-xs font-black text-white/45">{user.xp_total} XP</span>
                        {isMe && (
                          <span className="mt-1 rounded bg-sky-400 px-1.5 py-0.5 text-[10px] font-black text-black">
                            você
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          )}

          <section className="rounded-[24px] border border-white/10 bg-[#050B14] p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between px-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-white/45">Classificação geral</h3>
              <div className="flex items-center gap-1 text-[11px] font-bold text-white/25">
                <Info size={12} /> fecha domingo
              </div>
            </div>

            <div className="space-y-2">
              {rankingRenderizado.map(user => {
                const isMe = String(user.user_id) === meuId;
                const desafiosTotal = Math.max(0, user.desafios_total ?? 0);
                const desafiosOk = Math.max(0, user.desafios_ok ?? 0);
                const progresso = desafiosTotal > 0
                  ? clamp(Math.round((desafiosOk / desafiosTotal) * 100), 0, 100)
                  : 0;

                return (
                  <motion.article
                    key={user.user_id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(user.posicao * 0.025, 0.35) }}
                    className={`rounded-xl border p-3 sm:p-4 ${
                      isMe
                        ? "border-sky-400/40 bg-sky-400/10"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={`w-8 shrink-0 text-center text-base font-black ${isMe ? "text-sky-300" : "text-white/35"}`}>
                          {user.posicao}º
                        </span>
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white/10">
                          {isValidUrl(user.avatar_url) ? (
                            <Image src={user.avatar_url} alt={nameOf(user)} fill className="object-cover" unoptimized />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm font-black text-white/35">
                              {nameOf(user)[0]}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className={`truncate text-sm font-black ${isMe ? "text-sky-200" : "text-white"}`}>
                              {nameOf(user)}
                            </h4>
                            {isMe && (
                              <span className="rounded bg-sky-400 px-1.5 py-0.5 text-[10px] font-black text-black">
                                você
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-white/35">
                            {desafiosOk} aprovados de {desafiosTotal}
                          </p>
                          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                            <div
                              className={`h-full rounded-full ${isMe ? "bg-sky-300" : "bg-emerald-400/80"}`}
                              style={{ width: `${progresso}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pl-3 text-right">
                        <p className={`text-sm font-black ${isMe ? "text-sky-200" : "text-white"}`}>
                          {user.xp_total ?? 0}
                          <span className="ml-1 text-xs font-bold text-white/35">XP</span>
                        </p>
                        <p className="text-[10px] font-bold text-white/30">{progresso}%</p>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>

            {filtro !== "todos" && ranking.length > rankingFiltrado.length && (
              <button
                type="button"
                onClick={() => setFiltro("todos")}
                className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-[9px] font-black uppercase tracking-widest text-white/55 transition hover:text-white"
              >
                Ver classificação completa
              </button>
            )}

            {hasMoreRankingMobile && (
              <button
                type="button"
                onClick={() => setMobileRowsLimit(current => current + 8)}
                className="mt-2 inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-[9px] font-black uppercase tracking-widest text-white/55 transition hover:text-white sm:hidden"
              >
                Mostrar mais posições
              </button>
            )}

            {meuRegistro && !minhaPosicaoVisivel && (
              <button
                type="button"
                onClick={() => setFiltro("meu_entorno")}
                className="mt-2 inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-sky-500/25 bg-sky-500/10 px-3 text-[9px] font-black uppercase tracking-widest text-sky-200 transition hover:bg-sky-500/20"
              >
                Mostrar minha posição
              </button>
            )}
          </section>
        </>
      )}
    </div>
  );
}
