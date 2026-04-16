"use client";

import React from "react";
import { Users, ArrowRight } from "lucide-react";
import Image from "next/image";

interface HubComunidadesCardProps {
  onClick: () => void;
}

export function HubComunidadesCard({ onClick }: HubComunidadesCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-[28px] border border-white/10 text-left shadow-2xl"
    >
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200"
          alt="Ativora Comunidades"
          fill
          className="object-cover grayscale brightness-50 transition-all duration-1000 group-hover:scale-105 group-hover:brightness-75"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t xl:bg-gradient-to-r from-black via-black/65 to-transparent z-10" />
      </div>

      <div className="relative z-20 flex h-full flex-col justify-between p-7 lg:p-10">
        <div className="space-y-3 text-left">
          <div className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-black">
            <Users size={12} fill="currentColor" />
            Grupos fechados
          </div>
          <h2 className="text-3xl lg:text-4xl xl:text-5xl font-black uppercase italic tracking-tighter leading-none text-white">
            Ativora{" "}
            <span className="block text-sky-500">Comunidades</span>
          </h2>
          <p className="max-w-md text-sm font-bold leading-snug text-white/65">
            Treinos, nutrição, desafios e ranking semanal com acompanhamento dentro da comunidade.
          </p>
          <p className="max-w-md text-sm leading-relaxed text-white/50">
            Solicite entrada em grupos fechados, acompanhe seu cronograma, receba cardápios, envie desafios e dispute posições no ranking da semana.
          </p>
          <div className="flex flex-wrap gap-2">
            {["Solicitação", "Treinos", "Nutrição", "Ranking"].map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-white/55"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <span className="mt-auto inline-flex w-fit items-center gap-2 rounded-lg bg-sky-500 px-6 py-4 text-[11px] font-black uppercase tracking-widest text-black shadow-xl shadow-sky-500/20 transition-all group-hover:scale-105 group-active:scale-95">
          Abrir comunidades <ArrowRight size={14} />
        </span>
      </div>
    </button>
  );
}
