"use client";

import React, { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Crown, Info, Loader2, RefreshCw, Trophy } from "lucide-react";
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

const isValidUrl = (url: unknown): url is string =>
  typeof url === "string" && url.length > 4 && url.startsWith("http");

const nameOf = (user: RankingUser) =>
  user.nickname || user.full_name || "Atleta";

export function CommunityRanking({ communityId, currentUser }: CommunityRankingProps) {
  const [ranking, setRanking] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState(true);

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

  const top3 = ranking.slice(0, 3);
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean) as RankingUser[];

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs font-black text-amber-200">
            <Trophy size={14} /> Ranking semanal
          </div>
          <h2 className="mt-3 text-3xl sm:text-5xl font-black text-white">
            Classificacao da comunidade
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/35">
            O ranking considera desafios aprovados, pontos da semana e consistencia. Domingo fecha o ciclo e preserva o historico.
          </p>
        </div>
        <button
          onClick={loadRanking}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-xs font-black text-white/60 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Atualizar
        </button>
      </div>

      {loading ? (
        <div className="flex min-h-[320px] items-center justify-center">
          <Loader2 className="animate-spin text-sky-400" size={28} />
        </div>
      ) : ranking.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-white/5 p-8 text-center">
          <Trophy size={34} className="mx-auto text-white/20" />
          <p className="mt-4 text-sm font-black text-white">Ainda nao existe ranking nesta semana.</p>
          <p className="mt-2 text-sm text-white/35">
            Assim que os desafios forem aprovados, a classificacao aparece aqui.
          </p>
        </div>
      ) : (
        <>
          <div className="flex justify-center items-end gap-3 sm:gap-6 pt-6">
            {podiumOrder.map((user, idx) => {
              const isFirst = user.posicao === 1;
              const height = isFirst ? "h-36 sm:h-44" : idx === 0 ? "h-28 sm:h-36" : "h-24 sm:h-32";
              const tone = isFirst
                ? "border-amber-300 text-amber-200"
                : user.posicao === 2
                  ? "border-zinc-300 text-zinc-200"
                  : "border-orange-400 text-orange-300";

              return (
                <motion.div
                  key={user.user_id}
                  initial={{ y: 32, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex min-w-0 flex-col items-center"
                >
                  {isFirst && <Crown size={26} className="mb-1 text-amber-300" />}
                  <div className={`relative overflow-hidden rounded-lg border-4 ${tone} bg-white/10 ${isFirst ? "h-20 w-20 sm:h-24 sm:w-24" : "h-16 w-16 sm:h-20 sm:w-20"}`}>
                    {isValidUrl(user.avatar_url) ? (
                      <Image src={user.avatar_url} alt={nameOf(user)} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xl font-black text-white/40">
                        {nameOf(user)[0]}
                      </div>
                    )}
                  </div>
                  <div className={`mt-2 flex w-24 sm:w-32 flex-col items-center justify-start rounded-t-lg border border-b-0 border-white/10 bg-white/5 pt-3 ${height}`}>
                    <span className={`text-2xl font-black ${tone}`}>{user.posicao}o</span>
                    <span className="mt-2 w-full truncate px-2 text-center text-xs font-black text-white">
                      {nameOf(user).split(" ")[0]}
                    </span>
                    <span className="mt-1 text-xs font-black text-white/45">{user.xp_total} XP</span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="mx-auto max-w-3xl rounded-lg border border-white/10 bg-[#050B14] p-3 sm:p-5">
            <div className="mb-3 flex items-center justify-between px-1">
              <h3 className="text-xs font-black text-white/45">Classificacao geral</h3>
              <div className="flex items-center gap-1 text-[11px] font-bold text-white/25">
                <Info size={12} /> fecha domingo
              </div>
            </div>
            <div className="space-y-2">
              {ranking.map(user => {
                const isMe = String(user.user_id) === String(currentUser?.id);
                return (
                  <motion.div
                    key={user.user_id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: user.posicao * 0.03 }}
                    className={`flex items-center justify-between rounded-lg border p-3 sm:p-4 ${
                      isMe
                        ? "border-sky-400/40 bg-sky-400/10"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={`w-8 text-center text-base font-black ${isMe ? "text-sky-300" : "text-white/35"}`}>
                        {user.posicao}o
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
                              voce
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/30">
                          {user.desafios_ok ?? 0} aprovados de {user.desafios_total ?? 0}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-black ${isMe ? "text-sky-200" : "text-white"}`}>
                        {user.xp_total ?? 0}
                      </span>
                      <span className="ml-1 text-xs font-bold text-white/30">XP</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
