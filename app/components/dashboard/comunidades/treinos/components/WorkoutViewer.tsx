// app/components/dashboard/comunidades/treinos/components/WorkoutViewer.tsx
"use client";

import {
  ArrowLeft, Play, ExternalLink, CheckCircle2,
  Circle, Pencil, Zap, Clock, RotateCcw, Download,
} from "lucide-react";
import { motion } from "framer-motion";
import type { Treino } from "../types";
import { FocoBadge } from "./FocoBadge";
import { percentualConcluido, totalExercicios } from "../utils";

interface Props {
  treino: Treino;
  isGestao?: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onIniciar?: () => void;
  onToggleExercicio?: (exercicioId: string) => void;
  pdfUrl?: string;
}

export function WorkoutViewer({
  treino, isGestao, pdfUrl,
  onClose, onEdit, onIniciar, onToggleExercicio,
}: Props) {
  const pct   = percentualConcluido(treino);
  const total = totalExercicios(treino);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-[9px] font-black uppercase text-white/20
            hover:text-white/60 transition-all">
          <ArrowLeft size={14} /> Voltar
        </button>
        <div className="flex gap-2">
          {pdfUrl && (
            <a
              href={pdfUrl}
              download
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20
                rounded-xl text-[9px] font-black uppercase text-emerald-300 hover:bg-emerald-500/20
                transition-all"
            >
              <Download size={12} /> PDF offline
            </a>
          )}
          {isGestao && onEdit && (
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10
                rounded-xl text-[9px] font-black uppercase text-white/40 hover:text-white
                hover:border-white/20 transition-all">
              <Pencil size={12} /> Editar
            </button>
          )}
          {!isGestao && onIniciar && (
            <button
              onClick={onIniciar}
              className="flex items-center gap-2 px-5 py-2 bg-sky-500 text-black rounded-xl
                text-[9px] font-black uppercase hover:bg-sky-400 transition-all shadow-lg">
              <Zap size={12} fill="currentColor" /> Iniciar
            </button>
          )}
        </div>
      </div>

      {/* Hero */}
      <div className="bg-[#0a0e18] border border-white/5 rounded-[28px] p-7 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <FocoBadge foco={treino.foco} size="md" />
          <span className="text-[9px] font-black uppercase text-white/20 border-l
            border-white/10 pl-3">
            {treino.dia} {treino.letra ? `· Treino ${treino.letra}` : ""}
          </span>
        </div>

        <h2 className="text-4xl sm:text-5xl font-black italic uppercase tracking-tighter
          text-white leading-none">
          {treino.titulo}
        </h2>

        {treino.obs && (
          <p className="text-sm text-white/30 italic border-l-2 border-sky-500/20 pl-4">
            {treino.obs}
          </p>
        )}

        {/* Stats */}
        <div className="flex flex-wrap gap-4 pt-2">
          {[
            { label: "Exercícios", value: total },
            { label: "Grupos", value: treino.grupos.length },
            ...(treino.cardio ? [{ label: "Cardio", value: treino.cardio.duracao }] : []),
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-black text-white">{s.value}</p>
              <p className="text-[8px] font-black uppercase text-white/20 tracking-widest">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Barra de progresso */}
        {pct > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-[8px] font-black uppercase text-white/20">
              <span>Progresso</span>
              <span className="text-sky-400">{pct}%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                className="h-full bg-sky-500 rounded-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* Grupos de exercícios */}
      <div className="space-y-4">
        {treino.grupos.map((grupo, gi) => (
          <div key={grupo.id}
            className="bg-[#0a0e18] border border-white/5 rounded-[22px] overflow-hidden">

            {/* Header do grupo */}
            <div className="px-5 py-3 border-b border-white/5 flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center
                text-[9px] font-black text-white/30">
                {gi + 1}
              </div>
              <h4 className="text-xs font-black uppercase text-white/60">
                {grupo.nome || "Grupo"}
              </h4>
              <span className="ml-auto text-[8px] text-white/20 font-bold">
                {grupo.exercicios.length} ex.
              </span>
            </div>

            {/* Exercícios */}
            <div className="divide-y divide-white/5">
              {grupo.exercicios.map(ex => (
                <div key={ex.id}
                  className="px-5 py-4 flex items-start gap-4 hover:bg-white/[0.02]
                    transition-colors">

                  {/* Toggle concluído */}
                  {onToggleExercicio && (
                    <button
                      onClick={() => onToggleExercicio(ex.id)}
                      className="mt-0.5 shrink-0 transition-all">
                      {ex.concluido
                        ? <CheckCircle2 size={18} className="text-sky-400" />
                        : <Circle size={18} className="text-white/15 hover:text-white/40" />}
                    </button>
                  )}

                  <div className="flex-1 min-w-0 space-y-2">
                    <p className={`text-sm font-black uppercase italic leading-tight
                      ${ex.concluido ? "line-through text-white/20" : "text-white"}`}>
                      {ex.nome}
                    </p>

                    {/* Chips de info */}
                    <div className="flex flex-wrap gap-2">
                      {[
                        { icon: RotateCcw, label: `${ex.series}x${ex.repeticoes}` },
                        { icon: Clock,     label: ex.descanso },
                      ].map(chip => (
                        <span key={chip.label}
                          className="inline-flex items-center gap-1 text-[8px] font-black
                            uppercase bg-white/5 border border-white/5 px-2 py-0.5
                            rounded-full text-white/30">
                          <chip.icon size={9} />
                          {chip.label}
                        </span>
                      ))}
                    </div>

                    {ex.obs && (
                      <p className="text-[10px] text-white/25 italic">{ex.obs}</p>
                    )}

                    {/* Links de vídeo */}
                    <div className="flex flex-wrap gap-2">
                      {ex.videoUrl && (
                        <a href={ex.videoUrl} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-[8px] font-black
                            uppercase text-sky-400 hover:text-sky-300 transition-colors">
                          <Play size={9} fill="currentColor" /> Vídeo do instrutor
                        </a>
                      )}
                      {ex.linkExterno && (
                        <a href={ex.linkExterno} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-[8px] font-black
                            uppercase text-purple-400 hover:text-purple-300 transition-colors">
                          <ExternalLink size={9} /> Demonstração
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Cardio */}
      {treino.cardio && (
        <div className="bg-orange-500/5 border border-orange-500/20 rounded-[22px] p-5
          flex items-center gap-4">
          <div className="text-3xl">🔥</div>
          <div>
            <p className="text-sm font-black uppercase italic text-orange-400">
              {treino.cardio.tipo}
            </p>
            <p className="text-[9px] text-white/30 font-bold uppercase mt-1">
              {treino.cardio.duracao} · {treino.cardio.intensidade}
              {treino.cardio.obs ? ` · ${treino.cardio.obs}` : ""}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
