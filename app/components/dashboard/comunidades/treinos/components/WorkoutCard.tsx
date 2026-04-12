// app/components/dashboard/comunidades/treinos/components/WorkoutCard.tsx
"use client";

import { Eye, Pencil, Trash2, Copy, Send, MoreVertical } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Treino } from "../types";
import { FocoBadge } from "./FocoBadge";
import { totalExercicios, percentualConcluido } from "../utils";

interface Props {
  treino: Treino;
  isGestao?: boolean;
  onView: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onPublish?: () => void;
  onIniciar?: () => void;
}

export function WorkoutCard({
  treino, isGestao,
  onView, onEdit, onDelete, onDuplicate, onPublish, onIniciar,
}: Props) {
  const [menu, setMenu] = useState(false);
  const pct = percentualConcluido(treino);
  const total = totalExercicios(treino);
  const isPublished = treino.status === "published";

  return (
    <div className="relative bg-[#0a0e18] border border-white/5 rounded-[22px] p-5
      hover:border-white/10 transition-all group">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          {/* Dia badge */}
          <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/5 flex flex-col
            items-center justify-center shrink-0">
            <span className="text-[9px] font-black uppercase text-white/30 leading-none">
              {treino.dia.substring(0, 3).toUpperCase()}
            </span>
            {treino.letra && (
              <span className="text-[11px] font-black italic text-white/60 leading-none mt-0.5">
                {treino.letra}
              </span>
            )}
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-black italic uppercase text-white leading-tight truncate
              group-hover:text-sky-400 transition-colors">
              {treino.titulo || "Sem título"}
            </h3>
            <div className="mt-1">
              <FocoBadge foco={treino.foco} size="xs" />
            </div>
          </div>
        </div>

        {/* Status + menu */}
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border
            ${isPublished
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-white/5 border-white/5 text-white/20"}`}>
            {isPublished ? "Publicado" : "Rascunho"}
          </span>

          {isGestao && (
            <div className="relative">
              <button
                onClick={() => setMenu(p => !p)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-white/20 hover:text-white/60
                  transition-all">
                <MoreVertical size={14} />
              </button>

              <AnimatePresence>
                {menu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      className="absolute right-0 top-8 z-20 bg-[#0d1117] border border-white/10
                        rounded-2xl p-1.5 min-w-[160px] shadow-2xl">
                      {[
                        { icon: Eye,    label: "Visualizar",  fn: onView,      color: "" },
                        { icon: Pencil, label: "Editar",      fn: onEdit,      color: "" },
                        { icon: Copy,   label: "Duplicar",    fn: onDuplicate, color: "" },
                        ...(!isPublished ? [{ icon: Send, label: "Publicar", fn: onPublish, color: "text-emerald-400" }] : []),
                        { icon: Trash2, label: "Remover",     fn: onDelete,    color: "text-rose-400" },
                      ].map(item => (
                        <button
                          key={item.label}
                          onClick={() => { item.fn?.(); setMenu(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                            text-[10px] font-black uppercase hover:bg-white/5 transition-all
                            ${item.color || "text-white/40 hover:text-white/80"}`}>
                          <item.icon size={13} />
                          {item.label}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Grupos */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {treino.grupos.map(g => (
          <span key={g.id}
            className="text-[8px] bg-white/5 border border-white/5 px-2 py-0.5
              rounded-full text-white/25 font-bold">
            {g.nome || "Grupo"}
          </span>
        ))}
        {treino.cardio && (
          <span className="text-[8px] bg-orange-500/10 border border-orange-500/20
            px-2 py-0.5 rounded-full text-orange-400 font-bold">
            🔥 {treino.cardio.tipo}
          </span>
        )}
      </div>

      {/* Progresso (aluno) */}
      {!isGestao && pct > 0 && (
        <div className="mb-4 space-y-1.5">
          <div className="flex justify-between text-[8px] font-black uppercase text-white/20">
            <span>Progresso</span>
            <span>{pct}%</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-500 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <span className="text-[9px] text-white/20 font-bold">
          {total} exercício{total !== 1 ? "s" : ""}
        </span>

        <div className="flex gap-2">
          <button
            onClick={onView}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5
              hover:bg-white/10 text-[9px] font-black uppercase text-white/40
              hover:text-white/80 transition-all">
            <Eye size={11} /> Ver
          </button>
          {!isGestao && onIniciar && isPublished && (
            <button
              onClick={onIniciar}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500
                text-black text-[9px] font-black uppercase hover:bg-sky-400
                transition-all shadow-lg">
              Iniciar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
