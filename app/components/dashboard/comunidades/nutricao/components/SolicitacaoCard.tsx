// app/components/dashboard/comunidades/nutricao/components/SolicitacaoCard.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Clock, ChevronDown, ChevronUp,
  Sparkles, Pencil, CheckCircle2, XCircle,
  Activity, Scale, TrendingUp,
} from "lucide-react";
import type { SolicitacaoCardapio } from "../types";
import { FOCOS_NUTRICAO } from "../constants";
import { classificarIMC, classificarRCQ, classificarGordura } from "../utils";

// ── Props ─────────────────────────────────────────────────────────
interface Props {
  solicitacao:    SolicitacaoCardapio;
  onGerarIA:      (s: SolicitacaoCardapio) => void;
  onCriarManual:  (s: SolicitacaoCardapio) => void;
  onRejeitar:     (id: string, obs: string) => void;
  gerandoIA?:     boolean;
}

// ── Badge de status ───────────────────────────────────────────────
const STATUS_CONFIG = {
  pendente:      { label: "Pendente",      bg: "bg-amber-500/10",  border: "border-amber-500/20",  text: "text-amber-400"  },
  em_andamento:  { label: "Em andamento",  bg: "bg-sky-500/10",    border: "border-sky-500/20",    text: "text-sky-400"    },
  concluida:     { label: "Concluída",     bg: "bg-emerald-500/10",border: "border-emerald-500/20",text: "text-emerald-400"},
  rejeitada:     { label: "Rejeitada",     bg: "bg-rose-500/10",   border: "border-rose-500/20",   text: "text-rose-400"   },
};

