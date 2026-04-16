"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Zap, Target, Users, Check, Trash2, Clock } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "treino" | "social" | "comunidade";
  isRead: boolean;
  timestamp?: string;
}

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAllRead: () => void;
  onDeleteAll?: () => void;
  onOpenNotification?: (notification: Notification) => void;
}

const NotifIcon = ({ type }: any) => {
  switch (type) {
    case "treino": return <Target size={14} className="text-sky-400" />;
    case "social": return <Zap size={14} className="text-orange-400" />;
    case "comunidade": return <Users size={14} className="text-indigo-400" />;
    default: return <Bell size={14} className="text-white/20" />;
  }
};

const formatTime = (value?: string) => {
  if (!value) return "Agora";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Agora";
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return "Agora";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
};

export const NotificationDrawer = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onDeleteAll,
  onOpenNotification,
}: NotificationDrawerProps) => {
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex justify-end pointer-events-none">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
          />

          {/* Drawer Content */}
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-full max-w-md h-full bg-[#050B14] border-l border-white/5 flex flex-col shadow-2xl pointer-events-auto"
          >
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <Bell size={18} className="text-white/40" />
                  </div>
                  <div>
                    <h3 className="text-[13px] font-black uppercase italic tracking-[0.2em] text-white">Central de Sinais</h3>
                    <p className="text-[9px] font-black uppercase text-white/20 tracking-widest mt-0.5">Alertas de órbita</p>
                  </div>
               </div>
               <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X size={20} className="text-white/20" />
               </button>
            </div>

            {/* Actions */}
            <div className="px-8 py-4 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                <span className="text-[9px] font-black uppercase text-white/20 tracking-widest italic">{unreadCount} sinais pendentes</span>
                <button 
                  onClick={onMarkAllRead}
                  className="flex items-center gap-2 text-[9px] font-black uppercase text-sky-500/60 hover:text-sky-400 transition-colors"
                >
                  <Check size={12} /> Limpar Radar
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-none space-y-2">
               {notifications.length > 0 ? (
                  notifications.map(n => (
                    <button 
                      key={n.id}
                      onClick={() => onOpenNotification?.(n)}
                      className={`w-full text-left p-5 rounded-lg transition-all relative border border-transparent group
                        ${n.isRead ? "bg-transparent opacity-60" : "bg-white/[0.03] border-white/5 hover:border-sky-500/20 shadow-lg"}`}
                    >
                       <div className="flex gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/5
                            ${n.type === 'treino' ? 'bg-sky-500/10' : n.type === 'social' ? 'bg-orange-500/10' : 'bg-indigo-500/10'}`}>
                             <NotifIcon type={n.type} />
                          </div>
                          <div className="flex-1 min-w-0">
                             <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-black uppercase text-sky-400/80 tracking-widest">{n.title}</span>
                                <span className="text-[8px] font-bold text-white/10 flex items-center gap-1 group-hover:text-white/30 transition-colors">
                                   <Clock size={8} /> {formatTime(n.timestamp)}
                                </span>
                             </div>
                             <p className="text-[12px] text-white/60 leading-normal line-clamp-2">{n.message}</p>
                          </div>
                       </div>
                       {!n.isRead && (
                          <div className="absolute top-4 right-4 w-1.5 h-1.5 bg-sky-500 rounded-full shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                       )}
                    </button>
                  ))
               ) : (
                  <div className="py-20 text-center space-y-6 opacity-20">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10">
                          <Bell size={24} />
                      </div>
                      <p className="text-[11px] font-black uppercase tracking-[0.5em] italic">Radar Limpo</p>
                  </div>
               )}
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-white/5 bg-black/40">
               <button
                 type="button"
                 onClick={onDeleteAll}
                 className="w-full h-14 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/10 transition-all"
               >
                  <Trash2 size={16} /> Excluir tudo
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
