"use client";

import React from "react";
import { Bell, MessageSquare, Plus, Shield, User, Zap } from "lucide-react";

interface SocialBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  safeUser: any;
  onOpenNotifications: () => void;
  onOpenMessages: () => void;
  onOpenComposer: () => void;
  onOpenProfile: () => void;
  isGuest?: boolean;
  notificationCount?: number;
}

const MobileNavItem = ({ icon: Icon, label, active, onClick, badge, disabled }: any) => (
  <button
    onClick={onClick}
    className="relative flex min-w-0 flex-1 flex-col items-center justify-center rounded-lg py-2 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-35"
    disabled={disabled}
  >
    <div className={`relative transition-all duration-200 ${active ? "text-sky-400" : "text-white/[0.28]"}`}>
      <Icon size={21} strokeWidth={active ? 2.5 : 2} />
      {badge && (
        <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
      )}
    </div>
    <span
      className={`mt-1.5 truncate text-[8px] font-bold uppercase tracking-[0.1em] transition-colors
      ${active ? "text-sky-400" : "text-white/[0.16]"}`}
    >
      {label}
    </span>
  </button>
);

export const SocialBottomNav = ({
  activeTab,
  setActiveTab,
  onOpenNotifications,
  onOpenMessages,
  onOpenComposer,
  onOpenProfile,
  isGuest = false,
  notificationCount = 0,
}: SocialBottomNavProps) => {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-[200] border-t border-white/[0.06] bg-[#010307]/92 px-3 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] pt-2 backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-1">
        <MobileNavItem
          icon={Zap}
          label="Radar"
          active={activeTab === "explorar" || activeTab === "seguindo"}
          onClick={() => setActiveTab("explorar")}
        />

        <MobileNavItem
          icon={Shield}
          label="Elite"
          active={activeTab === "tendencias"}
          onClick={() => setActiveTab("tendencias")}
        />

        <button
          onClick={onOpenComposer}
          disabled={isGuest}
          className="mx-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-sky-300/30 bg-sky-500 text-black shadow-[0_10px_32px_rgba(56,189,248,0.35)] transition-all active:scale-90 disabled:cursor-not-allowed disabled:opacity-35"
          aria-label={isGuest ? "Entre para publicar" : "Novo relato"}
        >
          <Plus size={26} strokeWidth={3} />
        </button>

        <MobileNavItem
          icon={MessageSquare}
          label="Direct"
          onClick={onOpenMessages}
          disabled={isGuest}
          badge={false}
        />

        <MobileNavItem icon={Bell} label="Alertas" onClick={onOpenNotifications} badge={notificationCount > 0} />

        <MobileNavItem
          icon={User}
          label="Perfil"
          active={activeTab === "meu_perfil"}
          onClick={onOpenProfile}
        />
      </div>
    </nav>
  );
};
