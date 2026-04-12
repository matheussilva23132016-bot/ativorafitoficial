// app/components/dashboard/comunidades/treinos/components/WorkoutExecution.tsx
"use client";

import {
  ArrowLeft, CheckCircle2, Circle, Trophy,
  ChevronLeft, ChevronRight, Play, ExternalLink,
  Clock, RotateCcw,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Treino } from "../types";
import { FocoBadge } from "./FocoBadge";
import { percentualConcluido, totalExercicios } from "../utils";

interface Props {
  treino: Treino;
  onClose: () => void;
  onConcluir: () => void;
  onToggleExercicio: (exercicioId: string) => void;
}

export function WorkoutExecution({ treino, onClose, onConcluir, onToggleExercicio }: Props) {
  const [grupoAtual, setGrupoAtual] = useState(0);
  const [timer, setTimer]           = useState(0);
  const [timerAtivo, setTimerAtivo] = useState(false);
  const [concluido, setConcluido]   = useState(false);

  const pct   = percentualConcluido(treino);
  const total = totalExercicios(treino);
  const grupo = treino.grupos[grupoAtual];

  // Timer de descanso
  useEffect(() => {
    if (!timerAtivo || timer <= 0) {
      if (timer <= 0) setTimerAtivo(false);
      return;
    }
    const id = setInterval(() => setTimer(p => p - 1), 1000);
    return () => clearInterval(id);
  }, [timerAtivo, timer]);

  const iniciarTimer = useCallback((segundos: number) => {
    setTimer(segundos);
    setTimerAtivo(true);
  }, []);

  const parseSeg = (s: string) => {
    const n = parseInt(s);
    return isNaN(n) ? 60 : n;
  };

  const handleConcluir = () => {
    setConcluido(true);
    onConcluir();
  };

  if (concluido) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-24 text-center space-y-6">
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}>
          <Trophy size={72} className="text-yellow-400" />
        </motion.div>
        <div className="space-y-2">
          <h2 className="text-5xl font-black italic uppercase text-white tracking-tighter">
            TREINO CONCLUÍDO!
          </h2>
          <p className="text-white/30 text-sm font-bold uppercase tracking-widest">
            {total} exercícios · {treino.titulo}
          </p>
        </div>
        <button
          onClick={onClose}
          className="px-8 py-3 bg-sky-500 text-black rounded-2xl font-black uppercase
            text-sm hover:bg-sky-400 transition-all shadow-lg">
          Voltar ao Dashboard
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-[9px] font-black uppercase
            text-white/20 hover:text-white/60 transition-all">
          <ArrowLeft size={14} /> Pausar
        </button>
        <FocoBadge foco={treino.foco} />
      </div>

      {/* Progresso geral */}
      <div className="bg-[#0a0e18] border border-white/5 rounded-[22px] p-5 space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-black italic uppercase text-white tracking-tight">
            {treino.titulo}
          </h2>
          <span className="text-2xl font-black text-sky-400">{pct}%</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            animate={{ width: `${pct}%` }}
            transition={{ type: "spring", stiffness: 60 }}
            className="h-full bg-sky-500 rounded-full"
          />
        </div>
        <p className="text-[9px] text-white/20 font-bold uppercase">
          Grupo {grupoAtual + 1} de {treino.grupos.length}
        </p>
      </div>

      {/* Timer de descanso */}
      <AnimatePresence>
        {timerAtivo && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-sky-500/10 border border-sky-500/20 rounded-[22px] p-5
              flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock size={20} className="text-sky-400" />
              <div>
                <p className="text-[9px] font-black uppercase text-sky-400/60 tracking-widest">
                  Descanso
                </p>
                <p className="text-3xl font-black text-sky-400 tabular-nums">{timer}s</p>
              </div>
            </div>
            <button
              onClick={() => setTimerAtivo(false)}
              className="px-4 py-2 bg-sky-500/20 rounded-xl text-[9px] font-black
                uppercase text-sky-400 hover:bg-sky-500/30 transition-all">
              Pular
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navegação de grupos */}
      <div className="flex items-center gap-3">
        <button
          disabled={grupoAtual === 0}
          onClick={() => setGrupoAtual(p => p - 1)}
          className="p-3 bg-white/5 rounded-xl text-white/20 hover:text-white/60
            disabled:opacity-20 transition-all">
          <ChevronLeft size={18} />
        </button>

        <div className="flex-1 bg-[#0a0e18] border border-white/5 rounded-[22px]
          px-5 py-3 text-center">
          <p className="text-xs font-black italic uppercase text-white">
            {grupo?.nome || `Grupo ${grupoAtual + 1}`}
          </p>
        </div>

        <button
          disabled={grupoAtual === treino.grupos.length - 1}
          onClick={() => setGrupoAtual(p => p + 1)}
          className="p-3 bg-white/5 rounded-xl text-white/20 hover:text-white/60
            disabled:opacity-20 transition-all">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Exercícios do grupo atual */}
      <div className="space-y-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={grupoAtual}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3">
            {grupo?.exercicios.map(ex => (
              <div key={ex.id}
                className={`bg-[#0a0e18] border rounded-[18px] p-4 transition-all
                  ${ex.concluido
                    ? "border-sky-500/20 bg-sky-500/5"
                    : "border-white/5 hover:border-white/10"}`}>
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => {
                      onToggleExercicio(ex.id);
                      if (!ex.concluido) iniciarTimer(parseSeg(ex.descanso));
                    }}
                    className="mt-0.5 shrink-0 transition-all">
                    {ex.concluido
                      ? <CheckCircle2 size={22} className="text-sky-400" />
                      : <Circle size={22} className="text-white/15 hover:text-white/40" />}
                  </button>

                  <div className="flex-1 min-w-0 space-y-2">
                    <p className={`text-sm font-black italic uppercase leading-tight
                      ${ex.concluido ? "line-through text-white/20" : "text-white"}`}>
                      {ex.nome}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 text-[8px] font-black
                        uppercase bg-white/5 border border-white/5 px-2 py-0.5
                        rounded-full text-white/30">
                        <RotateCcw size={9} />
                        {ex.series}×{ex.repeticoes}
                      </span>
                      <button
                        onClick={() => iniciarTimer(parseSeg(ex.descanso))}
                        className="inline-flex items-center gap-1 text-[8px] font-black
                          uppercase bg-white/5 border border-white/5 px-2 py-0.5
                          rounded-full text-white/30 hover:border-sky-500/30
                          hover:text-sky-400 transition-all">
                        <Clock size={9} />
                        {ex.descanso}
                      </button>
                    </div>

                    {ex.obs && (
                      <p className="text-[10px] text-white/25 italic">{ex.obs}</p>
                    )}

                    <div className="flex flex-wrap gap-3">
                      {ex.videoUrl && (
                        <a href={ex.videoUrl} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-[8px] font-black
                            uppercase text-sky-400 hover:text-sky-300 transition-colors">
                          <Play size={9} fill="currentColor" /> Vídeo
                        </a>
                      )}
                      {ex.linkExterno && (
                        <a href={ex.linkExterno} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-[8px] font-black
                            uppercase text-purple-400 hover:text-purple-300 transition-colors">
                          <ExternalLink size={9} /> Demo
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Cardio */}
      {treino.cardio && grupoAtual === treino.grupos.length - 1 && (
        <div className="bg-orange-500/5 border border-orange-500/20 rounded-[22px] p-5
          flex items-center gap-4">
          <span className="text-3xl">🔥</span>
          <div>
            <p className="text-sm font-black uppercase italic text-orange-400">
              {treino.cardio.tipo} · {treino.cardio.duracao}
            </p>
            <p className="text-[9px] text-white/30 font-bold uppercase mt-0.5">
              {treino.cardio.intensidade}
              {treino.cardio.obs ? ` · ${treino.cardio.obs}` : ""}
            </p>
          </div>
        </div>
      )}

      {/* Botão concluir */}
      {pct === 100 && (
        <motion.button
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          onClick={handleConcluir}
          className="w-full py-5 bg-emerald-500 text-black rounded-2xl font-black
            uppercase text-sm shadow-lg hover:bg-emerald-400 transition-all
            flex items-center justify-center gap-3">
          <Trophy size={18} /> CONCLUIR TREINO
        </motion.button>
      )}
    </div>
  );
}
