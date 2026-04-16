"use client";

import React from "react";
import {
  Crown, LayoutDashboard, Shield, Target, UserRound, UtensilsCrossed, Zap
} from "lucide-react";
import { motion } from "framer-motion";
import { MobileNavItem } from "../../ui/MobileNavItem";

interface DashboardBottomNavProps {
  currentView: string;
  setCurrentView: (view: any) => void;
  setDeepLink: (link: any) => void;
  canBossPanel?: boolean;
}

export const DashboardBottomNav = ({
  currentView,
  setCurrentView,
  setDeepLink,
  canBossPanel = false,
}: DashboardBottomNavProps) => {
  const socialActive = currentView === "social";

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 w-full min-h-[84px] bg-black/70 backdrop-blur-3xl border-t-[0.5px] border-white/5 px-2.5 flex items-center justify-start gap-1 overflow-x-auto z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] pb-[env(safe-area-inset-bottom)]">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-500/15 to-transparent" />

      <MobileNavItem
        icon={<LayoutDashboard size={20} strokeWidth={2.5} />}
        label="Início"
        active={currentView === "home"}
        onClick={() => { setCurrentView("home"); setDeepLink(null); }}
      />

      <div className="relative flex min-w-[58px] flex-col items-center justify-center gap-1">
        <div className={`absolute inset-0 bg-sky-500/20 blur-2xl rounded-full transition-opacity duration-500 ${socialActive ? "opacity-100" : "opacity-0"}`} />
        <motion.button
          type="button"
          onClick={() => setCurrentView("social")}
          whileTap={{ scale: 0.9 }}
          aria-label="Abrir Ativora Social"
          className={`relative flex h-12 w-12 items-center justify-center rounded-lg border transition-all duration-300 ${
            socialActive
              ? "bg-sky-500 border-sky-400 text-black shadow-[0_0_20px_rgba(0,229,255,0.4)]"
              : "bg-[#050B14] border-white/10 text-white/30 hover:border-sky-500/40"
          }`}
        >
          <Zap size={23} fill={socialActive ? "currentColor" : "none"} strokeWidth={3} />
        </motion.button>
        <span className={`max-w-[58px] text-center text-[8px] font-black uppercase leading-none tracking-wide transition-colors ${socialActive ? "text-sky-400 opacity-100" : "text-white/20 opacity-50"}`}>
          Social
        </span>
      </div>

      <MobileNavItem
        icon={<Shield size={20} strokeWidth={2.5} />}
        label="Comun."
        active={currentView === "comunidades"}
        onClick={() => { setCurrentView("comunidades"); setDeepLink(null); }}
      />

      <MobileNavItem
        icon={<Target size={20} strokeWidth={2.5} />}
        label="Treinos"
        active={currentView === "treinos"}
        onClick={() => setCurrentView("treinos")}
      />

      <MobileNavItem
        icon={<UtensilsCrossed size={20} strokeWidth={2.5} />}
        label="Nutri"
        active={currentView === "nutricao"}
        onClick={() => setCurrentView("nutricao")}
      />

      <MobileNavItem
        icon={<UserRound size={20} strokeWidth={2.5} />}
        label="Perfil"
        active={currentView === "perfil"}
        onClick={() => setCurrentView("perfil")}
      />

      {canBossPanel && (
        <MobileNavItem
          icon={<Crown size={20} strokeWidth={2.5} />}
          label="Boss"
          active={currentView === "boss"}
          onClick={() => setCurrentView("boss")}
        />
      )}
    </nav>
  );
};
