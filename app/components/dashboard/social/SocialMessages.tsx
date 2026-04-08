"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Send, ShieldAlert, Lock } from "lucide-react";

export const SocialMessages = ({ onBack }: { onBack: () => void }) => {
  return (
    <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="max-w-5xl mx-auto h-[700px] flex flex-col bg-white/5 border border-white/10 rounded-5xl overflow-hidden backdrop-blur-3xl shadow-2xl">
      {/* Header do Chat */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-white/40 hover:text-white">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/20" />
            <div>
              <p className="text-xs font-black text-white uppercase italic">Suporte Elite</p>
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-green-500" />
                <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Canal Ativo</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/5 border border-orange-500/20">
           <Lock size={12} className="text-orange-500" />
           <span className="text-[8px] font-black text-orange-500 uppercase italic">Criptografia Ativora</span>
        </div>
      </div>

      {/* Área de Mensagens (Vazia/Simulada) */}
      <div className="flex-1 p-8 flex flex-col justify-center items-center text-center space-y-4 opacity-20">
        <ShieldAlert size={48} />
        <div>
          <p className="font-black italic uppercase text-lg">Inicie uma conversa segura</p>
          <p className="text-[10px] font-bold uppercase tracking-widest">Suas mensagens são protegidas pelo protocolo de performance.</p>
        </div>
      </div>

      {/* Input de Mensagem */}
      <div className="p-6 bg-black/40 border-t border-white/5">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Digite uma mensagem segura..." 
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-6 pr-16 text-sm font-bold outline-none focus:border-sky-500/50 transition-all"
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-sky-500 text-black rounded-xl hover:scale-105 transition-transform shadow-lg shadow-sky-500/20">
            <Send size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};