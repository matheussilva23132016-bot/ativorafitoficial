// app/components/dashboard/comunidades/nutricao/components/FormSolicitacao.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, ChevronRight, ChevronLeft,
  CheckCircle2, Loader2, X,
} from "lucide-react";
import type { FocoNutricional, MedidasCorporais } from "../types";
import { FOCOS_NUTRICAO, RESTRICOES_COMUNS } from "../constants";
import { FormDadosCorporais } from "./FormDadosCorporais";
import { EstimativaCorpo   } from "./EstimativaCorpo";
import type { EnviarSolicitacaoInput } from "../hooks/useNutricao";

interface Props {
  communityId: string;
  alunoId:     string;
  alunoNome:   string;
  onEnviar:    (input: EnviarSolicitacaoInput) => Promise<void>;
  onCancel?:   () => void;
}

type Etapa = "foco" | "objetivo" | "medidas" | "revisao";
const ETAPAS: Etapa[] = ["foco", "objetivo", "medidas", "revisao"];
const ETAPA_LABEL: Record<Etapa, string> = {
  foco: "Foco", objetivo: "Objetivo", medidas: "Medidas", revisao: "Revisão",
};

export function FormSolicitacao({
  communityId, alunoId, alunoNome, onEnviar, onCancel,
}: Props) {
  const [etapa,           setEtapa]           = useState<Etapa>("foco");
  const [foco,            setFoco]            = useState<FocoNutricional | null>(null);
  const [objetivo,        setObjetivo]        = useState("");
  const [restricoes,      setRestricoes]      = useState<string[]>([]);
  const [restricaoCustom, setRestricaoCustom] = useState("");
  const [medidas,         setMedidas]         = useState<MedidasCorporais | null>(null);
  const [enviando,        setEnviando]        = useState(false);
  const [enviado,         setEnviado]         = useState(false);

  const etapaIdx = ETAPAS.indexOf(etapa);

  const avancar = () => { const n = ETAPAS[etapaIdx + 1]; if (n) setEtapa(n); };
  const voltar  = () => { const p = ETAPAS[etapaIdx - 1]; if (p) setEtapa(p); };

  const podeAvancar = (): boolean => {
    if (etapa === "foco")     return !!foco;
    if (etapa === "objetivo") return objetivo.trim().length >= 10;
    return true;
  };

  const toggleRestricao = (r: string) =>
    setRestricoes(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);

  const addCustomRestricao = () => {
    const val = restricaoCustom.trim();
    if (val && !restricoes.includes(val)) {
      setRestricoes(prev => [...prev, val]);
      setRestricaoCustom("");
    }
  };

  const handleEnviar = async () => {
    if (!foco) return;
    setEnviando(true);
    try {
      await onEnviar({
        communityId,
        alunoId,
        alunoNome,
        foco,
        objetivo,
        restricoes,
        medidas: medidas ? {
          alunoId:  alunoId,          // garante o ID correto
          data:     medidas.data,
          sexo:     medidas.sexo,
          peso:     medidas.peso,
          altura:   medidas.altura,
          cintura:  medidas.cintura,
          quadril:  medidas.quadril,
          pescoco:  medidas.pescoco,
        } : undefined,
      });
      setEnviado(true);
    } finally {
      setEnviando(false);
    }
  };

  // ── Sucesso ───────────────────────────────────────────────────
  if (enviado) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1    }}
        className="flex flex-col items-center justify-center gap-5 py-12 px-6 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-emerald-500/10
          border border-emerald-500/20 flex items-center justify-center">
          <CheckCircle2 size={32} className="text-emerald-500" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-black italic uppercase text-white tracking-tighter">
            Solicitação <span className="text-emerald-500">Enviada</span>
          </h3>
          <p className="text-xs text-white/30 max-w-xs leading-relaxed">
            O profissional responsável foi notificado e irá montar seu cardápio em breve.
          </p>
        </div>
        <div className="flex flex-col gap-2 w-full max-w-xs">
          {[
            { label: "Foco",       val: FOCOS_NUTRICAO.find(f => f.id === foco)?.label },
            { label: "Objetivo",   val: objetivo },
            { label: "Medidas",    val: medidas ? "Enviadas ✓" : "Não informadas" },
            { label: "Restrições", val: restricoes.length > 0 ? restricoes.join(", ") : "Nenhuma" },
          ].map(item => (
            <div key={item.label}
              className="flex justify-between items-start gap-3 text-left
                bg-white/5 rounded-xl px-3 py-2">
              <span className="text-[8px] font-black uppercase tracking-widest
                text-white/20 shrink-0">
                {item.label}
              </span>
              <span className="text-[10px] font-bold text-white/50 text-right line-clamp-1">
                {item.val}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between">
          {ETAPAS.map((e, i) => (
            <div key={e} className="flex flex-col items-center gap-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center
                text-[8px] font-black transition-all
                ${i < etapaIdx
                  ? "bg-emerald-500 text-black"
                  : i === etapaIdx
                    ? "bg-sky-500 text-black"
                    : "bg-white/5 text-white/20"
                }`}>
                {i < etapaIdx ? "✓" : i + 1}
              </div>
              <span className={`text-[7px] font-black uppercase tracking-widest
                ${i === etapaIdx ? "text-sky-400" : "text-white/15"}`}>
                {ETAPA_LABEL[e]}
              </span>
            </div>
          ))}
        </div>
        <div className="w-full h-0.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            animate={{ width: `${(etapaIdx / (ETAPAS.length - 1)) * 100}%` }}
            transition={{ duration: 0.4 }}
            className="h-full bg-sky-500 rounded-full"
          />
        </div>
      </div>

      {/* Conteúdo da etapa */}
      <AnimatePresence mode="wait">
        <motion.div
          key={etapa}
          initial={{ opacity: 0, x: 20  }}
          animate={{ opacity: 1, x: 0   }}
          exit={{    opacity: 0, x: -20 }}
          transition={{ duration: 0.22 }}
        >

          {/* ETAPA 1 — Foco */}
          {etapa === "foco" && (
            <div className="space-y-3">
              <div className="space-y-0.5">
                <h3 className="text-lg font-black italic uppercase text-white tracking-tighter">
                  Qual é o seu <span className="text-sky-500">foco?</span>
                </h3>
                <p className="text-[10px] text-white/25">
                  Escolha o objetivo principal do seu cardápio.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {FOCOS_NUTRICAO.map(f => (
                  <button
                    key={f.id} type="button" onClick={() => setFoco(f.id)}
                    className={`flex flex-col gap-2 p-4 rounded-2xl border text-left transition-all
                      ${foco === f.id
                        ? `${f.bg} ${f.border} ${f.cor}`
                        : "bg-white/3 border-white/5 text-white/30 hover:border-white/15"
                      }`}
                  >
                    <f.icon size={18} />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest leading-none">
                        {f.label}
                      </p>
                      <p className="text-[8px] text-white/30 mt-0.5 italic">{f.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ETAPA 2 — Objetivo + Restrições */}
          {etapa === "objetivo" && (
            <div className="space-y-5">
              <div className="space-y-0.5">
                <h3 className="text-lg font-black italic uppercase text-white tracking-tighter">
                  Conte seu <span className="text-sky-500">objetivo</span>
                </h3>
                <p className="text-[10px] text-white/25">
                  Quanto mais detalhes, melhor o cardápio.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[8px] font-black uppercase tracking-widest text-white/30">
                  Objetivo detalhado <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={objetivo}
                  onChange={e => setObjetivo(e.target.value)}
                  placeholder="Ex: Quero perder 5kg em 3 meses mantendo massa muscular. Treino 4x por semana..."
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5
                    text-sm text-white/80 outline-none resize-none
                    focus:border-sky-500/40 placeholder:text-white/15
                    transition-all leading-relaxed"
                />
                <p className={`text-[8px] font-bold text-right transition-colors
                  ${objetivo.length < 10 ? "text-white/15" : "text-emerald-500/50"}`}>
                  {objetivo.length} caracteres{objetivo.length < 10 && " (mín. 10)"}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[8px] font-black uppercase tracking-widest text-white/30">
                  Restrições alimentares
                </label>
                <div className="flex flex-wrap gap-2">
                  {RESTRICOES_COMUNS.map(r => (
                    <button
                      key={r} type="button" onClick={() => toggleRestricao(r)}
                      className={`px-3 py-1.5 rounded-xl text-[9px] font-black
                        uppercase tracking-widest border transition-all
                        ${restricoes.includes(r)
                          ? "bg-rose-500/15 border-rose-500/30 text-rose-400"
                          : "bg-white/5 border-white/5 text-white/25 hover:border-white/15"
                        }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <input
                    value={restricaoCustom}
                    onChange={e => setRestricaoCustom(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addCustomRestricao()}
                    placeholder="Outra restrição..."
                    className="flex-1 bg-white/5 border border-white/5 rounded-xl
                      px-3 py-2 text-xs text-white/60 outline-none
                      focus:border-white/20 placeholder:text-white/15"
                  />
                  <button
                    type="button" onClick={addCustomRestricao}
                    className="px-3 py-2 bg-white/5 rounded-xl text-white/30
                      hover:text-white/60 text-xs font-black transition-all"
                  >
                    +
                  </button>
                </div>
                {restricoes.filter(r => !RESTRICOES_COMUNS.includes(r)).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {restricoes.filter(r => !RESTRICOES_COMUNS.includes(r)).map(r => (
                      <span key={r}
                        className="flex items-center gap-1.5 px-2.5 py-1
                          bg-violet-500/10 border border-violet-500/20
                          rounded-xl text-[9px] font-black text-violet-400">
                        {r}
                        <button type="button" onClick={() => toggleRestricao(r)}
                          className="hover:text-rose-400 transition-colors">
                          <X size={9} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ETAPA 3 — Medidas (sem onSalvar — aqui é só para coleta) */}
          {etapa === "medidas" && (
            <div className="space-y-5">
              <div className="space-y-0.5">
                <h3 className="text-lg font-black italic uppercase text-white tracking-tighter">
                  Suas <span className="text-sky-500">medidas</span>
                </h3>
                <p className="text-[10px] text-white/25">
                  Opcional, mas ajuda a personalizar melhor o cardápio.
                </p>
              </div>

              {/* onChange sem onSalvar — botão salvar não aparece aqui */}
              <FormDadosCorporais
                alunoId={alunoId}
                onChange={setMedidas}
              />

              <AnimatePresence>
                {medidas && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{    opacity: 0, y: 8 }}
                  >
                    <EstimativaCorpo medidas={medidas} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* ETAPA 4 — Revisão */}
          {etapa === "revisao" && foco && (
            <div className="space-y-5">
              <div className="space-y-0.5">
                <h3 className="text-lg font-black italic uppercase text-white tracking-tighter">
                  Confirmar <span className="text-sky-500">solicitação</span>
                </h3>
                <p className="text-[10px] text-white/25">
                  Revise antes de enviar para o profissional.
                </p>
              </div>

              <div className="space-y-2">
                {(() => {
                  const f = FOCOS_NUTRICAO.find(x => x.id === foco)!;
                  return (
                    <div className={`flex items-center gap-3 p-4 rounded-2xl border ${f.bg} ${f.border}`}>
                      <f.icon size={18} className={f.cor} />
                      <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-white/30">
                          Foco
                        </p>
                        <p className={`text-sm font-black italic ${f.cor}`}>{f.label}</p>
                      </div>
                    </div>
                  );
                })()}

                <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                  <p className="text-[8px] font-black uppercase tracking-widest text-white/20 mb-1.5">
                    Objetivo
                  </p>
                  <p className="text-xs text-white/50 italic leading-relaxed">{objetivo}</p>
                </div>

                {restricoes.length > 0 && (
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                    <p className="text-[8px] font-black uppercase tracking-widest text-white/20 mb-2">
                      Restrições
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {restricoes.map(r => (
                        <span key={r}
                          className="px-2 py-1 bg-rose-500/10 border border-rose-500/20
                            rounded-lg text-[8px] font-black text-rose-400">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                  <p className="text-[8px] font-black uppercase tracking-widest text-white/20 mb-1.5">
                    Medidas corporais
                  </p>
                  {medidas ? (
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { l: "Peso",    v: `${medidas.peso}kg`    },
                        { l: "Altura",  v: `${medidas.altura}cm`  },
                        { l: "Cintura", v: `${medidas.cintura}cm` },
                        { l: "Quadril", v: `${medidas.quadril}cm` },
                        { l: "IMC",     v: medidas.imc?.toFixed(1) ?? "—" },
                        { l: "Gordura", v: medidas.gorduraEst
                            ? `~${medidas.gorduraEst.toFixed(1)}%` : "—" },
                      ].map(item => (
                        <div key={item.l}>
                          <p className="text-[7px] font-black uppercase tracking-widest text-white/15">
                            {item.l}
                          </p>
                          <p className="text-xs font-black text-white/50 italic">{item.v}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-white/20 italic">Não informadas</p>
                  )}
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* Navegação */}
      <div className="flex gap-3 pt-2">
        {etapaIdx > 0 ? (
          <button type="button" onClick={voltar}
            className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/5
              rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/30
              hover:text-white/60 hover:border-white/15 transition-all">
            <ChevronLeft size={13} /> Voltar
          </button>
        ) : onCancel ? (
          <button type="button" onClick={onCancel}
            className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/5
              rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/30
              hover:text-rose-400 transition-all">
            <X size={13} /> Cancelar
          </button>
        ) : null}

        {etapa !== "revisao" ? (
          <button type="button" onClick={avancar} disabled={!podeAvancar()}
            className="flex-1 flex items-center justify-center gap-2 py-3
              bg-sky-500 text-black rounded-2xl text-[10px] font-black uppercase
              tracking-widest hover:bg-sky-400 active:scale-95 transition-all
              disabled:opacity-30 disabled:cursor-not-allowed">
            Continuar <ChevronRight size={13} />
          </button>
        ) : (
          <button type="button" onClick={handleEnviar} disabled={enviando}
            className="flex-1 flex items-center justify-center gap-2 py-3
              bg-emerald-500 text-black rounded-2xl text-[10px] font-black
              uppercase tracking-widest hover:bg-emerald-400 active:scale-95
              transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            {enviando
              ? <><Loader2 size={13} className="animate-spin" /> Enviando...</>
              : <><Send size={13} /> Enviar Solicitação</>
            }
          </button>
        )}
      </div>
    </div>
  );
}
