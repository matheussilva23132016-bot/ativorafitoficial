"use client";

import React from "react";
import { Trophy, Medal, Flame, Star } from "lucide-react";
import Image from "next/image";

interface LeaderboardUser {
  username: string;
  avatar_url: string | null;
  role: string;
  nivel: number;
  xp: number;
}

export const SocialLeaderboard = ({ data }: { data: LeaderboardUser[] }) => {
  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Trophy className="text-amber-400" size={20} />;
      case 1: return <Medal className="text-slate-300" size={20} />;
      case 2: return <Medal className="text-orange-500" size={20} />;
      default: return <span className="text-white/20 font-black italic">{index + 1}</span>;
    }
  };

  return (
    <div className="w-full space-y-4 px-2">
      <div className="flex items-center gap-3 mb-6">
        <Flame className="text-sky-500 fill-sky-500 animate-pulse" size={24} />
        <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">Matriz de Performance</h3>
      </div>

      <div className="space-y-2">
        {data.map((user, index) => (
          <div 
            key={user.username} 
            className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
              index === 0 ? 'bg-sky-500/10 border-sky-500/30' : 'bg-white/5 border-white/5'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-6 text-center">{getRankIcon(index)}</div>
              
              <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-white/10 bg-black">
                {user.avatar_url ? (
                  <Image src={user.avatar_url} alt={user.username} fill className="object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-white/20 uppercase">{user.username[0]}</div>
                )}
              </div>

              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">@{user.username}</span>
                  {user.role !== 'aluno' && <Star size={10} className="text-sky-500 fill-sky-500" />}
                </div>
                <span className="text-[8px] font-black uppercase text-white/30 tracking-widest">Nível {user.nivel}</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-sm font-black text-sky-500 italic">{user.xp.toLocaleString()}</span>
              <span className="block text-[7px] font-bold text-white/20 uppercase tracking-tighter">XP TOTAL</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
