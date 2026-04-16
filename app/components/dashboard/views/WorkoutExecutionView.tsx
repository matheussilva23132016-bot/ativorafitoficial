"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, 
  Circle, 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronLeft, 
  Info, 
  Trophy,
  Zap,
  Timer
} from "lucide-react";
import confetti from "canvas-confetti";

interface Exercise {
  id: string;
  nome: string;
  series: number;
  reps: string;
  descanso: string;
  videoUrl?: string;
  observacoes?: string;
}

interface WorkoutExecutionViewProps {
  treinoId: string;
  onClose: () => void;
  onComplete: (data: any) => void;
}

export const WorkoutExecutionView = ({ treinoId, onClose, onComplete }: WorkoutExecutionViewProps) => {
  const [loading, setLoading] = useState(true);
  const [workout, setWorkout] = useState<any>(null);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isFinishing, setIsFinishing] = useState(false);

  // -- FETCH DE DADOS REAIS --
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await fetch(`/api/treinos/detalhes?treinoId=${treinoId}`);
        const json = await res.json();
        if (json.success) setWorkout(json.data);
      } catch (err) {
        console.error("Erro ao carregar treino:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [treinoId]);

  // -- TIMER DE DESCANSO --
  useEffect(() => {
    let interval: any;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setTimerActive(false);
      // Aqui poderíamos tocar um bipe sutil "Ativora"
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const startTimer = (seconds?: number) => {
    setTimeLeft(seconds || 60);
    setTimerActive(true);
  };

  const toggleExercise = (id: string) => {
    setCompletedExercises(prev => 
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
    if (!completedExercises.includes(id)) {
      startTimer(60); // Inicia descanso automático ao marcar
    }
  };

  const handleFinish = async () => {
    setIsFinishing(true);
    // Simulação de confirmação final
    const confirmed = window.confirm("Treino concluído? Seu progresso será salvo.");
    if (confirmed) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#0EA5E9", "#FFFFFF", "#020617"]
      });
      
      onComplete({
        treinoId,
        exerciciosConcluidos: completedExercises.length,
        totalExercicios: workout.exercicios.length,
        nota: 5
      });
    } else {
      setIsFinishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] gap-4">
        <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Carregando treino...</span>
      </div>
    );
  }

  const progress = Math.round((completedExercises.length / (workout?.exercicios?.length || 1)) * 100);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -50 }}
      className="max-w-4xl mx-auto space-y-8 pb-20"
    >
      {/* HEADER DA SESSÃO */}
      <div className="flex items-center justify-between">
        <button onClick={onClose} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group">
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Abortar Sessão</span>
        </button>
        <div className="text-right">
          <h2 className="text-2xl font-black italic uppercase text-white tracking-tighter">{workout.titulo}</h2>
          <p className="text-[10px] font-bold text-sky-500 uppercase tracking-widest">{workout.foco}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* COLUNA DA ESQUERDA: LISTA DE EXERCÍCIOS */}
        <div className="lg:col-span-2 space-y-4">
          {workout.exercicios.map((ex: Exercise, idx: number) => (
            <motion.div 
              key={ex.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => toggleExercise(ex.id)}
              className={`p-6 rounded-[32px] border transition-all cursor-pointer flex items-center justify-between group 
                ${completedExercises.includes(ex.id) 
                  ? 'bg-sky-500/10 border-sky-500/30' 
                  : 'bg-white/5 border-white/5 hover:border-white/20'}`}
            >
              <div className="flex items-center gap-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black italic text-lg transition-colors
                  ${completedExercises.includes(ex.id) ? 'bg-sky-500 text-black' : 'bg-white/5 text-white/20'}`}>
                  {idx + 1}
                </div>
                <div>
                  <h4 className={`text-sm font-black uppercase italic tracking-tighter transition-colors 
                    ${completedExercises.includes(ex.id) ? 'text-sky-400' : 'text-white'}`}>
                    {ex.nome}
                  </h4>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">
                    {ex.series} Séries × {ex.reps} • {ex.descanso}
                  </p>
                </div>
              </div>

              {completedExercises.includes(ex.id) ? (
                <CheckCircle2 className="text-sky-500" size={28} />
              ) : (
                <Circle className="text-white/10 group-hover:text-white/30 transition-colors" size={28} />
              )}
            </motion.div>
          ))}
        </div>

        {/* COLUNA DA DIREITA: MONITOR DE STATUS & TIMER */}
        <div className="space-y-6">
          {/* TIMER DE DESCANSO */}
          <div className="p-8 bg-[#050B14] border border-white/10 rounded-[40px] text-center relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-white/5 overflow-hidden">
              <motion.div 
                className="h-full bg-sky-500" 
                initial={{ width: "100%" }}
                animate={{ width: timerActive ? "0%" : "100%" }}
                transition={{ duration: timeLeft, ease: "linear" }}
                key={timeLeft}
              />
            </div>
            
            <Timer className="mx-auto text-sky-500/50 mb-4" size={24} />
            <div className="text-5xl font-black italic text-white tabular-nums tracking-tighter">
              00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
            </div>
            <p className="text-[9px] font-black uppercase text-white/20 tracking-[0.3em] mt-2 mb-6">Tempo de Descanso</p>
            
            <div className="flex items-center justify-center gap-4">
              <button 
                onClick={() => setTimerActive(!timerActive)}
                className="p-4 bg-white/5 rounded-2xl text-white hover:bg-white/10 transition-all"
              >
                {timerActive ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <button 
                onClick={() => { setTimeLeft(60); setTimerActive(false); }}
                className="p-4 bg-white/5 rounded-2xl text-white hover:bg-white/10 transition-all"
              >
                <RotateCcw size={20} />
              </button>
            </div>
          </div>

          {/* PROGRESSO DA SESSÃO */}
          <div className="p-8 bg-sky-500/5 border border-sky-500/10 rounded-[40px]">
             <div className="flex justify-between items-end mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-sky-500">Progresso</span>
                <span className="text-xl font-black text-white italic">{progress}%</span>
             </div>
             <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.5)]"
                />
             </div>
             <div className="mt-6 flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                <Zap size={16} className="text-sky-500 font-bold" />
                <span className="text-[9px] font-bold text-white/60 uppercase leading-snug">
                  Finalize para ganhar <span className="text-white font-black">+150 XP</span>
                </span>
             </div>
          </div>

          <button 
            disabled={progress < 100 || isFinishing}
            onClick={handleFinish}
            className={`w-full py-6 rounded-[32px] font-black uppercase italic tracking-[0.3em] text-xs transition-all flex items-center justify-center gap-3
              ${progress === 100 
                ? 'bg-sky-500 text-black shadow-neon hover:scale-105 active:scale-95' 
                : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'}`}
          >
            <Trophy size={18} fill={progress === 100 ? "currentColor" : "none"} />
            Finalizar Sessão
          </button>
        </div>
      </div>
    </motion.div>
  );
};
