"use client";

import React from "react";
import { motion, Variants } from "framer-motion";
import { 
  Calendar, Image as ImageIcon, Award, 
  Scale, Dumbbell, Stethoscope, 
  Trophy, TrendingUp, MessageSquare, Plus
} from "lucide-react";

export const TrainingModule = () => {
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
      
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-white">
            Performance & <span className="text-sky-500">Treino</span>
          </h1>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-2">
            Métricas corporais, calendário de treinos e recordes pessoais
          </p>
        </div>
        <button className="flex items-center gap-2 bg-sky-500 text-black px-6 py-3 rounded-full font-black uppercase tracking-widest text-[10px] hover:bg-sky-400 transition-colors active:scale-95 shrink-0">
          <Dumbbell size={14} /> Iniciar Treino
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <motion.div variants={itemVars} className="md:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
            <TrendingUp size={120} />
          </div>
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center gap-2">
              <Scale className="text-sky-500" size={20} />
              <h3 className="text-xs font-black uppercase tracking-widest text-white">Weight Tracking</h3>
            </div>
            <button className="text-[9px] font-black uppercase tracking-widest bg-white/10 px-3 py-1.5 rounded-full hover:bg-white/20 transition-colors text-white">
              Atualizar Peso
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
            <div className="bg-[#010307] p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
              <span className="text-[9px] text-white/40 font-black uppercase tracking-widest mb-1">Peso Atual</span>
              <strong className="text-2xl text-white font-black tracking-tighter">78.5<span className="text-[10px] text-sky-500 ml-1">KG</span></strong>
            </div>
            <div className="bg-[#010307] p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
              <span className="text-[9px] text-white/40 font-black uppercase tracking-widest mb-1">Meta Foco</span>
              <strong className="text-2xl text-white font-black tracking-tighter">82<span className="text-[10px] text-sky-500 ml-1">KG</span></strong>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVars} className="bg-sky-500 text-[#010307] rounded-3xl p-6 relative overflow-hidden shadow-[0_0_30px_rgba(14,165,233,0.15)]">
          <div className="flex items-center gap-2 mb-6">
            <Trophy size={20} className="text-[#010307]" />
            <h3 className="text-xs font-black uppercase tracking-widest">Personal Bests</h3>
          </div>
          <div className="space-y-3">
            <div className="bg-black/10 rounded-2xl p-3 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest">Supino Reto</span>
              <strong className="text-sm font-black">100 KG</strong>
            </div>
            <div className="bg-black/10 rounded-2xl p-3 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-widest">Agachamento</span>
              <strong className="text-sm font-black">140 KG</strong>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVars} className="md:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="text-sky-500" size={20} />
              <h3 className="text-xs font-black uppercase tracking-widest text-white">Workout Calendar</h3>
            </div>
            <span className="text-[9px] bg-white/10 text-white px-3 py-1.5 rounded-full font-black uppercase tracking-widest">
              Semana Atual
            </span>
          </div>
          <div className="space-y-2">
            {[ { day: 'TER', title: 'Costas e Bíceps', status: 'hoje', date: '07 ABR' } ].map((workout, i) => (
              <div key={i} className={`flex items-center justify-between p-4 rounded-2xl border ${workout.status === 'hoje' ? 'bg-sky-500/10 border-sky-500/50' : 'bg-[#010307] border-white/5'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] ${workout.status === 'hoje' ? 'bg-sky-500 text-black shadow-[0_0_15px_#0EA5E9]' : 'bg-white/5 text-white/40'}`}>
                    {workout.day}
                  </div>
                  <div>
                    <strong className="text-xs text-white uppercase font-black tracking-widest block">{workout.title}</strong>
                    <span className="text-[9px] text-white/40 font-bold uppercase tracking-widest">{workout.date}</span>
                  </div>
                </div>
                {workout.status === 'hoje' && (
                  <button className="text-[9px] bg-sky-500 text-black px-4 py-2 rounded-full font-black uppercase tracking-widest">
                    Treinar
                  </button>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={itemVars} className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <ImageIcon className="text-sky-500" size={20} />
            <h3 className="text-xs font-black uppercase tracking-widest text-white">Progress Photos</h3>
          </div>
          <div className="flex-1 flex gap-3">
            <div className="flex-1 rounded-2xl border-2 border-dashed border-white/10 bg-[#010307] flex flex-col items-center justify-center text-white/20 hover:text-sky-500 hover:border-sky-500/50 transition-colors cursor-pointer p-4 text-center">
              <Plus size={24} className="mb-2" />
              <span className="text-[8px] font-black uppercase tracking-widest">Foto Frente</span>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVars} className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
          <div className="bg-linear-to-r from-emerald-500/10 to-[#010307] border border-emerald-500/30 rounded-3xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
              <Stethoscope className="text-emerald-500" />
            </div>
            <div>
              <h4 className="text-emerald-500 text-xs font-black uppercase tracking-widest mb-1">Liberação Médica</h4>
              <p className="text-[10px] text-white/60 font-bold max-w-sm">Atestado médico validado. Apto para alta intensidade.</p>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-sky-500/10 flex items-center justify-center shrink-0">
              <MessageSquare className="text-sky-500" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <h4 className="text-sky-500 text-xs font-black uppercase tracking-widest">Coach Feedback</h4>
                <span className="text-[8px] text-white/30 uppercase font-black">Ontem</span>
              </div>
              <p className="text-[10px] text-white/60 font-bold truncate">
                &quot;Excelente execução no agachamento. Subiremos a carga.&quot;
              </p>
            </div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
};