"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Users, ShieldCheck, ChevronRight, Globe, Lock } from "lucide-react";
import Image from "next/image";
import {
  DEFAULT_COMMUNITY_COVER,
  resolveCommunityCover,
  type CommunityCoverSpec,
} from "./cover-utils";

interface Community {
  id:             string;
  name:           string;
  description?:   string;
  cover_url?:     string | null;
  total_membros?: number;
  role?:          string;
  privacidade?:   "public" | "private";
  isMember?:      boolean;
  request_status?: "pendente" | "aprovado" | "recusado" | null;
}

interface CommunityCardProps {
  com:     Community;
  onClick: () => void;
  actionLoading?: boolean;
}

export function CommunityCard({ com, onClick, actionLoading = false }: CommunityCardProps) {
  const safeInitialCover = useMemo(() => resolveCommunityCover(com.cover_url), [com.cover_url]);
  const [cover, setCover] = useState<CommunityCoverSpec>(safeInitialCover);
  const isPrivate = com.privacidade === "private";
  const isMember = com.isMember === true;
  const hasPendingRequest = com.request_status === "pendente";
  const ctaText = isMember
    ? "Abrir grupo"
    : isPrivate
      ? hasPendingRequest
        ? "Solicitado"
        : "Pedir para entrar"
      : "Entrar no grupo";
  const ctaHint = isMember
    ? "Acessar agora"
    : isPrivate
      ? hasPendingRequest
        ? "Aguardando aprovação"
        : "Solicitar aprovação"
      : "Entrada imediata";
  const disableAction = actionLoading || (isPrivate && hasPendingRequest);

  useEffect(() => {
    setCover(safeInitialCover);
  }, [safeInitialCover]);

  return (
    <div
      onClick={onClick}
      className="group relative w-full bg-[#050B14] ring-1 ring-white/5 rounded-[32px] overflow-hidden hover:ring-sky-500/40 transition-all duration-500 cursor-pointer shadow-2xl text-left"
    >
      <div className="relative h-52 w-full overflow-hidden sm:h-60">
        <Image
          src={cover.src}
          alt={com.name ?? "Capa da comunidade"}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-40"
          style={{ objectPosition: `${cover.positionX}% ${cover.positionY}%` }}
          onError={() => setCover(resolveCommunityCover(DEFAULT_COMMUNITY_COVER))}
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050B14] to-transparent" />
        <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[8px] font-black uppercase tracking-widest text-white/75">
          {isPrivate ? <Lock size={10} /> : <Globe size={10} />}
          {isPrivate ? "Privado" : "Público"}
        </div>
      </div>

      <div className="p-6 pt-2">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-lg font-black italic uppercase tracking-tighter text-white leading-tight">
            {com.name}
          </h3>
          <ShieldCheck size={14} className="text-sky-500/50 shrink-0" />
        </div>
        <p className="text-xs text-white/40 line-clamp-2 mb-6 font-medium leading-relaxed">
          {com.description}
        </p>
        <div className="flex items-end justify-between gap-3 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2 text-white/20">
            <Users size={14} />
            <span className="text-[10px] font-bold font-mono">
              {com.total_membros ?? 0} membros
            </span>
          </div>
          <div className="min-w-0 text-right">
            <p className="text-[8px] font-black uppercase tracking-widest text-white/30">{ctaHint}</p>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                if (!disableAction) onClick();
              }}
              disabled={disableAction}
              className={`mt-1 inline-flex min-h-9 items-center gap-1 rounded-lg border px-3 text-[9px] font-black uppercase tracking-widest transition ${
                disableAction
                  ? "cursor-not-allowed border-white/10 bg-white/5 text-white/25"
                  : "border-sky-500/25 bg-sky-500/12 text-sky-300 hover:border-sky-500/40 hover:bg-sky-500/20"
              }`}
            >
              {ctaText}
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
