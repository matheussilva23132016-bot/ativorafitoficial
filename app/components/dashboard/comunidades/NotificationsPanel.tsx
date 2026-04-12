"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, X, CheckCheck, RefreshCw,
  Trophy, Dumbbell, UtensilsCrossed,
  Target, Users, Megaphone, ShieldCheck,
  Zap, AlertCircle,
} from "lucide-react";

// ══════════════════════════════════════════════════════════════════
// TIPOS
// ══════════════════════════════════════════════════════════════════
interface Notificacao {
  id:           string;
  tipo:         string;
  titulo:       string;
  mensagem:     string;
  lida:         boolean;
  created_at:   string;
  comunidade_id?: string;
  payload?:     any;
}

interface NotificationsPanelProps {
  currentUser:  any;
  communityId?: string;
  isOpen:       boolean;
  onClose:      () => void;
}

// ══════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════
function getNotifIcon(tipo: string): React.ReactNode {
  if (tipo.includes("treino"))    return <Dumbbell size={16} className="text-sky-500" />;
  if (tipo.includes("nutri") || tipo.includes("cardapio")) return <UtensilsCrossed size={16} className="text-emerald-500" />;
  if (tipo.includes("desafio"))   return <Target size={16} className="text-amber-500" />;
  if (tipo.includes("ranking") || tipo.includes("campeao")) return <Trophy size={16} className="text-amber-400" />;
  if (tipo.includes("selo"))      return <Zap size={16} className="text-purple-500" />;
  if (tipo.includes("entrada") || tipo.includes("membro")) return <Users size={16} className="text-sky-500" />;
  if (tipo.includes("anuncio"))   return <Megaphone size={16} className="text-orange-500" />;
  if (tipo.includes("aprovado"))  return <ShieldCheck size={16} className="text-green-500" />;
  if (tipo.includes("reprovado") || tipo.includes("recusado")) return <AlertCircle size={16} className="text-rose-500" />;
  return <Bell size={16} className="text-white/40" />;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return "agora";
  if (mins  < 60) return `${mins}min`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
}

// ══════════════════════════════════════════════════════════════════
// COMPONENTE
// ══════════════════════════════════════════════════════════════════
export function NotificationsPanel({
  currentUser, communityId, isOpen, onClose,
}: NotificationsPanelProps) {
  const [notifs, setNotifs]   = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);

  const naoLidas = notifs.filter(n => !n.lida).length;

  const loadNotifs = useCallback(async () => {
    if (!currentUser?.id || !communityId) { setLoading(false); return; }
    setLoading(true);
    try {
      const res  = await fetch(
        `/api/communities/${communityId}/notifications?userId=${currentUser.id}`
      );
      const data = res.ok ? await res.json() : {};
      setNotifs(data.notifications ?? []);
    } catch {
      setNotifs([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, communityId]);

  useEffect(() => {
    if (isOpen) loadNotifs();
  }, [isOpen, loadNotifs]);

  const handleMarcarLida = async (notifId: string) => {
    setNotifs(p => p.map(n => n.id === notifId ? { ...n, lida: true } : n));
    try {
      await fetch(`/api/communities/${communityId}/notifications`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifId, userId: currentUser?.id }),
      });
    } catch { /* silencioso */ }
  };

  const handleMarcarTodas = async () => {
    setNotifs(p => p.map(n => ({ ...n, lida: true })));
    try {
      await fetch(`/api/communities/${communityId}/notifications`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId:       currentUser?.id,
          marcarTodas:  true,
        }),
      });
    } catch { /* silencioso */ }
  };

  // ══════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          {/* Painel */}
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[420px] z-50 bg-[#050B14] border-l border-white/10 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Bell size={20} className="text-white" />
                  {naoLidas > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-sky-500 text-black text-[8px] font-black rounded-full flex items-center justify-center">
                      {naoLidas > 9 ? "9+" : naoLidas}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase italic text-white tracking-tighter">
                    Notificações
                  </h3>
                  <p className="text-[9px] text-white/25 font-bold uppercase tracking-widest">
                    {naoLidas > 0 ? `${naoLidas} não lidas` : "Tudo em dia"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {naoLidas > 0 && (
                  <button
                    onClick={handleMarcarTodas}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-xl text-[9px] font-black uppercase text-white/30 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <CheckCheck size={12} /> Todas lidas
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 bg-white/5 rounded-xl text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Lista */}
            <div className="flex-1 overflow-y-auto scrollbar-none p-4 space-y-2">
              {loading ? (
                <div className="py-20 flex justify-center">
                  <RefreshCw className="animate-spin text-sky-500" size={22} />
                </div>
              ) : notifs.length === 0 ? (
                <div className="py-20 text-center opacity-20 space-y-3">
                  <Bell size={32} className="mx-auto" />
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    Nenhuma notificação
                  </p>
                </div>
              ) : (
                notifs.map(notif => (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => !notif.lida && handleMarcarLida(notif.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer
                      ${notif.lida
                        ? "bg-white/3 border-white/5 opacity-50 hover:opacity-70"
                        : "bg-white/5 border-white/10 hover:border-white/20"}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Ícone */}
                      <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 shrink-0 mt-0.5">
                        {getNotifIcon(notif.tipo)}
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className={`text-sm font-black uppercase italic leading-tight
                            ${notif.lida ? "text-white/40" : "text-white"}`}>
                            {notif.titulo}
                          </h4>
                          <span className="text-[8px] text-white/20 font-bold shrink-0">
                            {timeAgo(notif.created_at)}
                          </span>
                        </div>
                        <p className={`text-xs leading-relaxed
                          ${notif.lida ? "text-white/20" : "text-white/40"}`}>
                          {notif.mensagem}
                        </p>
                      </div>

                      {/* Indicador não lida */}
                      {!notif.lida && (
                        <div className="w-2 h-2 bg-sky-500 rounded-full shrink-0 mt-1.5" />
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/5 shrink-0">
              <p className="text-[8px] text-white/10 font-black uppercase tracking-widest text-center">
                {notifs.length} notificações carregadas
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
