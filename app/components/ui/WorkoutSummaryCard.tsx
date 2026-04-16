"use client";

import React from "react";
import { motion } from "framer-motion";
import { Target, Clock, Activity, Play } from "lucide-react";

interface WorkoutSummaryCardProps {
  workout: {
    id: string;
    titulo: string;
    foco: string;
    totalExercicios: number;
    tempoEstimado?: string;
  };
  onStart: () => void;
}

export const WorkoutSummaryCard = ({ workout, onStart }: WorkoutSummaryCardProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#050B14] border border-white/10 rounded-[40px] p-8 lg:p-10 relative overflow-hidden group shadow-3xl"
    >
      {/* Glow de Background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 blur-[100px] pointer-events-none group-hover:bg-sky-500/15 transition-all duration-700" />
      
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 bg-sky-500/10 text-sky-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest italic border border-sky-500/20">
            <Activity size={12} /> Missão Disponível
          </div>
          
          <h3 className="text-3xl lg:text-5xl font-black text-white uppercase italic tracking-tighter leading-none">
            {workout.titulo}
          </h3>
          
          <div className="flex flex-wrap gap-6 pt-2">
            <div className="flex items-center gap-2 text-white/40">
              <Target size={16} className="text-sky-500" />
              <span className="text-xs font-bold uppercase tracking-widest">{workout.foco}</span>
            </div>
            <div className="flex items-center gap-2 text-white/40">
              <Clock size={16} className="text-sky-500" />
              <span className="text-xs font-bold uppercase tracking-widest">{workout.tempoEstimado || "45-60 min"}</span>
            </div>
            <div className="flex items-center gap-2 text-white/40">
              <Activity size={16} className="text-sky-500" />
              <span className="text-xs font-bold uppercase tracking-widest">{workout.totalExercicios} Exercícios</span>
            </div>
          </div>
        </div>

        <button 
          onClick={onStart}
          className="relative group/btn overflow-hidden px-10 py-6 bg-sky-500 text-black font-black uppercase italic tracking-[0.2em] text-xs rounded-3xl shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:scale-105 active:scale-95 transition-all w-full lg:w-auto overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
          <span className="relative z-10 flex items-center justify-center gap-3">
            <Play size={18} fill="currentColor" /> Iniciar treino
          </span>
        </button>
      </div>
    </motion.div>
  );
};
