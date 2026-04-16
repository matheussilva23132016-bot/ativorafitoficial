"use client";

import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Crown,
  HelpCircle,
  LayoutDashboard,
  MessageSquarePlus,
  MoreHorizontal,
  Shield,
  Target,
  UserRound,
  UtensilsCrossed,
  Zap,
} from "lucide-react";
import { MobileNavItem } from "../../ui/MobileNavItem";

interface DashboardBottomNavProps {
  currentView: string;
  setCurrentView: (view: any) => void;
  setDeepLink: (link: any) => void;
  canBossPanel?: boolean;
}

type ExtraItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
};

export const DashboardBottomNav = ({
  currentView,
  setCurrentView,
  setDeepLink,
  canBossPanel = false,
}: DashboardBottomNavProps) => {
  const [showMore, setShowMore] = useState(false);

  const moreActive = useMemo(
    () => ["perfil", "nutricao", "metricas", "ajuda", "sugestoes", "boss"].includes(currentView),
    [currentView],
  );

  const extraItems = useMemo<ExtraItem[]>(() => {
    const items: ExtraItem[] = [
      {
        id: "perfil",
        label: "Meu Perfil",
        icon: <UserRound size={18} strokeWidth={2.3} />,
        onClick: () => setCurrentView("perfil"),
      },
      {
        id: "nutricao",
        label: "Nutrição",
        icon: <UtensilsCrossed size={18} strokeWidth={2.3} />,
        onClick: () => setCurrentView("nutricao"),
      },
      {
        id: "metricas",
        label: "Evolução",
        icon: <Activity size={18} strokeWidth={2.3} />,
        onClick: () => setCurrentView("metricas"),
      },
      {
        id: "ajuda",
        label: "Ajuda",
        icon: <HelpCircle size={18} strokeWidth={2.3} />,
        onClick: () => setCurrentView("ajuda"),
      },
      {
        id: "sugestoes",
        label: "Sugestões",
        icon: <MessageSquarePlus size={18} strokeWidth={2.3} />,
        onClick: () => setCurrentView("sugestoes"),
      },
    ];

    if (canBossPanel) {
      items.push({
        id: "boss",
        label: "Boss",
        icon: <Crown size={18} strokeWidth={2.3} />,
        onClick: () => setCurrentView("boss"),
      });
    }

    return items;
  }, [canBossPanel, setCurrentView]);

  const handleExtraClick = (onClick: () => void) => {
    onClick();
    setShowMore(false);
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 z-50 w-full border-t border-white/5 bg-black/80 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-3xl lg:hidden">
        <div className="mx-auto flex h-[74px] max-w-xl items-center justify-between gap-1">
          <MobileNavItem
            icon={<LayoutDashboard size={19} strokeWidth={2.4} />}
            label="Início"
            active={currentView === "home"}
            onClick={() => {
              setCurrentView("home");
              setDeepLink(null);
              setShowMore(false);
            }}
          />

          <MobileNavItem
            icon={<Target size={19} strokeWidth={2.4} />}
            label="Treinos"
            active={currentView === "treinos"}
            onClick={() => {
              setCurrentView("treinos");
              setShowMore(false);
            }}
          />

          <MobileNavItem
            icon={<Shield size={19} strokeWidth={2.4} />}
            label="Comunid."
            active={currentView === "comunidades"}
            onClick={() => {
              setCurrentView("comunidades");
              setDeepLink(null);
              setShowMore(false);
            }}
          />

          <MobileNavItem
            icon={<Zap size={20} strokeWidth={2.6} />}
            label="Social"
            active={currentView === "social"}
            onClick={() => {
              setCurrentView("social");
              setShowMore(false);
            }}
          />

          <MobileNavItem
            icon={<MoreHorizontal size={19} strokeWidth={2.4} />}
            label="Mais"
            active={moreActive || showMore}
            onClick={() => setShowMore(value => !value)}
          />
        </div>
      </nav>

      <AnimatePresence>
        {showMore && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMore(false)}
              className="fixed inset-0 z-40 bg-black/55 lg:hidden"
              aria-label="Fechar menu"
            />

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              className="fixed bottom-[82px] left-3 right-3 z-50 rounded-2xl border border-white/10 bg-[#06101D] p-3 shadow-2xl lg:hidden"
            >
              <div className="mb-2 flex items-center justify-between gap-3 px-1">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-sky-300">
                    Mais áreas
                  </p>
                  <h3 className="mt-1 text-sm font-black text-white">
                    Acessos secundários
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMore(false)}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white/60"
                >
                  Fechar
                </button>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {extraItems.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleExtraClick(item.onClick)}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-left transition hover:border-white/20 hover:bg-black/30"
                  >
                    <div className="rounded-lg border border-white/10 bg-white/5 p-2.5 text-sky-300">
                      {item.icon}
                    </div>
                    <span className="text-sm font-black text-white">{item.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
