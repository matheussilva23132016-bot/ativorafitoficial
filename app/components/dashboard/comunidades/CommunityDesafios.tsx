"use client";

import React from "react";
import { motion } from "framer-motion";
import { Target, Upload, CheckCircle2, Clock, Zap, Plus, Image as ImageIcon } from "lucide-react";

interface CommunityDesafiosProps {
  currentUser: any;
  userTags: string[];
}

export function CommunityDesafios({ currentUser, userTags }: CommunityDesafiosProps) {
  const isADM = userTags.includes('ADM') || userTags.includes('Dono');

  const missoes = [
    { id: 1, titulo: "Treino Concluído", desc: "Envie uma foto pós-treino no espelho da academia.", xp: 50, status: 'pendente', tipo: 'foto' },
    { id: 2, titulo: "Bater os Macros", desc: "Marque todas as refeições do dia como concluídas.", xp: 30, status: 'aprovado', tipo: 'check' },
    { id: 3, titulo: "Cardio em Jejum", desc: "20 min de AEJ (Envie print do Apple Watch/Strava).", xp: 40, status: 'analise', tipo: 'foto' },
  ];

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">
            Central de <span className="text-sky-500">Missões</span>
          </h2>
          <p className="text-xs text-white/40 font-medium mt-1">Cumpra os desafios diários, acumule XP e domine o ranking.</p>
        </div>

        {isADM && (
          <button className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-neon">
            <Plus size={14} /> Nova Missão
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {missoes.map((missao, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            key={missao.id} 
            className="bg-[#050B14] border border-white/5 rounded-4xl p-6 shadow-xl flex flex-col justify-between group hover:border-white/10 transition-colors"
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-white/5 rounded-xl text-sky-500 border border-white/5">
                  <Target size={20} />
                </div>
                <div className="flex items-center gap-1 bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full border border-amber-500/20 text-[10px] font-black uppercase tracking-widest">
                  <Zap size={12} fill="currentColor" /> +{missao.xp} XP
                </div>
              </div>
              <h3 className="text-lg font-black uppercase italic tracking-tighter text-white">{missao.titulo}</h3>
              <p className="text-xs text-white/40 font-medium mt-2 leading-relaxed">{missao.desc}</p>
            </div>

            <div className="mt-6 pt-6 border-t border-white/5">
              {missao.status === 'pendente' && (
                <button className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-sky-500 hover:text-black transition-all text-white text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/10 hover:border-transparent">
                  {missao.tipo === 'foto' ? <><ImageIcon size={14}/> Enviar Prova</> : <><CheckCircle2 size={14}/> Concluir</>}
                </button>
              )}
              {missao.status === 'analise' && (
                <div className="w-full flex items-center justify-center gap-2 py-3 bg-orange-500/10 text-orange-500 text-[10px] font-black uppercase tracking-widest rounded-xl border border-orange-500/20">
                  <Clock size={14} /> Em Análise pelo ADM
                </div>
              )}
              {missao.status === 'aprovado' && (
                <div className="w-full flex items-center justify-center gap-2 py-3 bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-widest rounded-xl border border-green-500/20">
                  <CheckCircle2 size={14} /> Missão Cumprida
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}