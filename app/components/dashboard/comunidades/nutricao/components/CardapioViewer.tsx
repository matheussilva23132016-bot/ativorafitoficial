// app/components/dashboard/comunidades/nutricao/components/CardapioViewer.tsx
"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Circle, ChevronLeft, ChevronRight,
  Flame, Beef, Wheat, Droplets, Clock,
  MessageSquare, UtensilsCrossed, Trophy,
  CalendarDays, Info, Download,
} from "lucide-react";
import type { Cardapio, DiaCardapio, Refeicao, DiaSemana } from "../types";
import { FOCOS_NUTRICAO, DIAS_SEMANA } from "../constants";
import { somarCalorias } from "../utils";

// ── Props ─────────────────────────────────────────────────────────
interface Props {
  cardapio:               Cardapio;
  onToggleConcluida:      (dia: DiaSemana, refeicaoId: string) => void;
  pdfUrl?:                string;
}

// ── Macros de uma refeição ────────────────────────────────────────
function somarMacros(refeicao: Refeicao) {
  return refeicao.alimentos.reduce(
    (acc, a) => ({
      cal:  acc.cal  + (a.calorias  ?? 0),
      prot: acc.prot + (a.proteinas ?? 0),
      carb: acc.carb + (a.carbos    ?? 0),
      gord: acc.gord + (a.gorduras  ?? 0),
    }),
    { cal: 0, prot: 0, carb: 0, gord: 0 }
  );
}

