"use client";

import React from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Crown } from "lucide-react";
import Image from "next/image";

interface CommunityRankingProps {
  currentUser: any;
}

export function CommunityRanking({ currentUser }: CommunityRankingProps) {
  // Mock do Ranking (Backend vai ordenar por XP)
  const ranking = [
    { posicao: 1, nome: "Lucas Silva", xp: 1250, avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100", isMe: false },
    { posicao: 2, nome: "Ana Paula", xp: 1100, avatar: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=100", isMe: false },
    { posicao: 3, nome: "Marcos V.", xp: 950, avatar: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100", isMe: false },
    { posicao: 4, nome: currentUser.nickname, xp: 820, avatar: currentUser.avatar, isMe: true }, // Simulando o usuário logado
    { posicao: 5, nome: "Juliana F.", xp: 700, avatar: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=100", isMe: false },
  ];

  const top3 = ranking.slice(0, 3);
  const outros = ranking.slice(3);

  return (
    <div className="space-y-10 text-left">
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest italic mb-4 border border-amber-500/20">
          <Trophy size={14} fill="currentColor" /> Ranking Semanal
        </div>
        <h2 className="text-3xl sm:text-5xl font-black italic uppercase tracking-tighter text-white">
          A Elite da <span className="text-sky-500">Semana</span>
        </h2>
        <p className="text-xs text-white/40 font-medium mt-3">O ranking reseta todo domingo às 23:59. Os melhores recebem selos permanentes de glória.</p>
      </div>

      {/* PÓDIO TOP 3 */}
      <div className="flex justify-center items-end gap-2 sm:gap-6 pt-10">
        {/* Segundo Lugar (Esquerda) */}
        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="flex flex-col items-center">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-4 border-gray-400 overflow-hidden z-10 shadow-[0_0_20px_rgba(156,163,175,0.4)]">
            <Image src={top3[1].avatar} alt="" fill className="object-cover" unoptimized />
          </div>
          <div className="w-20 sm:w-28 h-24 sm:h-32 bg-linear-to-t from-gray-400/10 to-gray-400/30 rounded-t-2xl border border-b-0 border-gray-400/30 mt-2 flex flex-col items-center justify-start pt-4 backdrop-blur-md">
            <span className="text-2xl font-black text-gray-300">2º</span>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1 text-center truncate w-full px-1">{top3[1].nome}</span>
            <span className="text-[10px] font-black text-white mt-1">{top3[1].xp} XP</span>
          </div>
        </motion.div>

        {/* Primeiro Lugar (Centro) */}
        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col items-center relative z-20">
          <Crown size={32} className="text-amber-400 absolute -top-10 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
          <div className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-2xl border-4 border-amber-400 overflow-hidden z-10 shadow-[0_0_30px_rgba(251,191,36,0.6)]">
            <Image src={top3[0].avatar} alt="" fill className="object-cover" unoptimized />
          </div>
          <div className="w-24 sm:w-32 h-32 sm:h-40 bg-linear-to-t from-amber-400/10 to-amber-400/30 rounded-t-2xl border border-b-0 border-amber-400/30 mt-2 flex flex-col items-center justify-start pt-4 backdrop-blur-md">
            <span className="text-3xl font-black text-amber-400">1º</span>
            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest mt-1 text-center truncate w-full px-1">{top3[0].nome}</span>
            <span className="text-xs font-black text-white mt-1">{top3[0].xp} XP</span>
          </div>
        </motion.div>

        {/* Terceiro Lugar (Direita) */}
        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="flex flex-col items-center">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-4 border-orange-700 overflow-hidden z-10 shadow-[0_0_20px_rgba(194,65,12,0.4)]">
            <Image src={top3[2].avatar} alt="" fill className="object-cover" unoptimized />
          </div>
          <div className="w-20 sm:w-28 h-20 sm:h-24 bg-linear-to-t from-orange-700/10 to-orange-700/30 rounded-t-2xl border border-b-0 border-orange-700/30 mt-2 flex flex-col items-center justify-start pt-4 backdrop-blur-md">
            <span className="text-2xl font-black text-orange-500">3º</span>
            <span className="text-[9px] font-bold text-orange-400 uppercase tracking-widest mt-1 text-center truncate w-full px-1">{top3[2].nome}</span>
            <span className="text-[10px] font-black text-white mt-1">{top3[2].xp} XP</span>
          </div>
        </motion.div>
      </div>

      {/* LISTA GERAL */}
      <div className="max-w-3xl mx-auto bg-[#050B14] border border-white/5 rounded-4xl p-4 sm:p-8 shadow-2xl">
        <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-6 px-2">Restante da Tropa</h3>
        <div className="space-y-3">
          {outros.map((user) => (
            <div 
              key={user.posicao} 
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                user.isMe ? 'bg-sky-500/10 border-sky-500/30 shadow-neon-soft' : 'bg-white/5 border-white/5'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className={`text-lg font-black italic w-6 text-center ${user.isMe ? 'text-sky-500' : 'text-white/40'}`}>
                  {user.posicao}º
                </span>
                <div className="relative w-10 h-10 rounded-xl overflow-hidden ring-1 ring-white/10">
                  <Image src={user.avatar} alt={user.nome} fill className="object-cover" unoptimized />
                </div>
                <div>
                  <h4 className={`text-sm font-black uppercase italic ${user.isMe ? 'text-sky-400' : 'text-white'}`}>
                    {user.nome} {user.isMe && <span className="text-[8px] ml-2 px-2 py-0.5 bg-sky-500 text-black rounded-md not-italic">VOCÊ</span>}
                  </h4>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-sm font-black ${user.isMe ? 'text-sky-400' : 'text-white'}`}>{user.xp} <span className="text-[10px] text-white/40">XP</span></span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}