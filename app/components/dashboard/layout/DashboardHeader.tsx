"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Crown, HelpCircle, MessageSquarePlus, Shield } from "lucide-react";
import { INotification } from "../MainDashboard";

interface DashboardHeaderProps {
  currentUser: any;
  notifications: INotification[];
  onNotificationClick: (notif: INotification) => void;
  setCurrentView: (view: any) => void;
  canBossPanel?: boolean;
}

const roleLabels: Record<string, string> = {
  aluno: "Aluno",
  personal: "Personal",
  instrutor: "Instrutor",
  nutri: "Nutricionista",
  nutricionista: "Nutricionista",
  influencer: "Influenciador",
  adm: "Administrador",
  admin: "Administrador",
};

export const DashboardHeader = ({
  currentUser,
  notifications,
  onNotificationClick,
  setCurrentView,
  canBossPanel = false,
}: DashboardHeaderProps) => {
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const roleLabel = roleLabels[String(currentUser?.role || "").toLowerCase()] || "Perfil ativo";

  return (
    <header className="h-20 lg:h-24 border-b border-white/5 flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-10 backdrop-blur-2xl z-40 bg-black/20 shrink-0">
      <div className="flex min-w-0 items-center gap-4 lg:gap-6">
        <div className="min-w-0 cursor-pointer lg:hidden" onClick={() => setCurrentView("home")}>
          <span className="block truncate text-lg font-black italic text-white sm:text-xl">
            Ativora<span className="text-sky-500">Fit</span>
          </span>
          <span className="mt-0.5 block truncate text-[8px] font-black uppercase tracking-widest text-white/28">
            A Evolução na Palma da sua mão!
          </span>
        </div>

        <div className="hidden md:flex items-center gap-3 bg-sky-500/5 px-4 py-2.5 rounded-lg border border-sky-500/10 text-[10px] font-black uppercase tracking-widest text-sky-500 shadow-[inset_0_0_20px_rgba(14,165,233,0.05)]">
          <Shield size={14} className="animate-pulse" />
          Painel ativo
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3 lg:gap-5">
        {canBossPanel && (
          <button
            type="button"
            onClick={() => setCurrentView("boss")}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-sky-400/40 bg-sky-500 px-3 text-[10px] font-black uppercase tracking-widest text-black shadow-[0_0_18px_rgba(14,165,233,0.22)] transition hover:bg-sky-400 sm:px-4"
            aria-label="Abrir Painel Boss"
            title="Painel Boss"
          >
            <Crown size={17} />
            <span className="hidden sm:inline">Boss</span>
          </button>
        )}

        <div className="hidden items-center gap-2 sm:flex">
          <button
            type="button"
            onClick={() => setCurrentView("ajuda")}
            className="rounded-lg border border-white/10 bg-white/5 p-3 text-white/40 transition-all hover:bg-white/10 hover:text-sky-300"
            aria-label="Abrir ajuda"
            title="Ajuda"
          >
            <HelpCircle size={19} />
          </button>

          <button
            type="button"
            onClick={() => setCurrentView("sugestoes")}
            className="rounded-lg border border-white/10 bg-white/5 p-3 text-white/40 transition-all hover:bg-white/10 hover:text-sky-300"
            aria-label="Enviar sugestão"
            title="Sugestões"
          >
            <MessageSquarePlus size={19} />
          </button>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifPanel((value) => !value)}
            aria-label="Abrir notificações"
            className={`relative rounded-lg border p-3 transition-all ${
              unreadCount > 0
                ? "bg-sky-500/10 border-sky-500/30 text-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.1)]"
                : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10"
            }`}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-sky-500 rounded-full shadow-neon"
              />
            )}
          </button>

          <AnimatePresence>
            {showNotifPanel && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                className="fixed left-4 right-4 top-20 max-h-[70vh] overflow-hidden rounded-lg border border-white/10 bg-[#050B14] text-left shadow-3xl z-50 sm:absolute sm:left-auto sm:right-0 sm:top-16 sm:w-80"
              >
                <div className="p-5 border-b border-white/5 flex justify-between items-center gap-3">
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white">
                    Notificações
                  </span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-sky-500 px-3 py-1 text-[9px] font-black uppercase text-black">
                      {unreadCount} novas
                    </span>
                  )}
                </div>

                <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-10 text-center text-[10px] font-black uppercase text-white/25 tracking-[0.22em]">
                      Nenhuma notificação agora
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <button
                        type="button"
                        key={notif.id}
                        onClick={() => {
                          onNotificationClick(notif);
                          setShowNotifPanel(false);
                        }}
                        className={`w-full p-5 border-b border-white/5 cursor-pointer hover:bg-sky-500/5 transition-all relative group text-left ${
                          !notif.isRead ? "bg-sky-500/5" : ""
                        }`}
                      >
                        {!notif.isRead && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-sky-500 rounded-r-full group-hover:h-12 transition-all" />
                        )}
                        <h4 className="text-xs font-black text-white uppercase italic tracking-tight">
                          {notif.title}
                        </h4>
                        <p className="text-[10px] text-white/45 mt-1.5 leading-relaxed">
                          {notif.message}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-3 pl-2 border-l border-white/5">
          <button type="button" onClick={() => setCurrentView("perfil")} className="hidden xl:block text-right">
            <p className="text-[10px] font-black text-white uppercase italic leading-none">
              {currentUser.nickname}
            </p>
            <p className="text-[8px] font-bold text-sky-500/60 uppercase tracking-widest mt-1">
              {roleLabel}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setCurrentView("perfil")}
            className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg border-2 border-white/10 overflow-hidden relative shadow-2xl group cursor-pointer"
            aria-label="Abrir Meu Perfil"
            title="Meu Perfil"
          >
            <Image
              src={currentUser.avatar}
              alt="Perfil"
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
              unoptimized
            />
          </button>
        </div>
      </div>
    </header>
  );
};