// ── Pill de macro ─────────────────────────────────────────────────
function MacroPill({
  icon: Icon, valor, unidade, cor, label,
}: {
  icon:    any;
  valor:   number;
  unidade: string;
  cor:     string;
  label:   string;
}) {
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl
      bg-white/5 border border-white/5`}>
      <Icon size={10} className={cor} />
      <div>
        <p className="text-[7px] font-black uppercase tracking-widest
          text-white/20 leading-none">
          {label}
        </p>
        <p className="text-[10px] font-black text-white/60 leading-none mt-0.5">
          {Math.round(valor)}{unidade}
        </p>
      </div>
    </div>
  );
}

// ── Card de refeição ──────────────────────────────────────────────
function RefeicaoCard({
  refeicao, onToggle,
}: {
  refeicao: Refeicao;
  onToggle: () => void;
}) {
  const [aberta, setAberta] = useState(false);
  const macros = useMemo(() => somarMacros(refeicao), [refeicao]);
  const cal    = refeicao.calorias ?? macros.cal;

  return (
    <motion.div
      layout
      className={`rounded-[18px] border overflow-hidden transition-all
        duration-300
        ${refeicao.concluida
          ? "bg-emerald-500/5 border-emerald-500/15"
          : "bg-white/3 border-white/5"
        }`}
    >
      {/* Header da refeição */}
      <div className="p-4">
        <div className="flex items-start gap-3">

          {/* Checkbox concluída */}
          <button
            onClick={onToggle}
            className={`shrink-0 mt-0.5 transition-all active:scale-90
              ${refeicao.concluida
                ? "text-emerald-500"
                : "text-white/15 hover:text-white/40"
              }`}
          >
            {refeicao.concluida
              ? <CheckCircle2 size={20} />
              : <Circle       size={20} />
            }
          </button>

          {/* Info refeição */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className={`text-sm font-black italic uppercase tracking-tight
                transition-colors
                ${refeicao.concluida ? "text-emerald-400/70" : "text-white"}`}>
                {refeicao.nome}
              </p>
              <div className="flex items-center gap-1.5 shrink-0">
                <Clock size={10} className="text-white/20" />
                <span className="text-[9px] font-bold text-white/25">
                  {refeicao.horario}
                </span>
              </div>
            </div>

            {/* Calorias + macros resumidos */}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {cal > 0 && (
                <div className="flex items-center gap-1">
                  <Flame size={10} className="text-rose-500" />
                  <span className="text-[10px] font-black text-white/40">
                    {Math.round(cal)} kcal
                  </span>
                </div>
              )}
              {refeicao.alimentos.length > 0 && (
                <span className="text-[9px] text-white/20">
                  {refeicao.alimentos.length} item
                  {refeicao.alimentos.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>

          {/* Toggle expandir */}
          <button
            onClick={() => setAberta(p => !p)}
            className="shrink-0 p-1.5 rounded-lg bg-white/5
              text-white/20 hover:text-white/50 transition-all"
          >
            <motion.div
              animate={{ rotate: aberta ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight size={13} className="rotate-90" />
            </motion.div>
          </button>
        </div>
      </div>

      {/* Detalhes expandíveis */}
      <AnimatePresence>
        {aberta && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{    height: 0,    opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-4">

              {/* Lista de alimentos */}
              {refeicao.alimentos.length > 0 ? (
                <div className="space-y-2">
                  {refeicao.alimentos.map(alimento => (
                    <div key={alimento.id}
                      className="flex items-center justify-between gap-3
                        py-2 border-b border-white/5 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white/70
                          truncate">
                          {alimento.nome}
                        </p>
                        <p className="text-[9px] text-white/25 italic">
                          {alimento.quantidade}
                        </p>
                      </div>
                      {alimento.calorias !== undefined && alimento.calorias > 0 && (
                        <span className="text-[9px] font-black text-white/30
                          shrink-0">
                          {alimento.calorias} kcal
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-white/20 italic text-center py-2">
                  Nenhum alimento cadastrado
                </p>
              )}

              {/* Macros detalhados */}
              {(macros.prot > 0 || macros.carb > 0 || macros.gord > 0) && (
                <div className="flex flex-wrap gap-2">
                  <MacroPill
                    icon={Beef}    valor={macros.prot}
                    unidade="g"    cor="text-rose-400"
                    label="Prot."
                  />
                  <MacroPill
                    icon={Wheat}   valor={macros.carb}
                    unidade="g"    cor="text-amber-400"
                    label="Carb."
                  />
                  <MacroPill
                    icon={Droplets} valor={macros.gord}
                    unidade="g"    cor="text-sky-400"
                    label="Gord."
                  />
                  {cal > 0 && (
                    <MacroPill
                      icon={Flame}  valor={cal}
                      unidade="kcal" cor="text-orange-400"
                      label="Cal."
                    />
                  )}
                </div>
              )}

              {/* Obs da refeição */}
              {refeicao.obs && (
                <div className="flex items-start gap-2 bg-sky-500/5
                  border border-sky-500/10 rounded-xl p-3">
                  <Info size={11} className="text-sky-400 shrink-0 mt-0.5" />
                  <p className="text-[9px] text-sky-400/70 italic
                    leading-relaxed">
                    {refeicao.obs}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Componente principal ──────────────────────────────────────────
export function CardapioViewer({ cardapio, onToggleConcluida, pdfUrl }: Props) {
  const hoje = new Date().toLocaleDateString("pt-BR", { weekday: "long" });
  const diaHoje = DIAS_SEMANA.find(d =>
    hoje.toLowerCase().startsWith(d.toLowerCase().slice(0, 3))
  ) ?? DIAS_SEMANA[0];

  const [diaAtivo, setDiaAtivo] = useState<DiaSemana>(
    cardapio.dias.some(d => d.dia === diaHoje) ? diaHoje : cardapio.dias[0]?.dia ?? diaHoje
  );
  const [abaAtiva, setAbaAtiva] = useState<"cardapio" | "obs">("cardapio");

  const foco = FOCOS_NUTRICAO.find(f => f.id === cardapio.foco);
  const diasVisiveis = useMemo(
    () => Array.from(new Set([...cardapio.dias.map(d => d.dia), ...DIAS_SEMANA])),
    [cardapio.dias]
  );

  // Dia atual
  const diaData = useMemo(
    () => cardapio.dias.find(d => d.dia === diaAtivo),
    [cardapio.dias, diaAtivo]
  );

  // Progresso do dia
  const progressoDia = useMemo(() => {
    if (!diaData || diaData.refeicoes.length === 0)
      return { concluidas: 0, total: 0, pct: 0 };
    const concluidas = diaData.refeicoes.filter(r => r.concluida).length;
    const total      = diaData.refeicoes.length;
    return { concluidas, total, pct: Math.round((concluidas / total) * 100) };
  }, [diaData]);

  // Calorias do dia
  const calDia = useMemo(
    () => diaData ? somarCalorias(diaData.refeicoes) : 0,
    [diaData]
  );

  // Progresso semanal
  const progressoSemanal = useMemo(() => {
    const total     = cardapio.dias.reduce((a, d) => a + d.refeicoes.length, 0);
    const concluidas = cardapio.dias.reduce(
      (a, d) => a + d.refeicoes.filter(r => r.concluida).length, 0
    );
    return total > 0 ? Math.round((concluidas / total) * 100) : 0;
  }, [cardapio.dias]);

  // Navegação entre dias
  const idxAtivo = diasVisiveis.indexOf(diaAtivo);
  const irParaDia = (delta: number) => {
    const next = diasVisiveis[idxAtivo + delta];
    if (next) setDiaAtivo(next);
  };

  return (
    <div className="space-y-4 sm:space-y-5">

      {/* ── Header do cardápio ──────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-[22px] bg-[#050B14]
        border border-white/5 p-5 sm:p-6">

        {/* Glow de fundo */}
        {foco && (
          <div className={`absolute -top-8 -right-8 w-40 h-40 blur-[60px]
            rounded-full opacity-20 pointer-events-none
            ${foco.bg.replace("/10", "")}`}
          />
        )}

        <div className="relative z-10 space-y-4">
          {/* Título + foco */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1 min-w-0">
              <p className="text-[8px] font-black uppercase tracking-widest
                text-white/20 flex items-center gap-2">
                <CalendarDays size={10} />
                Semana {cardapio.semana.split("-W")[1]} · {cardapio.semana.split("-W")[0]}
              </p>
              <h2 className="text-xl sm:text-2xl font-black italic uppercase
                text-white tracking-tighter leading-tight truncate">
                {cardapio.titulo}
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:justify-end">
              {pdfUrl && (
                <a
                  href={pdfUrl}
                  download
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/20
                    bg-emerald-500/10 px-3 py-2 text-[8px] font-black uppercase
                    tracking-widest text-emerald-300 transition-all hover:bg-emerald-500/20"
                >
                  <Download size={11} /> Baixar cardápio em PDF
                </a>
              )}
              {foco && (
                <div className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5
                  rounded-xl border ${foco.bg} ${foco.border}`}>
                  <foco.icon size={12} className={foco.cor} />
                  <span className={`text-[8px] font-black uppercase
                    tracking-widest ${foco.cor}`}>
                    {foco.label}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Metas diárias */}
          {(cardapio.calorias_dia || cardapio.proteinas_dia) && (
            <div className="flex flex-wrap gap-3">
              {cardapio.calorias_dia && (
                <div className="flex items-center gap-1.5">
                  <Flame size={12} className="text-orange-500" />
                  <span className="text-[10px] font-black text-white/40">
                    Meta: <span className="text-white/70">
                      {cardapio.calorias_dia} kcal/dia
                    </span>
                  </span>
                </div>
              )}
              {cardapio.proteinas_dia && (
                <div className="flex items-center gap-1.5">
                  <Beef size={12} className="text-rose-400" />
                  <span className="text-[10px] font-black text-white/40">
                    Proteína: <span className="text-white/70">
                      {cardapio.proteinas_dia}g/dia
                    </span>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Progresso semanal */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[8px] font-black uppercase tracking-widest
                text-white/20">
                Progresso semanal
              </span>
              <span className="text-[8px] font-black text-white/40">
                {progressoSemanal}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressoSemanal}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-emerald-500 rounded-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Abas ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2 sm:flex">
        {(["cardapio", "obs"] as const).map(aba => (
          <button
            key={aba}
            onClick={() => setAbaAtiva(aba)}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
              text-[9px] font-black uppercase tracking-widest transition-all
              ${abaAtiva === aba
                ? "bg-white/10 text-white border border-white/10"
                : "text-white/25 hover:text-white/50"
              }`}
          >
            {aba === "cardapio"
              ? <><UtensilsCrossed size={11} /> Cardápio</>
              : <><MessageSquare  size={11} /> Orientações</>
            }
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── ABA CARDÁPIO ──────────────────────────────────────── */}
        {abaAtiva === "cardapio" && (
          <motion.div
            key="cardapio"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{    opacity: 0, y: 6 }}
            className="space-y-4"
          >
            {/* Seletor de dia — scroll horizontal mobile */}
            <div className="relative">
              <div className="flex gap-2 overflow-x-auto pb-1
                scrollbar-none snap-x snap-mandatory">
                {diasVisiveis.map(dia => {
                  const diaInfo  = cardapio.dias.find(d => d.dia === dia);
                  const concl    = diaInfo?.refeicoes.filter(r => r.concluida).length ?? 0;
                  const total    = diaInfo?.refeicoes.length ?? 0;
                  const completo = total > 0 && concl === total;
                  const isHoje   = dia === diaHoje;

                  return (
                    <button
                      key={dia}
                      onClick={() => setDiaAtivo(dia)}
                      className={`snap-start shrink-0 flex flex-col items-center
                        gap-1.5 px-3 py-2.5 rounded-[14px] border
                        transition-all min-w-[60px]
                        ${diaAtivo === dia
                          ? "bg-sky-500/15 border-sky-500/30 text-sky-400"
                          : completo
                            ? "bg-emerald-500/8 border-emerald-500/15 text-emerald-400/60"
                            : "bg-white/3 border-white/5 text-white/25 hover:border-white/15"
                        }`}
                    >
                      <span className="text-[8px] font-black uppercase
                        tracking-widest leading-none">
                        {dia.slice(0, 3)}
                      </span>
                      {isHoje && (
                        <span className="text-[6px] font-black uppercase
                          tracking-widest text-sky-400/60">
                          hoje
                        </span>
                      )}
                      {total > 0 && (
                        <span className="text-[7px] font-bold opacity-60">
                          {concl}/{total}
                        </span>
                      )}
                      {completo && (
                        <Trophy size={9} className="text-emerald-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cabeçalho do dia */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => irParaDia(-1)}
                  disabled={idxAtivo === 0}
                  className="p-1.5 rounded-lg bg-white/5 text-white/20
                    hover:text-white/50 disabled:opacity-20
                    disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={14} />
                </button>

                <div>
                  <h3 className="text-base font-black italic uppercase
                    text-white tracking-tighter">
                    {diaAtivo}
                    {diaAtivo === diaHoje && (
                      <span className="ml-2 text-[8px] font-black
                        text-sky-400/70 normal-case not-italic">
                        · hoje
                      </span>
                    )}
                  </h3>
                  {calDia > 0 && (
                    <p className="text-[9px] text-white/25 flex items-center gap-1">
                      <Flame size={9} className="text-orange-400" />
                      {Math.round(calDia)} kcal estimadas
                    </p>
                  )}
                </div>

                <button
                  onClick={() => irParaDia(1)}
                  disabled={idxAtivo === diasVisiveis.length - 1}
                  className="p-1.5 rounded-lg bg-white/5 text-white/20
                    hover:text-white/50 disabled:opacity-20
                    disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={14} />
                </button>
              </div>

              {/* Progresso do dia */}
              {progressoDia.total > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      animate={{ width: `${progressoDia.pct}%` }}
                      className="h-full bg-emerald-500 rounded-full"
                    />
                  </div>
                  <span className="text-[8px] font-black text-white/25">
                    {progressoDia.concluidas}/{progressoDia.total}
                  </span>
                </div>
              )}
            </div>

            {/* Refeições do dia */}
            <AnimatePresence mode="wait">
              <motion.div
                key={diaAtivo}
                initial={{ opacity: 0, x: 10  }}
                animate={{ opacity: 1, x: 0   }}
                exit={{    opacity: 0, x: -10 }}
                transition={{ duration: 0.18 }}
                className="space-y-3"
              >
                {diaData && diaData.refeicoes.length > 0 ? (
                  diaData.refeicoes.map(refeicao => (
                    <RefeicaoCard
                      key={refeicao.id}
                      refeicao={refeicao}
                      onToggle={() => onToggleConcluida(diaAtivo, refeicao.id)}
                    />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center
                    py-12 gap-3">
                    <UtensilsCrossed size={28} className="text-white/5" />
                    <p className="text-[9px] font-black uppercase tracking-widest
                      text-white/15 text-center">
                      Nenhuma refeição para {diaAtivo}
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── ABA ORIENTAÇÕES ───────────────────────────────────── */}
        {abaAtiva === "obs" && (
          <motion.div
            key="obs"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{    opacity: 0, y: 6 }}
            className="space-y-4"
          >
            {cardapio.obs ? (
              <div className="bg-[#050B14] border border-white/5
                rounded-[20px] p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <MessageSquare size={14} className="text-sky-400" />
                  <h3 className="text-[9px] font-black uppercase tracking-widest
                    text-white/30">
                    Orientações do profissional
                  </h3>
                </div>
                <p className="text-sm text-white/50 italic leading-relaxed
                  whitespace-pre-line">
                  {cardapio.obs}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center
                py-16 gap-3">
                <MessageSquare size={28} className="text-white/5" />
                <p className="text-[9px] font-black uppercase tracking-widest
                  text-white/15 text-center">
                  Nenhuma orientação adicional
                </p>
              </div>
            )}

            {/* Info do cardápio */}
            <div className="bg-white/3 border border-white/5 rounded-[18px]
              p-4 space-y-3">
              <p className="text-[8px] font-black uppercase tracking-widest
                text-white/20">
                Informações do plano
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { l: "Semana",    v: `Semana ${cardapio.semana.split("-W")[1]}` },
                  { l: "Gerado",    v: cardapio.geradoPorIA ? "IA + Profissional" : "Manual" },
                  { l: "Publicado", v: new Date(cardapio.atualizadoEm)
                      .toLocaleDateString("pt-BR") },
                  { l: "Status",    v: cardapio.status === "published"
                      ? "Publicado" : "Rascunho" },
                ].map(item => (
                  <div key={item.l}>
                    <p className="text-[7px] font-black uppercase tracking-widest
                      text-white/15">
                      {item.l}
                    </p>
                    <p className="text-xs font-black text-white/40 italic mt-0.5">
                      {item.v}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
