"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Crown,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquarePlus,
  Settings,
  Shield,
  Target,
  TrendingUp,
  UserRound,
  Users,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface DashboardBottomNavProps {
  currentView: string;
  setCurrentView: (view: any) => void;
  setDeepLink: (link: any) => void;
  onLogout: () => void;
  canBossPanel?: boolean;
}

type BottomMainView = "home" | "comunidades" | "treinos" | "nutricao";
type ExtraView = "social" | "perfil" | "metricas" | "ajuda" | "sugestoes" | "config" | "boss";
type ExtraItem =
  | {
      id: ExtraView;
      label: string;
      icon: React.ElementType;
      action: "view";
    }
  | {
      id: "logout";
      label: string;
      icon: React.ElementType;
      action: "logout";
    };

const mainItems: Array<{ id: BottomMainView; label: string; icon: React.ElementType }> = [
  { id: "home", label: "Início", icon: LayoutDashboard },
  { id: "comunidades", label: "Grupos", icon: Shield },
  { id: "treinos", label: "Treinos", icon: Target },
  { id: "nutricao", label: "Nutrição", icon: UtensilsCrossed },
];

const mainViewSet = new Set<BottomMainView>(["home", "comunidades", "treinos", "nutricao"]);

export const DashboardBottomNav = ({
  currentView,
  setCurrentView,
  setDeepLink,
  onLogout,
  canBossPanel = false,
}: DashboardBottomNavProps) => {
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    setShowMore(false);
  }, [currentView]);

  const extraItems = useMemo<ExtraItem[]>(
    () =>
      [
        { id: "social", label: "Social", icon: Users, action: "view" },
        { id: "perfil", label: "Perfil", icon: UserRound, action: "view" },
        { id: "metricas", label: "Evolução", icon: TrendingUp, action: "view" },
        { id: "ajuda", label: "Ajuda", icon: HelpCircle, action: "view" },
        { id: "sugestoes", label: "Sugestões", icon: MessageSquarePlus, action: "view" },
        { id: "config", label: "Ajustes", icon: Settings, action: "view" },
        ...(canBossPanel ? [{ id: "boss", label: "Boss", icon: Crown, action: "view" } as const] : []),
        { id: "logout", label: "Sair", icon: LogOut, action: "logout" },
      ],
    [canBossPanel],
  );

  const moreActive = showMore || !mainViewSet.has(currentView as BottomMainView);

  const handleMainNav = (view: BottomMainView) => {
    if (view === "home" || view === "comunidades") {
      setDeepLink(null);
    }
    setCurrentView(view);
  };

  const handleExtraNav = (view: ExtraView) => {
    setShowMore(false);
    setCurrentView(view);
  };

  return (
    <>
      <AnimatePresence>
        {showMore && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMore(false)}
              className="fixed inset-0 z-[59] bg-black/55 backdrop-blur-[2px] lg:hidden"
              aria-label="Fechar menu"
            />

            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 18 }}
              transition={{ type: "spring", stiffness: 280, damping: 24 }}
              className="fixed inset-x-3 bottom-[80px] z-[60] rounded-[18px] border border-white/10 bg-[#050B14] p-2.5 shadow-[0_18px_60px_rgba(0,0,0,0.65)] lg:hidden"
            >
              <div className="mb-2.5 flex items-center justify-between gap-3 border-b border-white/10 pb-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/45">
                  Mais funções
                </p>
                <button
                  type="button"
                  onClick={() => setShowMore(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/45 transition hover:text-white"
                  aria-label="Fechar"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {extraItems.map(item => {
                  const Icon = item.icon;
                  const active = item.action === "view" && currentView === item.id;
                  const isDanger = item.action === "logout";
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (item.action === "logout") {
                          setShowMore(false);
                          onLogout();
                          return;
                        }
                        handleExtraNav(item.id);
                      }}
                      className={`flex min-h-12 items-center gap-2 rounded-lg border px-3 text-left transition-all ${
                        active
                          ? "border-sky-500/35 bg-sky-500/15 text-sky-200"
                          : isDanger
                            ? "border-rose-400/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/15"
                            : "border-white/10 bg-white/5 text-white/65 hover:bg-white/10"
                      }`}
                    >
                      <Icon size={15} />
                      <span className="truncate text-[10px] font-black uppercase tracking-widest">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.section>
          </>
        )}
      </AnimatePresence>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/75 px-2 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur-2xl lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-0.5">
          {mainItems.map(item => {
            const Icon = item.icon;
            const active = currentView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleMainNav(item.id)}
                className={`flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-lg border transition-all active:scale-[0.98] ${
                  active
                    ? "border-sky-500/35 bg-sky-500/14 text-sky-300"
                    : "border-transparent bg-transparent text-white/35 hover:text-white/70"
                }`}
              >
                <Icon size={20} strokeWidth={2.4} />
                <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setShowMore(prev => !prev)}
            className={`flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-lg border transition-all active:scale-[0.98] ${
              moreActive
                ? "border-sky-500/35 bg-sky-500/14 text-sky-300"
                : "border-transparent bg-transparent text-white/35 hover:text-white/70"
            }`}
            aria-label="Abrir mais funções"
          >
            <Menu size={20} strokeWidth={2.4} />
            <span className="text-[8px] font-black uppercase tracking-widest">Mais</span>
          </button>
        </div>
      </nav>
    </>
  );
};
