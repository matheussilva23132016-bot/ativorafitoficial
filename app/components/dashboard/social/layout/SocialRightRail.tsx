"use client";

import React from "react";
import { ChevronRight, Target, TrendingUp, Users, Zap } from "lucide-react";

interface SocialRightRailProps {
  trendingTags: any[];
  suggestedUsers: any[];
  challenges: any[];
  onOpenUserProfile?: (username: string) => void;
}

const WidgetWrapper = ({ title, icon: Icon, children, onSeeAll }: any) => (
  <section className="mb-5 rounded-lg border border-white/[0.06] bg-[#05080d]/75 p-5 shadow-2xl backdrop-blur-xl transition-all hover:border-white/10 hover:bg-[#07101a]">
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/10">
          <Icon size={17} className="text-sky-400/80" />
        </div>
        <h3 className="truncate text-[11px] font-bold uppercase tracking-[0.18em] text-white/[0.35]">{title}</h3>
      </div>
      {onSeeAll && (
        <button className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-sky-500/[0.45] transition-all hover:text-sky-500">
          Ver tudo
        </button>
      )}
    </div>
    <div className="space-y-1">{children}</div>
  </section>
);

export const SocialRightRail = ({ trendingTags, suggestedUsers, challenges, onOpenUserProfile }: SocialRightRailProps) => {
  if (!trendingTags.length && !suggestedUsers.length && !challenges.length) {
    return null;
  }

  return (
    <aside className="sticky top-0 h-dvh w-full overflow-y-auto py-8 pr-2">
      {trendingTags.length > 0 && (
        <WidgetWrapper title="Assuntos em Alta" icon={TrendingUp}>
          {trendingTags.slice(0, 5).map((t: any) => (
            <button
              key={t.tag}
              className="group flex w-full items-center justify-between gap-3 rounded-lg border border-transparent p-3 text-left transition-all hover:border-white/[0.06] hover:bg-white/[0.04] active:scale-95"
            >
              <div className="min-w-0">
                <p className="truncate text-[14px] font-bold tracking-tight text-white/90 transition-colors group-hover:text-sky-400">
                  #{t.tag}
                </p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/25">
                  {t.posts} relatos
                </p>
              </div>
              <Zap size={14} className="shrink-0 text-white/15 transition-colors group-hover:text-sky-500" />
            </button>
          ))}
        </WidgetWrapper>
      )}

      {suggestedUsers.length > 0 && (
        <WidgetWrapper title="Sugestões" icon={Users}>
          {suggestedUsers.slice(0, 3).map((u: any) => (
            <button
              key={u.username}
              onClick={() => onOpenUserProfile?.(u.username)}
              className="group flex w-full items-center gap-3 rounded-lg border border-transparent p-3 text-left transition-all hover:border-white/[0.06] hover:bg-white/[0.04] active:scale-95"
            >
              <div className="h-11 w-11 shrink-0 rounded-lg bg-gradient-to-br from-white/10 to-transparent p-[1px] shadow-lg transition-shadow group-hover:shadow-sky-500/10">
                <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[7px] bg-[#0c121d]">
                  {u.avatar ? (
                    <img src={u.avatar} className="h-full w-full object-cover" alt="" />
                  ) : (
                    <span className="text-xs font-bold text-sky-500/25">@</span>
                  )}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold tracking-tight text-white">@{u.username}</p>
                {(u.full_name || u.role || typeof u.xp === "number") && (
                  <p className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-widest text-white/25">
                    {u.full_name || u.role || `${u.xp} XP`}
                  </p>
                )}
              </div>
              <div className="flex h-8 w-8 scale-90 items-center justify-center rounded-lg bg-sky-500/10 opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100">
                <ChevronRight size={14} className="text-sky-400" />
              </div>
            </button>
          ))}
        </WidgetWrapper>
      )}

      {challenges.length > 0 && (
        <WidgetWrapper title="Desafios Elite" icon={Target}>
          {challenges.slice(0, 2).map((c: any, i: number) => (
            <div
              key={i}
              className="group mb-3 cursor-pointer overflow-hidden rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 shadow-2xl transition-all hover:bg-white/[0.04]"
            >
              <p className="mb-4 text-[14px] font-bold leading-snug tracking-tight text-white">{c.name}</p>
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="h-2 w-2 shrink-0 rounded-full bg-sky-500 shadow-[0_0_15px_rgba(56,189,248,1)]" />
                  <span className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-white/25">
                    {c.participants} ativos
                  </span>
                </div>
                <span className="flex shrink-0 items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-sky-500 transition-all group-hover:gap-2">
                  Entrar <ChevronRight size={13} />
                </span>
              </div>
            </div>
          ))}
        </WidgetWrapper>
      )}
    </aside>
  );
};
