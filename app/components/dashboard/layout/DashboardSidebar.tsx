"use client";

import React from "react";
import {
  Crown,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  MessageSquarePlus,
  Settings,
  Shield,
  Target,
  TrendingUp,
  UserRound,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { SidebarItem } from "../../ui/SidebarItem";

interface DashboardSidebarProps {
  currentView: string;
  setCurrentView: (view: any) => void;
  onLogout: () => void;
  setDeepLink: (link: any) => void;
  canBossPanel?: boolean;
}

export const DashboardSidebar = ({
  currentView,
  setCurrentView,
  onLogout,
  setDeepLink,
  canBossPanel = false,
}: DashboardSidebarProps) => {
  return (
    <aside className="hidden lg:flex w-24 xl:w-80 border-r border-white/5 bg-[#030508] flex-col p-8 z-50 shadow-2xl text-left">
      <div className="mb-16 xl:px-4 cursor-pointer" onClick={() => setCurrentView("home")}>
        <span className="font-black italic text-3xl tracking-tighter block leading-none text-white">
          Ativora<span className="text-sky-500 shadow-neon">Fit</span>
        </span>
        <span className="text-[8px] font-black text-white/20 uppercase tracking-widest mt-2.5 block italic leading-tight">
          Evolução no ritmo da sua rotina
        </span>
      </div>

      <nav className="flex-1 space-y-3.5 text-left">
        <SidebarItem
          icon={<LayoutDashboard size={20} />}
          label="Painel"
          code="01"
          active={currentView === "home"}
          onClick={() => { setCurrentView("home"); setDeepLink(null); }}
        />
        <SidebarItem
          icon={<Users size={20} />}
          label="Social"
          code="02"
          active={currentView === "social"}
          onClick={() => setCurrentView("social")}
        />
        <SidebarItem
          icon={<Shield size={20} />}
          label="Comunidades"
          code="03"
          active={currentView === "comunidades"}
          onClick={() => { setCurrentView("comunidades"); setDeepLink(null); }}
        />
        <SidebarItem
          icon={<Target size={20} />}
          label="Treinos"
          code="04"
          active={currentView === "treinos"}
          onClick={() => setCurrentView("treinos")}
        />
        <SidebarItem
          icon={<UtensilsCrossed size={20} />}
          label="Nutrição"
          code="NUT"
          active={currentView === "nutricao"}
          onClick={() => setCurrentView("nutricao")}
        />
        <SidebarItem
          icon={<TrendingUp size={20} />}
          label="Evolução"
          code="05"
          active={currentView === "metricas"}
          onClick={() => setCurrentView("metricas")}
        />
        <SidebarItem
          icon={<UserRound size={20} />}
          label="Meu Perfil"
          code="PER"
          active={currentView === "perfil"}
          onClick={() => setCurrentView("perfil")}
        />
      </nav>

      <div className="pt-8 border-t border-white/5 space-y-3.5 flex flex-col text-left">
        {canBossPanel && (
          <SidebarItem
            icon={<Crown size={20} />}
            label="Boss"
            code="BOSS"
            active={currentView === "boss"}
            onClick={() => setCurrentView("boss")}
          />
        )}
        <SidebarItem
          icon={<Settings size={20} />}
          label="Ajustes"
          code="SET"
          active={currentView === "config"}
          onClick={() => setCurrentView("config")}
        />
        <SidebarItem
          icon={<HelpCircle size={20} />}
          label="Ajuda"
          code="HELP"
          active={currentView === "ajuda"}
          onClick={() => setCurrentView("ajuda")}
        />
        <SidebarItem
          icon={<MessageSquarePlus size={20} />}
          label="Sugestões"
          code="SUG"
          active={currentView === "sugestoes"}
          onClick={() => setCurrentView("sugestoes")}
        />
        <SidebarItem
          icon={<LogOut size={20} />}
          label="Sair"
          code="EXIT"
          active={false}
          onClick={onLogout}
          danger
        />
      </div>
    </aside>
  );
};
