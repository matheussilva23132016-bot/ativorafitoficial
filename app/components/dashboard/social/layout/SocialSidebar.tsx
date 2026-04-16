"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Zap, Users, Shield, Target,
  Search, Bell, MessageSquare, Bookmark,
  ChevronRight, ArrowLeft
} from "lucide-react";

interface SocialSidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  safeUser: any;
  isGuest?: boolean;
  onOpenNotifications: () => void;
  onOpenSearch: () => void;
  onOpenProfile?: () => void;
  onOpenMessages?: () => void;
  onBack?: () => void;
  notificationCount?: number;
}

const NavItem = ({ icon: Icon, label, id, active, onClick, badge, disabled }: any) => (
  <button 
    onClick={() => !disabled && onClick(id)}
    disabled={disabled}
    className="group relative flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-3 transition-all disabled:cursor-not-allowed disabled:opacity-35"
  >
    {active && (
      <motion.div 
        layoutId="social-nav-active"
        className="absolute inset-0 rounded-lg border border-sky-500/20 bg-sky-500/10 shadow-[0_0_30px_rgba(56,189,248,0.1)]"
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      />
    )}
    <div className={`relative z-10 transition-transform duration-300 group-hover:scale-110 ${active ? "text-sky-400" : "text-white/30 group-hover:text-white"}`}>
      <Icon size={22} strokeWidth={active ? 2.5 : 2} />
      {badge && (
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.6)] animate-pulse" />
      )}
    </div>
    <span className={`relative z-10 text-[10px] font-black uppercase tracking-[0.16em] transition-colors
      ${active ? "text-white" : "text-white/20 group-hover:text-white/60"}`}>
      {label}
    </span>
    {active && (
      <motion.div 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="ml-auto relative z-10"
      >
        <div className="w-1 h-3 bg-sky-500 rounded-full shadow-[0_0_10px_rgba(56,189,248,0.8)]" />
      </motion.div>
    )}
  </button>
);

export const SocialSidebar = ({ 
  activeTab, 
  setActiveTab, 
  safeUser, 
  isGuest = false,
  onOpenNotifications, 
  onOpenSearch,
  onOpenProfile,
  onOpenMessages,
  onBack,
  notificationCount = 0,
}: SocialSidebarProps) => {
  return (
    <aside className="sticky top-0 z-[100] flex min-h-dvh w-full flex-col border-r border-white/[0.05] bg-[#010307]/70 px-4 py-6 backdrop-blur-xl">
      {/* Brand Logo (Cleaned up) */}
      <div className="mb-8 px-2">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-6 flex w-full items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-[0.16em] text-white/[0.35] transition-all hover:border-sky-500/30 hover:text-white"
          >
            <ArrowLeft size={14} />
            Voltar ao painel
          </button>
        )}
        <h1 className="inline-flex cursor-pointer select-none flex-col text-2xl font-bold tracking-tighter text-white group">
          <div className="flex items-center gap-2">
            <span className="h-7 w-1.5 rounded-full bg-sky-500 shadow-[0_0_15px_rgba(56,189,248,0.5)] transition-all duration-300 group-hover:h-8" />
            ATIVORA <span className="text-sky-500">SOCIAL</span>
          </div>
          <span className="mt-2 text-[9px] font-bold uppercase tracking-[0.2em] text-white/20">Compartilhe os seus resultados</span>
        </h1>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 space-y-1.5">
        <NavItem icon={Zap} label="Radar Social" id="explorar" active={activeTab === "explorar"} onClick={setActiveTab} />
        <NavItem icon={Users} label="Meus Aliados" id="seguindo" active={activeTab === "seguindo"} onClick={setActiveTab} />
        <NavItem icon={Shield} label="Elite Ativora" id="tendencias" active={activeTab === "tendencias"} onClick={setActiveTab} />
        <NavItem icon={Target} label="Meu Perfil" id="meu_perfil" active={activeTab === "meu_perfil"} onClick={onOpenProfile || setActiveTab} />
        
        <div className="mx-4 my-5 h-px bg-white/[0.04]" />

        <NavItem icon={Search} label="Explorar Rede" id="buscar" onClick={onOpenSearch} />
        <NavItem icon={Bell} label="Alertas" id="notificacoes" onClick={onOpenNotifications} badge={notificationCount > 0} />
        <NavItem icon={MessageSquare} label="Mensagens" id="mensagens" onClick={onOpenMessages || (() => {})} disabled={isGuest} />
        <NavItem icon={Bookmark} label="Itens Salvos" id="salvos" active={activeTab === "salvos"} onClick={setActiveTab} />
      </nav>

      <div>
        <button className="group relative w-full overflow-hidden rounded-lg border border-white/5 bg-white/[0.02] p-4 text-left shadow-2xl transition-all hover:bg-white/[0.04]">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-4 relative z-10">
                <div className="h-11 w-11 shrink-0 rounded-lg bg-gradient-to-br from-sky-400 to-emerald-500 p-[1px] shadow-lg transition-all group-hover:shadow-sky-500/20">
                    <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[7px] bg-[#0c121d]">
                        {safeUser.avatar || safeUser.avatar_url || safeUser.foto_url ? (
                          <img src={safeUser.avatar || safeUser.avatar_url || safeUser.foto_url} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <span className="text-sky-500 font-bold">@</span>
                        )}
                    </div>
                </div>
                <div className="flex-1 min-w-0 text-left">
                    <p className="text-[13px] font-bold text-white truncate tracking-tight">@{safeUser.username}</p>
                    {(typeof safeUser.xp === "number" || typeof safeUser.nivel === "number") && (
                      <div className="mt-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-sky-500/80">
                        {typeof safeUser.nivel === "number" && <span>Lvl {safeUser.nivel}</span>}
                        {typeof safeUser.xp === "number" && <span className="truncate text-white/25">{safeUser.xp} XP</span>}
                      </div>
                    )}
                </div>
                <ChevronRight size={14} className="text-white/20 group-hover:text-sky-500 group-hover:translate-x-1 transition-all" />
            </div>
        </button>
      </div>
    </aside>
  );
};