// ── Componente ────────────────────────────────────────────────────
export function SolicitacaoCard({
  solicitacao, onGerarIA, onCriarManual, onRejeitar, gerandoIA,
}: Props) {
  const [expandido,    setExpandido]    = useState(false);
  const [rejeitando,   setRejeitando]   = useState(false);
  const [obsRejeicao,  setObsRejeicao]  = useState("");

  const foco   = FOCOS_NUTRICAO.find(f => f.id === solicitacao.foco);
  const status = STATUS_CONFIG[solicitacao.status];
  const m      = solicitacao.medidas;

  const dataFormatada = new Date(solicitacao.criadoEm)
    .toLocaleDateString("pt-BR", {
      day: "2-digit", month: "short", year: "numeric",
    });

  const handleRejeitar = () => {
    onRejeitar(solicitacao.id, obsRejeicao);
    setRejeitando(false);
    setObsRejeicao("");
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#050B14] border border-white/5 rounded-[20px]
        overflow-hidden"
    >
      {/* ── Header do card ──────────────────────────────────────── */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">

          {/* Aluno + foco */}
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/5
              flex items-center justify-center shrink-0">
              <User size={16} className="text-white/30" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-white italic truncate">
                {solicitacao.alunoNome}
              </p>
              {foco && (
                <div className={`inline-flex items-center gap-1.5 mt-1
                  px-2 py-0.5 rounded-lg ${foco.bg} ${foco.border} border`}>
                  <foco.icon size={9} className={foco.cor} />
                  <span className={`text-[7px] font-black uppercase
                    tracking-widest ${foco.cor}`}>
                    {foco.label}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Status + data */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className={`text-[7px] font-black uppercase tracking-widest
              px-2 py-1 rounded-lg border
              ${status.bg} ${status.border} ${status.text}`}>
              {status.label}
            </span>
            <div className="flex items-center gap-1 text-white/15">
              <Clock size={9} />
              <span className="text-[7px] font-bold">{dataFormatada}</span>
            </div>
          </div>
        </div>

        {/* Objetivo preview */}
        <p className="mt-3 text-[10px] text-white/30 italic leading-relaxed
          line-clamp-2">
          "{solicitacao.objetivo}"
        </p>

        {/* Restrições */}
        {solicitacao.restricoes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {solicitacao.restricoes.map(r => (
              <span key={r}
                className="px-2 py-0.5 bg-rose-500/8 border border-rose-500/15
                  rounded-lg text-[7px] font-black text-rose-400/70">
                {r}
              </span>
            ))}
          </div>
        )}

        {/* Medidas resumidas */}
        {m && (
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {[
              { icon: Scale,     val: m.imc        ? `IMC ${m.imc.toFixed(1)}`          : null },
              { icon: Activity,  val: m.gorduraEst  ? `~${m.gorduraEst.toFixed(1)}% gord` : null },
              { icon: TrendingUp,val: m.rcq         ? `RCQ ${m.rcq.toFixed(2)}`          : null },
            ].filter(x => x.val).map((item, i) => (
              <div key={i} className="flex items-center gap-1">
                <item.icon size={9} className="text-white/20" />
                <span className="text-[8px] font-bold text-white/25 italic">
                  {item.val}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Detalhes expandíveis ─────────────────────────────────── */}
      <AnimatePresence>
        {expandido && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{    height: 0,    opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-white/5"
          >
            <div className="p-4 sm:p-5 space-y-4">

              {/* Objetivo completo */}
              <div className="space-y-1.5">
                <p className="text-[8px] font-black uppercase tracking-widest
                  text-white/20">
                  Objetivo completo
                </p>
                <p className="text-xs text-white/40 italic leading-relaxed
                  bg-white/3 rounded-xl p-3">
                  {solicitacao.objetivo}
                </p>
              </div>

              {/* Medidas completas */}
              {m && (
                <div className="space-y-2">
                  <p className="text-[8px] font-black uppercase tracking-widest
                    text-white/20">
                    Dados corporais
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {[
                      { l: "Sexo",    v: m.sexo === "masculino" ? "♂ Masc." : "♀ Fem." },
                      { l: "Peso",    v: `${m.peso} kg`    },
                      { l: "Altura",  v: `${m.altura} cm`  },
                      { l: "Cintura", v: `${m.cintura} cm` },
                      { l: "Quadril", v: `${m.quadril} cm` },
                      m.pescoco ? { l: "Pescoço", v: `${m.pescoco} cm` } : null,
                      { l: "IMC",     v: m.imc?.toFixed(1) ?? "—",
                        sub: m.imc ? classificarIMC(m.imc) : undefined },
                      { l: "RCQ",     v: m.rcq?.toFixed(3) ?? "—",
                        sub: m.rcq ? classificarRCQ(m.rcq, m.sexo).label : undefined },
                      { l: "Gordura", v: m.gorduraEst ? `~${m.gorduraEst.toFixed(1)}%` : "—",
                        sub: m.gorduraEst ? classificarGordura(m.gorduraEst, m.sexo).label : undefined },
                    ].filter(Boolean).map((item: any) => (
                      <div key={item.l}
                        className="bg-white/3 rounded-xl p-2.5 space-y-0.5">
                        <p className="text-[7px] font-black uppercase
                          tracking-widest text-white/15">
                          {item.l}
                        </p>
                        <p className="text-xs font-black text-white/50 italic">
                          {item.v}
                        </p>
                        {item.sub && (
                          <p className="text-[7px] text-white/20 italic">
                            {item.sub}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-[7px] text-amber-500/40 italic">
                    ⚠️ Estimativa de apoio. Sujeita à revisão profissional.
                  </p>
                </div>
              )}

              {/* Rejeição */}
              <AnimatePresence>
                {rejeitando && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{    opacity: 0, height: 0    }}
                    className="space-y-2"
                  >
                    <textarea
                      value={obsRejeicao}
                      onChange={e => setObsRejeicao(e.target.value)}
                      placeholder="Motivo da rejeição (opcional)..."
                      rows={2}
                      className="w-full bg-white/5 border border-rose-500/20
                        rounded-xl p-3 text-xs text-white/60 outline-none
                        resize-none focus:border-rose-500/40
                        placeholder:text-white/15"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setRejeitando(false)}
                        className="flex-1 py-2.5 bg-white/5 rounded-xl
                          text-[9px] font-black uppercase tracking-widest
                          text-white/30 hover:text-white/50 transition-all"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleRejeitar}
                        className="flex-1 py-2.5 bg-rose-500/15 border
                          border-rose-500/30 rounded-xl text-[9px] font-black
                          uppercase tracking-widest text-rose-400
                          hover:bg-rose-500/25 transition-all"
                      >
                        Confirmar
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Ações do profissional */}
              {solicitacao.status === "pendente" && !rejeitando && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <button
                    onClick={() => onGerarIA(solicitacao)}
                    disabled={gerandoIA}
                    className="flex items-center justify-center gap-2 py-3
                      bg-sky-500/10 border border-sky-500/20 rounded-2xl
                      text-[9px] font-black uppercase tracking-widest
                      text-sky-400 hover:bg-sky-500/20 transition-all
                      disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Sparkles size={12} />
                    {gerandoIA ? "Gerando..." : "Gerar com IA"}
                  </button>

                  <button
                    onClick={() => onCriarManual(solicitacao)}
                    className="flex items-center justify-center gap-2 py-3
                      bg-emerald-500/10 border border-emerald-500/20
                      rounded-2xl text-[9px] font-black uppercase
                      tracking-widest text-emerald-400
                      hover:bg-emerald-500/20 transition-all"
                  >
                    <Pencil size={12} /> Criar manual
                  </button>

                  <button
                    onClick={() => setRejeitando(true)}
                    className="flex items-center justify-center gap-2 py-3
                      bg-rose-500/8 border border-rose-500/15 rounded-2xl
                      text-[9px] font-black uppercase tracking-widest
                      text-rose-400/70 hover:bg-rose-500/15 transition-all"
                  >
                    <XCircle size={12} /> Rejeitar
                  </button>
                </div>
              )}

              {solicitacao.status === "concluida" && (
                <div className="flex items-center gap-2 py-3 px-4
                  bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span className="text-[9px] font-black uppercase
                    tracking-widest text-emerald-400">
                    Cardápio publicado
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toggle expandir ──────────────────────────────────────── */}
      <button
        onClick={() => setExpandido(p => !p)}
        className="w-full flex items-center justify-center gap-2 py-3
          border-t border-white/5 text-white/15 hover:text-white/40
          text-[8px] font-black uppercase tracking-widest
          transition-colors"
      >
        {expandido
          ? <><ChevronUp size={11} /> Recolher</>
          : <><ChevronDown size={11} /> Ver detalhes</>
        }
      </button>
    </motion.div>
  );
}
