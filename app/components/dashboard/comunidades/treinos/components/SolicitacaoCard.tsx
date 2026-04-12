// app/components/dashboard/comunidades/treinos/components/SolicitacaoCard.tsx
"use client";

import { Sparkles, Pencil, X, Clock } from "lucide-react";
import type { SolicitacaoTreino } from "../types";
import { FOCOS } from "../constants";

interface Props {
  solicitacao: SolicitacaoTreino;
  gerandoIA: boolean;
  onGerarIA: () => void;
  onMontarManual: () => void;
  onDescartar: () => void;
}

export function SolicitacaoCard({
  solicitacao, gerandoIA,
  onGerarIA, onMontarManual, onDescartar,
}: Props) {
  const foco = FOCOS[solicitacao.foco];

  return (
    <div className="bg-[#0a0e18] border border-purple-500/20 rounded-[22px] p-5
      flex flex-col sm:flex-row items-start sm:items-center gap-4">

      {/* Avatar + info */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20
          flex items-center justify-center font-black text-xl italic uppercase
          text-purple-400 shrink-0">
          {solicitacao.alunoNome.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black italic uppercase text-white truncate">
            {solicitacao.alunoNome}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {foco && (
              <span className={`inline-flex items-center gap-1 text-[8px] font-black
                uppercase px-2 py-0.5 rounded-full border ${foco.bg} ${foco.border} ${foco.cor}`}>
                <foco.icon size={9} /> {foco.label}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-[8px] font-bold
              uppercase text-white/20">
              <Clock size={9} />
              {new Date(solicitacao.criadoEm).toLocaleDateString("pt-BR")}
            </span>
          </div>
          {solicitacao.obs && (
            <p className="text-[10px] text-white/25 italic mt-1 truncate">
              "{solicitacao.obs}"
            </p>
          )}
        </div>
      </div>

      {/* Ações */}
      <div className="flex gap-2 shrink-0 w-full sm:w-auto">
        <button
          onClick={onGerarIA}
          disabled={gerandoIA}
          title="Gerar sugestão com IA"
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5
            bg-purple-500/10 border border-purple-500/20 rounded-xl text-[9px] font-black
            uppercase text-purple-400 hover:bg-purple-500/20 disabled:opacity-40
            transition-all">
          <Sparkles size={12} />
          <span className="sm:hidden">IA</span>
          <span className="hidden sm:block">Sugerir com IA</span>
        </button>
        <button
          onClick={onMontarManual}
          title="Montar manualmente"
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5
            bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase
            text-white/40 hover:text-white hover:border-white/20 transition-all">
          <Pencil size={12} />
          <span className="sm:hidden">Manual</span>
          <span className="hidden sm:block">Montar</span>
        </button>
        <button
          onClick={onDescartar}
          title="Descartar"
          className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-white/15
            hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20
            transition-all">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
