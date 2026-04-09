"use client";

import React from "react";
import Image from "next/image";
import { UserPlus, ShieldCheck } from "lucide-react";

interface Suggestion {
  username: string;
  avatar: string | null;
  role: string;
  nivel: number;
}

export const SocialSuggestions = ({ data, onFollow }: { data: Suggestion[], onFollow: (n: string) => void }) => {
  if (data.length === 0) return null;

  return (
    <div className="py-4 px-2 mb-4">
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-3 ml-1">Recrutamento: Sugestões para você</h3>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
        {data.map((atleta) => (
          <div key={atleta.username} className="min-w-[140px] bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center text-center gap-2">
            <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-sky-500/30">
              {atleta.avatar ? (
                <Image src={atleta.avatar} alt={atleta.username} fill className="object-cover" unoptimized />
              ) : (
                <div className="w-full h-full bg-black flex items-center justify-center font-black text-white/20 uppercase">{atleta.username[0]}</div>
              )}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center justify-center gap-1">
                <span className="text-xs font-bold text-white truncate max-w-[80px]">@{atleta.username}</span>
                {atleta.role !== 'aluno' && <ShieldCheck size={10} className="text-sky-500" />}
              </div>
              <span className="text-[8px] font-black uppercase text-sky-500/50">Nível {atleta.nivel}</span>
            </div>
            <button 
              onClick={() => onFollow(atleta.username)}
              className="mt-1 w-full py-1.5 bg-sky-500 text-black rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <UserPlus size={12} />
              <span className="text-[9px] font-black uppercase">Seguir</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};