"use client";

import React from "react";
import { Users, Lock, ChevronRight, ShieldCheck } from "lucide-react";
import Image from "next/image";

export function CommunityCard({ com, onClick }: any) {
  return (
    <div onClick={onClick} className="group relative w-full bg-[#050B14] ring-1 ring-white/5 rounded-[32px] overflow-hidden hover:ring-sky-500/40 transition-all duration-500 cursor-pointer shadow-2xl text-left">
      <div className="relative h-32 w-full overflow-hidden">
        <Image src={com.cover_url || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000"} alt="" fill className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-40" unoptimized />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050B14] to-transparent" />
      </div>
      <div className="p-6 pt-2">
        <div className="flex items-center gap-2 mb-2"><h3 className="text-lg font-black italic uppercase tracking-tighter text-white">{com.name}</h3><ShieldCheck size={14} className="text-sky-500/50" /></div>
        <p className="text-xs text-white/40 line-clamp-2 mb-6 font-medium">{com.description}</p>
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex items-center gap-2 text-white/20"><Users size={14} /><span className="text-[10px] font-bold font-mono">Membro Elite</span></div>
          <div className="flex items-center gap-1 text-sky-500 text-[10px] font-black uppercase tracking-widest">Sincronizar Hub <ChevronRight size={14} /></div>
        </div>
      </div>
    </div>
  );
}