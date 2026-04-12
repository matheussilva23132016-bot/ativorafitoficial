"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy, Crown, Info } from "lucide-react";
import Image from "next/image";

interface RankingUser {
  posicao:    number;
  nome:       string;
  xp:         number;
  avatar:     string | null;
  isMe:       boolean;
  desafios?:  number;
}

interface CommunityRankingProps {
  currentUser: any;
}

const isValidUrl = (url: unknown): url is string =>
  typeof url === "string" && url.length > 4 && url.startsWith("http");

export function CommunityRanking({ currentUser }: CommunityRankingProps) {
  const ranking: RankingUser[] = useMemo(() => [
    { posicao: 1, nome: "Lucas Silva",                   xp: 1250, avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100", isMe: false, desafios: 8 },
    { posicao: 2, nome: "Ana Paula",                     xp: 1100, avatar: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=100", isMe: false, desafios: 7 },
    { posicao: 3, nome: "Marcos V.",                     xp: 950,  avatar: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100", isMe: false, desafios: 6 },
    { posicao: 4, nome: currentUser?.nickname ?? "Você", xp: 820,  avatar: currentUser?.avatar ?? null, isMe: true,  desafios: 5 },
    { posicao: 5, nome: "Juliana F.",                    xp: 700,  avatar: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=100", isMe: false, desafios: 4 },
  ], [currentUser]);

  const top3  = ranking.slice(0, 3);
  const outros = ranking.slice(3);

  const podiumOrder = [top3[1], top3[0], top3[2]];
  const podiumStyles = [
    { border: "border-gray-400",  glow: "shadow-[0_0_20px_rgba(156,163,175,0.4)]", height: "h-24 sm:h-32", textColor: "text-gray-300",  pos: "2º", size: "w-14 h-14 sm:w-18 sm:h-18" },
    { border: "border-amber-400", glow: "shadow-[0_0_30px_rgba(251,191,36,0.6)]",  height: "h-32 sm:h-40", textColor: "text-amber-400", pos: "1º", size: "w-18 h-18 sm:w-24 sm:h-24" },
    { border: "border-orange-700",glow: "shadow-[0_0_20px_rgba(194,65,12,0.4)]",   height: "h-20 sm:h-24", textColor: "text-orange-500",pos: "3º", size: "w-14 h-14 sm:w-18 sm:h-18" },
  ];

  return (
    <div className="space-y-10 text-left">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest italic mb-4 border border-amber-500/20">
          <Trophy size={13} fill="currentColor" /> Ranking Semanal
        </div>
        <h2 className="text-3xl sm:text-5xl font-black italic uppercase tracking-tighter text-white">
          A Elite da <span className="text-sky-500">Semana</span>
        </h2>
        <p className="text-xs text-white/30 font-medium mt-3 leading-relaxed">
          O ranking reseta todo domingo às 23:59. Os melhores recebem selos permanentes de glória.
        </p>
      </div>

      {/* Pódio */}
      <div className="flex justify-center items-end gap-3 sm:gap-6 pt-10">
        {podiumOrder.map((user, idx) => {
          if (!user) return null;
          const style = podiumStyles[idx];
          return (
            <motion.div
              key={user.posicao}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: idx * 0.15 }}
              className="flex flex-col items-center"
            >
              {user.posicao === 1 && (
                <Crown
                  size={28}
                  className="text-amber-400 mb-1 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]"
                />
              )}
              <div
                className={`relative rounded-2xl border-4 ${style.border} ${style.glow} overflow-hidden shrink-0`}
                style={{ width: user.posicao === 1 ? 80 : 60, height: user.posicao === 1 ? 80 : 60 }}
              >
                {isValidUrl(user.avatar) ? (
                  <Image src={user.avatar} alt={user.nome} fill className="object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full bg-white/5 flex items-center justify-center">
                    <span className="font-black text-white/40 text-lg">{user.nome[0]}</span>
                  </div>
                )}
              </div>
              <div
                className={`w-20 sm:w-28 ${style.height} bg-gradient-to-t from-white/5 to-white/10 rounded-t-2xl border border-b-0 border-white/10 mt-2 flex flex-col items-center justify-start pt-3 backdrop-blur-md`}
              >
                <span className={`text-xl sm:text-2xl font-black ${style.textColor}`}>
                  {style.pos}
                </span>
                <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest mt-1 text-center truncate w-full px-1">
                  {user.nome.split(" ")[0]}
                </span>
                <span className="text-[10px] font-black text-white mt-1">{user.xp} XP</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Lista */}
      <div className="max-w-3xl mx-auto bg-[#050B14] border border-white/5 rounded-[28px] p-4 sm:p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-5 px-2">
          <h3 className="text-[10px] font-black text-white/30 uppercase tracking-widest">
            Classificação Geral
          </h3>
          <div className="flex items-center gap-1 text-white/15 text-[9px] font-bold">
            <Info size={11} /> Reseta domingo
          </div>
        </div>
        <div className="space-y-2.5">
          {ranking.map(user => (
            <motion.div
              key={user.posicao}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: user.posicao * 0.05 }}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all
                ${user.isMe
                  ? "bg-sky-500/10 border-sky-500/30"
                  : "bg-white/5 border-white/5 hover:border-white/10"}`}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <span className={`text-base font-black italic w-6 text-center tabular-nums
                  ${user.posicao === 1 ? "text-amber-400" :
                    user.posicao === 2 ? "text-gray-400"  :
                    user.posicao === 3 ? "text-orange-600":
                    user.isMe          ? "text-sky-500"   : "text-white/25"}`}>
                  {user.posicao}º
                </span>
                <div className="relative w-9 h-9 rounded-xl overflow-hidden ring-1 ring-white/10 shrink-0">
                  {isValidUrl(user.avatar) ? (
                    <Image src={user.avatar} alt={user.nome} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center">
                      <span className="text-xs font-black text-white/30">{user.nome[0]}</span>
                    </div>
                  )}
                </div>
                <div>
                  <h4 className={`text-sm font-black uppercase italic leading-none
                    ${user.isMe ? "text-sky-400" : "text-white"}`}>
                    {user.nome}
                    {user.isMe && (
                      <span className="text-[7px] ml-2 px-1.5 py-0.5 bg-sky-500 text-black rounded not-italic normal-case font-black">
                        VOCÊ
                      </span>
                    )}
                  </h4>
                  {user.desafios != null && (
                    <span className="text-[9px] text-white/20 font-bold">
                      {user.desafios} desafios
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className={`text-sm font-black ${user.isMe ? "text-sky-400" : "text-white"}`}>
                  {user.xp}
                </span>
                <span className="text-[9px] text-white/25 font-bold ml-1">XP</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
