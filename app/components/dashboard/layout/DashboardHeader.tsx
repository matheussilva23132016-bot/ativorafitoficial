"use client";

import React, { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Crown, HelpCircle, MessageSquarePlus } from "lucide-react";
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

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
};

export const DashboardHeader = ({
  currentUser,
  notifications,
  onNotificationClick,
  setCurrentView,
  canBossPanel = false,
}: DashboardHeaderProps) => {
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const roleLabel = roleLabels[String(currentUser?.role || "").toLowerCase()] || "Perfil ativo";
  const greeting = getGreeting();

  return (
    <header className="h-16 border-b border-white/5 bg-black/20 px-4 backdrop-blur-2xl sm:px-6 lg:h-[72px] lg:px-8">
      <div className="flex h-full items-center justify-between gap-3">
        <div className="min-w-0 text-left">
          <button
            type="button"
            onClick={() => setCurrentView("home")}
            className="min-w-0 text-left lg:hidden"
            aria-label="Abrir início"
          >
            <span className="block truncate text-base font-black italic text-white sm:text-lg">
              Ativora<span className="text-sky-500">Fit</span>
            </span>
          </button>

          <div className="hidden lg:block">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">
              {greeting}
            </p>
            <p className="mt-1 text-sm font-black text-white xl:text-base">
              {currentUser.nickname}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 lg:gap-3">
          {canBossPanel && (
            <button
              type="button"
              onClick={() => setCurrentView("boss")}
              className="hidden min-h-10 items-center justify-center gap-2 rounded-lg border border-sky-400/35 bg-sky-500 px-3 text-[10px] font-black uppercase tracking-widest text-black transition hover:bg-sky-400 xl:inline-flex"
              aria-label="Abrir Painel Boss"
              title="Painel Boss"
            >
              <Crown size={16} />
              Boss
            </button>
          )}

          <div className="hidden items-center gap-2 lg:flex">
            <button
              type="button"
              onClick={() => setCurrentView("ajuda")}
              className="rounded-lg border border-white/10 bg-white/5 p-2.5 text-white/40 transition hover:bg-white/10 hover:text-sky-300"
              aria-label="Abrir ajuda"
              title="Ajuda"
            >
              <HelpCircle size={18} />
            </button>

            <button
              type="button"
              onClick={() => setCurrentView("sugestoes")}
              className="rounded-lg border border-white/10 bg-white/5 p-2.5 text-white/40 transition hover:bg-white/10 hover:text-sky-300"
              aria-label="Abrir sugestões"
              title="Sugestões"
            >
              <MessageSquarePlus size={18} />
            </button>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifPanel(value => !value)}
              aria-label="Abrir notificações"
              className={`relative rounded-lg border p-2.5 transition ${
                unreadCount > 0
                  ? "border-sky-500/30 bg-sky-500/10 text-sky-400"
                  : "border-white/10 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute right-2 top-2 h-2 w-2 rounded-full bg-sky-500"
                />
              )}
            </button>

            <AnimatePresence>
              {showNotifPanel && (
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.96 }}
                  className="fixed left-4 right-4 top-16 z-50 max-h-[70vh] overflow-hidden rounded-lg border border-white/10 bg-[#050B14] text-left shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-14 sm:w-80"
                >
                  <div className="flex items-center justify-between gap-3 border-b border-white/5 p-4">
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white">
                      Notificações
                    </span>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-sky-500 px-3 py-1 text-[9px] font-black uppercase text-black">
                        {unreadCount} novas
                      </span>
                    )}
                  </div>

                  <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-[10px] font-black uppercase tracking-[0.22em] text-white/25">
                        Nenhuma notificação agora
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <button
                          type="button"
                          key={notif.id}
                          onClick={() => {
                            onNotificationClick(notif);
                            setShowNotifPanel(false);
                          }}
                          className={`relative w-full border-b border-white/5 p-4 text-left transition hover:bg-sky-500/5 ${
                            !notif.isRead ? "bg-sky-500/5" : ""
                          }`}
                        >
                          {!notif.isRead && (
                            <span className="absolute left-0 top-1/2 h-9 w-1 -translate-y-1/2 rounded-r-full bg-sky-500" />
                          )}
                          <h4 className="text-xs font-black uppercase tracking-tight text-white">
                            {notif.title}
                          </h4>
                          <p className="mt-1 text-[10px] leading-relaxed text-white/45">
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

          <div className="flex items-center gap-2 border-l border-white/5 pl-2">
            <button
              type="button"
              onClick={() => setCurrentView("perfil")}
              className="hidden text-right xl:block"
            >
              <p className="text-[10px] font-black uppercase italic leading-none text-white">
                {currentUser.nickname}
              </p>
              <p className="mt-1 text-[8px] font-bold uppercase tracking-widest text-sky-500/60">
                {roleLabel}
              </p>
            </button>

            <button
              type="button"
              onClick={() => setCurrentView("perfil")}
              className="relative h-9 w-9 overflow-hidden rounded-lg border border-white/10 lg:h-10 lg:w-10"
              aria-label="Abrir Meu Perfil"
              title="Meu Perfil"
            >
              <Image
                src={currentUser.avatar}
                alt="Perfil"
                fill
                className="object-cover"
                unoptimized
              />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
