"use client";

import React from "react";
import { Users, ArrowRight } from "lucide-react";
import Image from "next/image";

interface HubComunidadesCardProps {
  onClick: () => void;
}

export function HubComunidadesCard({ onClick }: HubComunidadesCardProps) {
  return (
    <div
      onClick={onClick}
      className="group relative rounded-[32px] overflow-hidden border border-white/10 shadow-2xl flex flex-col h-full min-h-[350px] xl:min-h-0 cursor-pointer"
    >
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200"
          alt="Ativora Comunidades"
          fill
          className="object-cover grayscale brightness-50 group-hover:scale-105 group-hover:brightness-75 transition-all duration-1000"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t xl:bg-gradient-to-r from-black via-black/60 to-transparent z-10" />
      </div>

      {/* Conteúdo */}
      <div className="relative z-20 p-8 lg:p-12 flex flex-col justify-between h-full">
        <div className="space-y-4 text-left">
          <div className="inline-flex items-center gap-2 bg-sky-500 text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest italic">
            <Users size={12} fill="currentColor" /> Grupos de Performance
          </div>
          <h2 className="text-4xl lg:text-6xl font-black uppercase italic tracking-tighter leading-none text-white">
            Ativora{" "}
            <span className="text-sky-500 block xl:inline">Comunidades</span>
          </h2>
          <p className="text-white/70 font-bold text-sm lg:text-base italic leading-snug max-w-sm">
            Treine em equipe. Acesse protocolos de hipertrofia, dietas avançadas
            e desafios diários para colocar seu shape em outro nível.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 pt-6 mt-auto">
          <button className="flex items-center gap-2 px-8 py-4 bg-sky-500 text-black font-black uppercase italic tracking-widest text-[11px] rounded-2xl shadow-xl shadow-sky-500/20 active:scale-95 transition-all hover:scale-105">
            Acessar Grupos <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
