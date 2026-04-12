// app/components/dashboard/comunidades/treinos/components/IAAssistente.tsx
"use client";

import { BrainCircuit, RefreshCw, Sparkles, Check } from "lucide-react";
import { useState } from "react";
import type { FocoTreino, SolicitacaoTreino } from "../types";
import { FOCOS_LIST } from "../constants";

interface Props {
  gerandoIA: boolean;
  onGerar: (foco: FocoTreino, solicitacaoId?: string) => void;
  solicitacao?: SolicitacaoTreino;
  onClose?: () => void;
}

export function IAAssistente({ gerandoIA, onGerar, solicitacao, onClose }: Props) {
  const [focoSelecionado, setFocoSelecionado] = useState<FocoTreino>(
    solicitacao?.foco ?? "hipertrofia"
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20
            flex items-center justify-center">
            <BrainCircuit size={18} className="text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-black italic uppercase text-white leading-none">
              Assistente IA
            </h3>
            <p className="text-[9px] text-white/25 font-bold uppercase tracking-widest mt-0.5">
              Sugestão de base — você revisa antes de publicar
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[9px] font-black uppercase text-white/20
              hover:text-white/60 transition-all">
            Fechar
          </button>
        )}
      </div>

      {/* Solicitação vinculada */}
      {solicitacao && (
        <div className="bg-purple-500/5 border border-purple-500/15 rounded-2xl p-4
          flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20
            flex items-center justify-center font-black text-base italic uppercase
            text-purple-400 shrink-0">
            {solicitacao.alunoNome.charAt(0)}
          </div>
          <div>
            <p className="text-xs font-black italic uppercase text-white/70">
              {solicitacao.alunoNome}
            </p>
            <p className="text-[8px] text-white/25 font-bold uppercase tracking-widest">
              Solicitou · {FOCOS_LIST.find(f => f.id === solicitacao.foco)?.label}
            </p>
          </div>
        </div>
      )}

      {/* Seleção de foco */}
      <div className="space-y-3">
        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20 italic">
          Foco do Treino
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {FOCOS_LIST.map((f) => {
            const ativo = focoSelecionado === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFocoSelecionado(f.id)}
                disabled={!!solicitacao}
                className={`p-3.5 rounded-2xl border transition-all text-left
                  flex items-center gap-2.5 disabled:cursor-default
                  ${ativo
                    ? `${f.bg} ${f.border}`
                    : "bg-white/5 border-white/5 hover:border-white/10"}`}>
                <f.icon size={13} className={ativo ? f.cor : "text-white/20"} />
                <span className={`text-[9px] font-black uppercase flex-1
                  ${ativo ? f.cor : "text-white/30"}`}>
                  {f.label}
                </span>
                {ativo && <Check size={11} className={f.cor} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Aviso */}
      <div className="bg-white/2 border border-white/5 rounded-2xl p-4 space-y-1">
        <p className="text-[9px] font-black uppercase text-white/30 tracking-widest">
          Como funciona
        </p>
        <ul className="space-y-1.5">
          {[
            "A IA gera uma base de treino com exercícios, séries e repetições",
            "Você pode editar, remover ou adicionar exercícios livremente",
            "O treino só fica visível ao aluno após sua validação e publicação",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-[10px] text-white/25">
              <span className="text-purple-400 font-black mt-0.5">·</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Botão gerar */}
      <button
        onClick={() => onGerar(focoSelecionado, solicitacao?.id)}
        disabled={gerandoIA}
        className="w-full py-4 bg-purple-500 text-white rounded-2xl font-black uppercase
          text-xs shadow-lg hover:bg-purple-400 transition-all flex items-center
          justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed">
        {gerandoIA
          ? <><RefreshCw size={14} className="animate-spin" /> Gerando sugestão...</>
          : <><Sparkles size={14} /> Gerar Sugestão com IA</>}
      </button>
    </div>
  );
}
