"use client";

import React, { useState } from "react";
import { motion, Variants } from "framer-motion";
import { User, Target, ShieldCheck, Globe, Edit3, Award, Zap, Camera } from "lucide-react";

export const ProfileModule = () => {
  const [isPublic, setIsPublic] = useState(true);
  const status = "Hipertrofia Extrema";

  const containerVars: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVars: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120 } }
  };

  return (
    <motion.div variants={containerVars} initial="hidden" animate="show" className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-white">Sua <span className="text-sky-500">Identidade</span></h1>
        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-2">Gestão de status, perfil público e credenciais de segurança</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={itemVars} className="md:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity"><User size={100} /></div>
          <div className="flex flex-col md:flex-row gap-6 relative z-10">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-dashed border-sky-500/50 bg-[#010307] flex items-center justify-center shrink-0 relative cursor-pointer hover:bg-sky-500/10 transition-colors">
              <Camera className="w-8 h-8 text-sky-500/50" />
              <div className="absolute bottom-0 right-0 bg-sky-500 rounded-full p-1.5 shadow-[0_0_10px_#0EA5E9]"><Edit3 size={12} className="text-black" /></div>
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-3"><h2 className="text-2xl font-black uppercase tracking-tighter text-white">Matheus Silva</h2><span className="bg-sky-500/20 text-sky-400 text-[8px] px-2 py-1 rounded-sm font-black uppercase tracking-widest border border-sky-500/30">Profile +</span></div>
                <p className="text-sky-500 text-xs font-bold tracking-widest mt-1">@matheus_elite</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#010307] p-3 rounded-2xl border border-white/5"><span className="text-[8px] text-white/40 font-black uppercase tracking-widest block">Nível Biológico</span><strong className="text-sm text-white font-black">Intermediário</strong></div>
                <div className="bg-[#010307] p-3 rounded-2xl border border-white/5"><span className="text-[8px] text-white/40 font-black uppercase tracking-widest block">Métricas (Peso/Alt)</span><strong className="text-sm text-white font-black">78kg / 180cm</strong></div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVars} className="bg-sky-500 text-black border border-sky-400 rounded-3xl p-6 relative overflow-hidden shadow-[0_0_30px_rgba(14,165,233,0.15)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-black uppercase tracking-widest">Status Atual</h3><Target size={18} /></div>
            <div className="bg-black/10 rounded-2xl p-4 cursor-pointer hover:bg-black/20 transition-all">
              <div className="flex items-center gap-2 mb-1"><Zap size={14} className="fill-black" /><span className="text-xs font-black uppercase tracking-tighter">{status}</span></div>
              <p className="text-[9px] font-bold opacity-70 leading-tight">A IA está calibrando seus treinos para este objetivo.</p>
            </div>
          </div>
          <button className="w-full mt-4 py-3 bg-black text-sky-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-900 transition-colors">Alterar Diretriz</button>
        </motion.div>

        <motion.div variants={itemVars} className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col justify-between group">
          <div>
            <div className="flex items-center gap-3 mb-2"><Globe className="text-sky-500" size={20} /><h3 className="text-xs font-black uppercase tracking-widest text-white">Perfil Público</h3></div>
            <p className="text-[10px] text-white/40 font-bold mb-4">Visibilidade no Marketplace para conexões rápidas.</p>
            <label className="flex items-center justify-between cursor-pointer bg-[#010307] p-4 rounded-2xl border border-white/5">
              <span className="text-[10px] font-black uppercase text-white/70">Modo Público</span>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${isPublic ? 'bg-sky-500' : 'bg-white/10'}`} onClick={() => setIsPublic(!isPublic)}>
                <motion.div className="w-4 h-4 bg-white rounded-full absolute top-0.5" animate={{ left: isPublic ? '22px' : '2px' }} transition={{ type: "spring", stiffness: 300, damping: 20 }} />
              </div>
            </label>
          </div>
          <div className="mt-4 pt-4 border-t border-white/10"><span className="text-[8px] text-white/30 truncate block">ativorafit.com/p/matheus_elite</span></div>
        </motion.div>

        <motion.div variants={itemVars} className="md:col-span-2 bg-linear-to-r from-white/5 to-[#010307] border border-white/10 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center shrink-0"><ShieldCheck className="text-sky-500 w-8 h-8" /></div>
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-1"><h3 className="text-sm font-black uppercase tracking-widest text-white">Ativora Verifield</h3><Award size={14} className="text-sky-500" /></div>
            <p className="text-[10px] text-white/40 font-bold max-w-md">Envie sua documentação (identidade ou registro profissional) para obter o selo de autenticidade no sistema.</p>
          </div>
          <button className="shrink-0 px-6 py-4 bg-white/5 hover:bg-sky-500 hover:text-black border border-white/10 hover:border-sky-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Solicitar Selo</button>
        </motion.div>
      </div>
    </motion.div>
  );
};