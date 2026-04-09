"use client";

import React from "react";
// CORREÇÃO: Bell adicionado aos imports
import { ArrowLeft, Heart, UserPlus, MessageSquare, Trophy, Check, Bell } from "lucide-react";
import { motion } from "framer-motion";

interface Notificacao {
  id: number;
  remetente_nickname: string;
  tipo: 'follow' | 'like' | 'comment' | 'message' | 'xp_award';
  lida: number;
  created_at: string;
}

export const SocialNotifications = ({ data, onBack, onMarkAsRead }: { 
  data: Notificacao[], 
  onBack: () => void,
  onMarkAsRead: () => void 
}) => {
  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'follow': return <UserPlus className="text-sky-500" size={18} />;
      case 'like': return <Heart className="text-rose-500 fill-rose-500" size={18} />;
      case 'message': return <MessageSquare className="text-emerald-500" size={18} />;
      case 'xp_award': return <Trophy className="text-amber-400" size={18} />;
      default: return <Check className="text-white/20" size={18} />;
    }
  };

  const getTexto = (n: Notificacao) => {
    switch (n.tipo) {
      case 'follow': return "solicitou seguir sua matriz ou começou a te seguir.";
      case 'like': return "marcou seu registro como alta performance (curtiu).";
      case 'message': return "enviou uma nova transmissão no direct.";
      case 'xp_award': return "PARABÉNS! Você recebeu uma bonificação de XP.";
      default: return "interagiu com você.";
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#010307]">
      {/* Header Tático */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full transition-all text-white/50">
            <ArrowLeft size={24} />
          </button>
          <h2 className="font-black italic uppercase tracking-widest text-white">Central de Alertas</h2>
        </div>
        <button onClick={onMarkAsRead} className="text-[10px] font-black uppercase text-sky-500 hover:underline"> 
          Limpar Tudo 
        </button>
      </div>

      {/* Lista de Alertas */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {data.length > 0 ? (
          data.map((n) => (
            <motion.div 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }}
              key={n.id} 
              className={`p-4 rounded-2xl border flex items-center gap-4 transition-all ${n.lida ? 'bg-white/5 border-white/5 opacity-60' : 'bg-sky-500/5 border-sky-500/20 shadow-[0_0_15px_rgba(14,165,233,0.1)]'}`}
            >
              <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center shrink-0 border border-white/10">
                {getIcon(n.tipo)}
              </div>
              <div className="text-left">
                <p className="text-xs text-white leading-tight">
                  <span className="font-black">@{n.remetente_nickname}</span> {getTexto(n)}
                </p>
                <span className="text-[8px] font-bold text-white/20 uppercase mt-1 block">
                  {new Date(n.created_at).toLocaleDateString()} às {new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-20">
             <Bell size={48} className="mb-4" />
             <p className="font-black uppercase italic text-sm tracking-tighter">Nenhum sinal detectado</p>
          </div>
        )}
      </div>
    </div>
  );
};