// app/components/dashboard/comunidades/nutricao/components/CardapioEditor.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Save, Send, ChevronDown,
  ChevronUp, GripVertical, Pencil, Check,
  X, Flame, Beef, Wheat, Droplets, Clock,
  Sparkles, Loader2, AlertTriangle, UtensilsCrossed,
  RotateCcw, Eye, EyeOff, BookOpen,
} from "lucide-react";
import type {
  Cardapio, DiaCardapio, Refeicao,
  Alimento, DiaSemana, FocoNutricional,
} from "../types";
import { FOCOS_NUTRICAO, DIAS_SEMANA, REFEICOES_PADRAO } from "../constants";
import { uid, now, novaRefeicao, novoAlimento, somarCalorias } from "../utils";
import { FOOD_DATABASE, AlimentoCatalogo } from "../foodDatabase";
import { FoodManualView } from "./FoodManualView";
import type { ManualFood } from "../foodManualData";

// ══════════════════════════════════════════════════════════════════
// TIPOS INTERNOS
// ══════════════════════════════════════════════════════════════════
interface Props {
  cardapio:        Cardapio;
  gerandoIA?:      boolean;
  onSave:          (c: Cardapio) => Promise<void>;
  onPublish:       (id: string, solicitacaoId?: string) => Promise<void>;
  onGerarIA?:      () => void;
  onCancel?:       () => void;
  manualDisponivel?: boolean;
}

// ══════════════════════════════════════════════════════════════════
// SUB — INPUT INLINE
// ══════════════════════════════════════════════════════════════════
function InlineInput({
  value, onChange, placeholder, className = "", type = "text", min, step,
}: {
  value:       string | number;
  onChange:    (v: string) => void;
  placeholder?: string;
  className?:  string;
  type?:       string;
  min?:        number;
  step?:       number;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      step={step}
      className={`bg-white/5 border border-white/8 rounded-lg px-2.5 py-1.5
        text-xs text-white/70 outline-none focus:border-sky-500/40
        placeholder:text-white/15 transition-all w-full ${className}`}
    />
  );
}

// ══════════════════════════════════════════════════════════════════
// SUB — LINHA DE ALIMENTO
// ══════════════════════════════════════════════════════════════════
function AlimentoRow({
  alimento, onChange, onRemove,
}: {
  alimento: Alimento;
  onChange: (patch: Partial<Alimento>) => void;
  onRemove: () => void;
}) {
  const [expandido, setExpandido] = useState(false);
  const [focoNome,  setFocoNome]  = useState(false);

  const sugestoes = useMemo(() => {
    if (!alimento.nome || alimento.nome.length < 2) return [];
    const t = alimento.nome.toLowerCase();
    return FOOD_DATABASE.filter(f => f.nome.toLowerCase().includes(t)).slice(0, 15);
  }, [alimento.nome]);

  const aplicarSugestao = (s: AlimentoCatalogo) => {
    onChange({
      nome: s.nome,
      quantidade: s.porcaoBase,
      calorias: s.calorias,
      proteinas: s.proteinas,
      carbos: s.carbos,
      gorduras: s.gorduras,
    });
    setFocoNome(false);
    setExpandido(true);
  };

  return (
    <div className="bg-white/3 border border-white/5 rounded-xl">
      {/* Linha principal */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <GripVertical size={12} className="text-white/10 shrink-0 cursor-grab" />

        {/* Nome + quantidade */}
        <div className="flex-1 grid grid-cols-2 gap-2 min-w-0">
          <div className="relative">
            <input
              value={alimento.nome}
              onChange={e => onChange({ nome: e.target.value })}
              onFocus={() => setFocoNome(true)}
              onBlur={() => setTimeout(() => setFocoNome(false), 200)}
              placeholder="Ex: Frango, Aveia..."
              className="bg-white/5 border border-white/8 rounded-lg px-2.5 py-1.5
                text-xs text-white/70 outline-none focus:border-sky-500/40
                placeholder:text-white/15 transition-all w-full"
            />
            {/* Dropdown de Busca */}
            <AnimatePresence>
              {focoNome && sugestoes.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute z-50 left-0 top-full mt-1 w-[280px] bg-[#0A1220]
                    border border-white/10 rounded-xl overflow-hidden shadow-2xl shadow-black/80"
                >
                  <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                    {sugestoes.map(s => (
                      <button
                        key={s.nome}
                        onMouseDown={(e) => { e.preventDefault(); aplicarSugestao(s); }}
                        className="w-full text-left px-3 py-2 border-b border-white/5
                          hover:bg-sky-500/10 transition-colors group flex flex-col gap-1"
                      >
                        <p className="text-[10px] font-black uppercase tracking-wide text-white/80 group-hover:text-sky-400">
                          {s.nome}
                        </p>
                        <p className="text-[9px] text-white/40 flex items-center gap-2 mt-0.5">
                          <span className="text-white/60 font-semibold">{s.porcaoBase}</span>
                          <span className="flex items-center gap-1 text-white/50"><Flame size={9} className="text-orange-400"/> {s.calorias} kcal</span>
                          <span className="flex items-center gap-1 text-white/50"><Beef size={9} className="text-rose-400"/> {s.proteinas}g <span className="text-[8px] uppercase tracking-widest opacity-60">Prot</span></span>
                          <span className="flex items-center gap-1 text-white/50"><Wheat size={9} className="text-amber-400"/> {s.carbos}g <span className="text-[8px] uppercase tracking-widest opacity-60">Carb</span></span>
                          <span className="flex items-center gap-1 text-white/50"><Droplets size={9} className="text-sky-400"/> {s.gorduras}g <span className="text-[8px] uppercase tracking-widest opacity-60">Gord</span></span>
                        </p>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <InlineInput
            value={alimento.quantidade}
            onChange={v => onChange({ quantidade: v })}
            placeholder="100g / 1 unid."
          />
        </div>

        {/* Calorias rápidas */}
        <div className="relative w-20 shrink-0">
          <InlineInput
            type="number"
            value={alimento.calorias ?? ""}
            onChange={v => onChange({ calorias: Number(v) || 0 })}
            placeholder="kcal"
            min={0}
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2
            text-[7px] text-white/15 font-black pointer-events-none">
            kcal
          </span>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setExpandido(p => !p)}
            className="p-1 rounded-lg text-white/15 hover:text-sky-400
              transition-colors"
          >
            {expandido ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          <button
            onClick={onRemove}
            className="p-1 rounded-lg text-white/15 hover:text-rose-400
              transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Macros expandidos */}
      <AnimatePresence>
        {expandido && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{    height: 0,    opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden border-t border-white/5"
          >
            <div className="px-3 py-2.5 grid grid-cols-3 gap-2">
              {[
                { key: "proteinas" as const, label: "Prot.", icon: Beef,     cor: "text-rose-400",   unit: "g"  },
                { key: "carbos"    as const, label: "Carb.", icon: Wheat,    cor: "text-amber-400",  unit: "g"  },
                { key: "gorduras"  as const, label: "Gord.", icon: Droplets, cor: "text-sky-400",    unit: "g"  },
              ].map(m => (
                <div key={m.key} className="space-y-1">
                  <div className="flex items-center gap-1">
                    <m.icon size={9} className={m.cor} />
                    <span className="text-[7px] font-black uppercase
                      tracking-widest text-white/20">
                      {m.label}
                    </span>
                  </div>
                  <div className="relative">
                    <InlineInput
                      type="number"
                      value={alimento[m.key] ?? ""}
                      onChange={v => onChange({ [m.key]: Number(v) || 0 })}
                      placeholder="0"
                      min={0}
                      step={0.1}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2
                      text-[7px] text-white/15 pointer-events-none">
                      {m.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// SUB — CARD DE REFEIÇÃO (editor)
// ══════════════════════════════════════════════════════════════════
function RefeicaoEditorCard({
  refeicao, onUpdate, onRemove, onAddAlimento, onOpenManual,
}: {
  refeicao:     Refeicao;
  onUpdate:     (patch: Partial<Refeicao>) => void;
  onRemove:     () => void;
  onAddAlimento: () => void;
  onOpenManual?: () => void;
}) {
  const [aberta,      setAberta]      = useState(true);
  const [editandoNome, setEditandoNome] = useState(false);
  const [nomeTemp,    setNomeTemp]    = useState(refeicao.nome);

  const totalCal = useMemo(
    () => refeicao.calorias
      ?? (Array.isArray(refeicao.alimentos) ? refeicao.alimentos.reduce((a, al) => a + (al.calorias ?? 0), 0) : 0),
    [refeicao]
  );

  const confirmarNome = () => {
    onUpdate({ nome: nomeTemp.trim() || refeicao.nome });
    setEditandoNome(false);
  };

  const updateAlimento = (id: string, patch: Partial<Alimento>) => {
    onUpdate({
      alimentos: Array.isArray(refeicao.alimentos) 
        ? refeicao.alimentos.map(a => a.id === id ? { ...a, ...patch } : a)
        : [],
    });
  };

  const removeAlimento = (id: string) => {
    onUpdate({ 
      alimentos: Array.isArray(refeicao.alimentos) 
        ? refeicao.alimentos.filter(a => a.id !== id) 
        : [] 
    });
  };

  return (
    <div className="bg-[#050B14] border border-white/8 rounded-[18px]
      overflow-hidden">

      {/* Header da refeição */}
      <div className="flex items-center gap-3 px-4 py-3
        border-b border-white/5">

        {/* Nome editável */}
        <div className="flex-1 min-w-0">
          {editandoNome ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={nomeTemp}
                onChange={e => setNomeTemp(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") confirmarNome();
                  if (e.key === "Escape") setEditandoNome(false);
                }}
                className="flex-1 bg-white/5 border border-sky-500/30
                  rounded-lg px-2.5 py-1 text-sm font-black text-white
                  outline-none"
              />
              <button onClick={confirmarNome}
                className="p-1 text-emerald-400 hover:text-emerald-300">
                <Check size={14} />
              </button>
              <button onClick={() => setEditandoNome(false)}
                className="p-1 text-white/20 hover:text-white/50">
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm font-black italic uppercase text-white
                tracking-tight truncate">
                {refeicao.nome}
              </span>
              <button
                onClick={() => { setNomeTemp(refeicao.nome); setEditandoNome(true); }}
                className="p-1 text-white/15 hover:text-sky-400 transition-colors"
              >
                <Pencil size={11} />
              </button>
            </div>
          )}
        </div>

        {/* Horário */}
        <div className="relative w-20 shrink-0">
          <Clock size={9} className="absolute left-2 top-1/2 -translate-y-1/2
            text-white/20 pointer-events-none" />
          <input
            type="time"
            value={refeicao.horario}
            onChange={e => onUpdate({ horario: e.target.value })}
            className="w-full bg-white/5 border border-white/5 rounded-lg
              pl-6 pr-2 py-1.5 text-[10px] text-white/50 outline-none
              focus:border-sky-500/30 transition-all"
          />
        </div>

        {/* Cal total */}
        {totalCal > 0 && (
          <div className="flex items-center gap-1 shrink-0">
            <Flame size={10} className="text-orange-400" />
            <span className="text-[9px] font-black text-white/30">
              {Math.round(totalCal)}
            </span>
          </div>
        )}

        {/* Toggle + remover */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setAberta(p => !p)}
            className="p-1.5 rounded-lg bg-white/5 text-white/20
              hover:text-white/50 transition-all"
          >
            {aberta ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          <button
            onClick={onRemove}
            className="p-1.5 rounded-lg bg-white/5 text-white/15
              hover:text-rose-400 hover:bg-rose-500/10 transition-all"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Corpo da refeição */}
      <AnimatePresence>
        {aberta && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{    height: 0,    opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-3">

              {/* Alimentos */}
              <div className="space-y-2">
                {Array.isArray(refeicao.alimentos) ? refeicao.alimentos.map(alimento => (
                  <AlimentoRow
                    key={alimento.id}
                    alimento={alimento}
                    onChange={patch => updateAlimento(alimento.id, patch)}
                    onRemove={() => removeAlimento(alimento.id)}
                  />
                )) : (
                  <p className="text-[10px] text-white/40 mb-2 p-3 bg-white/5 rounded-xl">
                    Registro antigo (formato texto): <br />
                    <span className="italic">{(refeicao as any).alimentos}</span>
                  </p>
                )}
              </div>

              {/* Adicionar alimento */}
              <div className={`grid gap-2 ${onOpenManual ? "sm:grid-cols-2" : ""}`}>
                {onOpenManual && (
                  <button
                    onClick={onOpenManual}
                    className="w-full flex items-center justify-center gap-2
                      py-2.5 border border-emerald-500/20 bg-emerald-500/8 rounded-xl
                      text-[9px] font-black uppercase tracking-widest
                      text-emerald-400 hover:bg-emerald-500/15
                      transition-all"
                  >
                    <BookOpen size={12} /> Manual de alimentos
                  </button>
                )}
                <button
                  onClick={onAddAlimento}
                  className="w-full flex items-center justify-center gap-2
                    py-2.5 border border-dashed border-white/10 rounded-xl
                    text-[9px] font-black uppercase tracking-widest
                    text-white/20 hover:text-sky-400 hover:border-sky-500/30
                    transition-all"
                >
                  <Plus size={12} /> Adicionar vazio
                </button>
              </div>

              {/* Obs da refeição */}
              <div className="space-y-1">
                <label className="text-[7px] font-black uppercase
                  tracking-widest text-white/15">
                  Observação desta refeição
                </label>
                <textarea
                  value={refeicao.obs ?? ""}
                  onChange={e => onUpdate({ obs: e.target.value })}
                  placeholder="Ex: Preferir frango grelhado. Evitar fritura..."
                  rows={2}
                  className="w-full bg-white/5 border border-white/5
                    rounded-xl px-3 py-2 text-[10px] text-white/50
                    outline-none resize-none focus:border-white/15
                    placeholder:text-white/10 transition-all"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════════
export function CardapioEditor({
  cardapio: cardapioInicial,
  gerandoIA, onSave, onPublish, onGerarIA, onCancel, manualDisponivel = false,
}: Props) {

  const [draft,        setDraft]        = useState<Cardapio>(cardapioInicial);
  const [diaAtivo,     setDiaAtivo]     = useState<DiaSemana>(cardapioInicial.dias[0]?.dia ?? "Segunda");
  const [salvando,     setSalvando]     = useState(false);
  const [publicando,   setPublicando]   = useState(false);
  const [preview,      setPreview]      = useState(false);
  const [alterado,     setAlterado]     = useState(false);
  const [confirmarPub, setConfirmarPub] = useState(false);
  const [manualAberto, setManualAberto] = useState(false);
  const [manualTargetRefeicaoId, setManualTargetRefeicaoId] = useState<string | null>(null);

  // ── Helpers de mutação ────────────────────────────────────────
  const mutar = useCallback((fn: (c: Cardapio) => Cardapio) => {
    setDraft(prev => fn(prev));
    setAlterado(true);
  }, []);

  const updateField = <K extends keyof Cardapio>(k: K, v: Cardapio[K]) =>
    mutar(c => ({ ...c, [k]: v, atualizadoEm: now() }));

  const diasVisiveis = useMemo(
    () => Array.from(new Set([...draft.dias.map(d => d.dia), ...DIAS_SEMANA])),
    [draft.dias]
  );

  const diaData = useMemo(
    () => draft.dias.find(d => d.dia === diaAtivo),
    [draft.dias, diaAtivo]
  );

  // ── Refeições ─────────────────────────────────────────────────
  const addRefeicao = () => {
    const nova = novaRefeicao();
    mutar(c => ({
      ...c,
      dias: c.dias.map(d =>
        d.dia === diaAtivo
          ? { ...d, refeicoes: [...d.refeicoes, nova] }
          : d
      ),
    }));
  };

  const updateRefeicao = (id: string, patch: Partial<Refeicao>) => {
    mutar(c => ({
      ...c,
      dias: c.dias.map(d =>
        d.dia === diaAtivo
          ? {
              ...d,
              refeicoes: d.refeicoes.map(r =>
                r.id === id ? { ...r, ...patch } : r
              ),
            }
          : d
      ),
    }));
  };

  const removeRefeicao = (id: string) => {
    mutar(c => ({
      ...c,
      dias: c.dias.map(d =>
        d.dia === diaAtivo
          ? { ...d, refeicoes: d.refeicoes.filter(r => r.id !== id) }
          : d
      ),
    }));
  };

  const addAlimento = (refeicaoId: string) => {
    const novo = novoAlimento();
    updateRefeicao(refeicaoId, {
      alimentos: [
        ...(diaData?.refeicoes.find(r => r.id === refeicaoId)?.alimentos ?? []),
        novo,
      ],
    });
  };

  const abrirManualParaRefeicao = (refeicaoId: string) => {
    setManualTargetRefeicaoId(refeicaoId);
    setManualAberto(true);
  };

  const addAlimentoDoManual = (food: ManualFood) => {
    if (!manualTargetRefeicaoId) return;
    const atual = diaData?.refeicoes.find(r => r.id === manualTargetRefeicaoId)?.alimentos ?? [];
    updateRefeicao(manualTargetRefeicaoId, {
      alimentos: [
        ...atual,
        {
          id: uid(),
          nome: food.nome,
          quantidade: food.porcaoBase,
          calorias: food.calorias,
          proteinas: food.proteinas,
          carbos: food.carbos,
          gorduras: food.gorduras,
        },
      ],
    });
  };

  // ── Copiar dia para todos ─────────────────────────────────────
  const copiarParaTodos = () => {
    if (!diaData) return;
    mutar(c => ({
      ...c,
      dias: c.dias.map(d =>
        d.dia === diaAtivo
          ? d
          : {
              ...d,
              refeicoes: diaData.refeicoes.map(r => ({
                ...r,
                id:        uid(),
                concluida: false,
                alimentos: Array.isArray(r.alimentos) ? r.alimentos.map(a => ({ ...a, id: uid() })) : [],
              })),
            }
      ),
    }));
  };

  // ── Adicionar refeições padrão ────────────────────────────────
  const addRefeicoesPadrao = () => {
    mutar(c => ({
      ...c,
      dias: c.dias.map(d =>
        d.dia === diaAtivo
          ? {
              ...d,
              refeicoes: REFEICOES_PADRAO.map(rp =>
                novaRefeicao(rp.nome, rp.horario)
              ),
            }
          : d
      ),
    }));
  };

  // ── Salvar ────────────────────────────────────────────────────
  const handleSave = async () => {
    setSalvando(true);
    try {
      await onSave(draft);
      setAlterado(false);
    } finally {
      setSalvando(false);
    }
  };

  // ── Publicar ──────────────────────────────────────────────────
  const handlePublish = async () => {
    setPublicando(true);
    try {
      await onSave(draft);
      await onPublish(draft.id, draft.solicitacaoId);
      setAlterado(false);
      setConfirmarPub(false);
    } finally {
      setPublicando(false);
    }
  };

  // ── Totais do dia ─────────────────────────────────────────────
  const totalDia = useMemo(() => {
    if (!diaData) return { cal: 0, prot: 0, carb: 0, gord: 0 };
    return diaData.refeicoes.reduce(
      (acc, r) => {
        const arr = Array.isArray(r.alimentos) ? r.alimentos : [];
        const m = arr.reduce(
          (a, al) => ({
            cal:  a.cal  + (al.calorias  ?? 0),
            prot: a.prot + (al.proteinas ?? 0),
            carb: a.carb + (al.carbos    ?? 0),
            gord: a.gord + (al.gorduras  ?? 0),
          }),
          { cal: 0, prot: 0, carb: 0, gord: 0 }
        );
        return {
          cal:  acc.cal  + (r.calorias ?? m.cal),
          prot: acc.prot + m.prot,
          carb: acc.carb + m.carb,
          gord: acc.gord + m.gord,
        };
      },
      { cal: 0, prot: 0, carb: 0, gord: 0 }
    );
  }, [diaData]);

  // ══════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col gap-5">
      <AnimatePresence>
        {manualAberto && manualDisponivel && (
          <motion.div
            key="manual-alimentos-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/78 backdrop-blur-sm"
          >
            <button
              type="button"
              aria-label="Fechar manual"
              onClick={() => setManualAberto(false)}
              className="absolute inset-0 h-full w-full cursor-default"
            />
            <motion.div
              initial={{ x: 28, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 28, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="relative ml-auto h-full w-full max-w-6xl overflow-y-auto bg-[#010307] p-4 shadow-2xl shadow-black sm:p-6"
            >
              <FoodManualView
                allowAccess
                embedded
                title="Manual para inserir no cardápio"
                addLabel="Adicionar nesta refeição"
                onBack={() => setManualAberto(false)}
                onAddFood={addAlimentoDoManual}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toolbar superior ──────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3
        bg-[#050B14] border border-white/5 rounded-[18px] px-4 py-3">

        {/* Info */}
        <div className="flex items-center gap-3 min-w-0">
          {alterado && (
            <span className="flex items-center gap-1.5 text-[8px] font-black
              uppercase tracking-widest text-amber-400/70">
              <AlertTriangle size={10} /> Não salvo
            </span>
          )}
          <span className="text-[8px] font-black uppercase tracking-widest
            text-white/20">
            {draft.status === "published" ? "✓ Publicado" : "Rascunho"}
          </span>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2 flex-wrap">

          {/* Preview */}
          <button
            onClick={() => setPreview(p => !p)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl
              bg-white/5 text-[9px] font-black uppercase tracking-widest
              text-white/30 hover:text-white/60 transition-all"
          >
            {preview ? <EyeOff size={11} /> : <Eye size={11} />}
            {preview ? "Editar" : "Preview"}
          </button>

          {/* Gerar IA */}
          {onGerarIA && (
            <button
              onClick={onGerarIA}
              disabled={gerandoIA}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl
                bg-sky-500/10 border border-sky-500/20 text-[9px] font-black
                uppercase tracking-widest text-sky-400
                hover:bg-sky-500/20 transition-all
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {gerandoIA
                ? <><Loader2 size={11} className="animate-spin" /> Gerando...</>
                : <><Sparkles size={11} /> Regerar IA</>
              }
            </button>
          )}

          {/* Salvar */}
          <button
            onClick={handleSave}
            disabled={salvando || !alterado}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl
              bg-white/8 border border-white/10 text-[9px] font-black
              uppercase tracking-widest text-white/50
              hover:text-white hover:border-white/20 transition-all
              disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {salvando
              ? <><Loader2 size={11} className="animate-spin" /> Salvando...</>
              : <><Save size={11} /> Salvar</>
            }
          </button>

          {/* Publicar */}
          {draft.status !== "published" && (
            <button
              onClick={() => setConfirmarPub(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl
                bg-emerald-500 text-black text-[9px] font-black uppercase
                tracking-widest hover:bg-emerald-400 active:scale-95
                transition-all"
            >
              <Send size={11} /> Publicar
            </button>
          )}

          {/* Cancelar */}
          {onCancel && (
            <button
              onClick={onCancel}
              className="p-2 rounded-xl bg-white/5 text-white/20
                hover:text-rose-400 transition-all"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Confirmar publicação ───────────────────────────────── */}
      <AnimatePresence>
        {confirmarPub && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0  }}
            exit={{    opacity: 0, y: -8 }}
            className="bg-emerald-500/8 border border-emerald-500/20
              rounded-[18px] p-4 flex flex-wrap items-center
              justify-between gap-3"
          >
            <div className="space-y-0.5">
              <p className="text-sm font-black italic uppercase text-white
                tracking-tighter">
                Publicar para{" "}
                <span className="text-emerald-400">{draft.alunoNome}</span>?
              </p>
              <p className="text-[9px] text-white/30">
                O aluno será notificado e o cardápio ficará visível imediatamente.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmarPub(false)}
                className="px-4 py-2.5 bg-white/5 rounded-xl text-[9px]
                  font-black uppercase tracking-widest text-white/30
                  hover:text-white/60 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handlePublish}
                disabled={publicando}
                className="flex items-center gap-2 px-4 py-2.5
                  bg-emerald-500 text-black rounded-xl text-[9px]
                  font-black uppercase tracking-widest
                  hover:bg-emerald-400 transition-all
                  disabled:opacity-40"
              >
                {publicando
                  ? <><Loader2 size={11} className="animate-spin" /> Publicando...</>
                  : <><Send size={11} /> Confirmar</>
                }
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Metadados do cardápio ──────────────────────────────── */}
      <div className="bg-[#050B14] border border-white/5 rounded-[20px] p-5
        space-y-4">
        <p className="text-[8px] font-black uppercase tracking-widest
          text-white/20">
          Configurações do plano
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Título */}
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-[7px] font-black uppercase tracking-widest
              text-white/20">
              Título
            </label>
            <InlineInput
              value={draft.titulo}
              onChange={v => updateField("titulo", v)}
              placeholder="Título do cardápio"
              className="text-sm font-black"
            />
          </div>

          {/* Foco */}
          <div className="space-y-1.5">
            <label className="text-[7px] font-black uppercase tracking-widest
              text-white/20">
              Foco
            </label>
            <select
              value={draft.foco}
              onChange={e => updateField("foco", e.target.value as FocoNutricional)}
              className="w-full bg-white/5 border border-white/8 rounded-lg
                px-3 py-2 text-xs text-white/60 outline-none
                focus:border-sky-500/40 transition-all"
            >
              {FOCOS_NUTRICAO.map(f => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
          </div>

          {/* Semana */}
          <div className="space-y-1.5">
            <label className="text-[7px] font-black uppercase tracking-widest
              text-white/20">
              Semana
            </label>
            <InlineInput
              value={draft.semana}
              onChange={v => updateField("semana", v)}
              placeholder="2026-W15"
            />
          </div>

          {/* Meta calórica */}
          <div className="space-y-1.5">
            <label className="text-[7px] font-black uppercase tracking-widest
              text-white/20 flex items-center gap-1">
              <Flame size={9} className="text-orange-400" />
              Meta calórica (kcal/dia)
            </label>
            <InlineInput
              type="number"
              value={draft.calorias_dia ?? ""}
              onChange={v => updateField("calorias_dia", Number(v) || undefined)}
              placeholder="ex: 2000"
              min={0}
            />
          </div>

          {/* Meta proteica */}
          <div className="space-y-1.5">
            <label className="text-[7px] font-black uppercase tracking-widest
              text-white/20 flex items-center gap-1">
              <Beef size={9} className="text-rose-400" />
              Meta proteica (g/dia)
            </label>
            <InlineInput
              type="number"
              value={draft.proteinas_dia ?? ""}
              onChange={v => updateField("proteinas_dia", Number(v) || undefined)}
              placeholder="ex: 150"
              min={0}
            />
          </div>

          {/* Obs geral */}
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-[7px] font-black uppercase tracking-widest
              text-white/20">
              Orientações gerais
            </label>
            <textarea
              value={draft.obs}
              onChange={e => updateField("obs", e.target.value)}
              placeholder="Orientações, dicas e observações para o aluno..."
              rows={3}
              className="w-full bg-white/5 border border-white/8 rounded-xl
                px-3 py-2.5 text-xs text-white/60 outline-none resize-none
                focus:border-sky-500/40 placeholder:text-white/15
                transition-all leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* ── Seletor de dia ────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-1
        scrollbar-none snap-x snap-mandatory">
        {diasVisiveis.map(dia => {
          const d      = draft.dias.find(x => x.dia === dia);
          const nRef   = d?.refeicoes.length ?? 0;
          const nAlim  = d?.refeicoes.reduce(
            (a, r) => a + (Array.isArray(r.alimentos) ? r.alimentos.length : 1), 0
          ) ?? 0;

          return (
            <button
              key={dia}
              onClick={() => setDiaAtivo(dia)}
              className={`snap-start shrink-0 flex flex-col items-center
                gap-1 px-3 py-2.5 rounded-[14px] border transition-all
                min-w-[58px]
                ${diaAtivo === dia
                  ? "bg-sky-500/15 border-sky-500/30 text-sky-400"
                  : "bg-white/3 border-white/5 text-white/25 hover:border-white/15"
                }`}
            >
              <span className="text-[8px] font-black uppercase tracking-widest">
                {dia.slice(0, 3)}
              </span>
              <span className="text-[7px] font-bold opacity-50">
                {nRef} ref.
              </span>
              {nAlim > 0 && (
                <span className="text-[6px] opacity-30">{nAlim} alim.</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Totais do dia ─────────────────────────────────────── */}
      {(totalDia.cal > 0 || totalDia.prot > 0) && (
        <div className="flex flex-wrap gap-3 px-1">
          {[
            { icon: Flame,    val: totalDia.cal,  unit: "kcal", cor: "text-orange-400", label: "Total dia" },
            { icon: Beef,     val: totalDia.prot, unit: "g",    cor: "text-rose-400",   label: "Proteína"  },
            { icon: Wheat,    val: totalDia.carb, unit: "g",    cor: "text-amber-400",  label: "Carb."     },
            { icon: Droplets, val: totalDia.gord, unit: "g",    cor: "text-sky-400",    label: "Gordura"   },
          ].filter(x => x.val > 0).map(item => (
            <div key={item.label}
              className="flex items-center gap-1.5 bg-white/3
                border border-white/5 rounded-xl px-3 py-2">
              <item.icon size={10} className={item.cor} />
              <div>
                <p className="text-[6px] font-black uppercase tracking-widest
                  text-white/20 leading-none">
                  {item.label}
                </p>
                <p className="text-[10px] font-black text-white/50 leading-none mt-0.5">
                  {Math.round(item.val)}{item.unit}
                </p>
              </div>
            </div>
          ))}

          {/* Comparação com meta */}
          {draft.calorias_dia && totalDia.cal > 0 && (
            <div className={`flex items-center gap-1.5 px-3 py-2
              rounded-xl border text-[9px] font-black
              ${Math.abs(totalDia.cal - draft.calorias_dia) < 100
                ? "bg-emerald-500/8 border-emerald-500/15 text-emerald-400"
                : totalDia.cal > draft.calorias_dia
                  ? "bg-rose-500/8 border-rose-500/15 text-rose-400"
                  : "bg-amber-500/8 border-amber-500/15 text-amber-400"
              }`}>
              {totalDia.cal > draft.calorias_dia
                ? `+${Math.round(totalDia.cal - draft.calorias_dia)} kcal acima`
                : `${Math.round(draft.calorias_dia - totalDia.cal)} kcal abaixo`
              } da meta
            </div>
          )}
        </div>
      )}

      {/* ── Editor de refeições ────────────────────────────────── */}
      <div className="space-y-3">

        {/* Ações do dia */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-black italic uppercase text-white
            tracking-tighter">
            {diaAtivo}
            <span className="ml-2 text-[8px] font-black text-white/20
              normal-case not-italic">
              {diaData?.refeicoes.length ?? 0} refeições
            </span>
          </h3>
          <div className="flex gap-2">
            {(!diaData || diaData.refeicoes.length === 0) && (
              <button
                onClick={addRefeicoesPadrao}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl
                  bg-white/5 border border-white/5 text-[8px] font-black
                  uppercase tracking-widest text-white/25
                  hover:text-sky-400 hover:border-sky-500/20 transition-all"
              >
                <RotateCcw size={11} /> Padrão
              </button>
            )}
            {diaData && diaData.refeicoes.length > 0 && (
              <button
                onClick={copiarParaTodos}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl
                  bg-white/5 border border-white/5 text-[8px] font-black
                  uppercase tracking-widest text-white/25
                  hover:text-amber-400 hover:border-amber-500/20 transition-all"
              >
                <UtensilsCrossed size={11} /> Copiar p/ todos
              </button>
            )}
          </div>
        </div>

        {/* Lista de refeições */}
        <AnimatePresence>
          {diaData && diaData.refeicoes.length > 0 ? (
            diaData.refeicoes.map(refeicao => (
              <motion.div
                key={refeicao.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{    opacity: 0, y: 6 }}
              >
                <RefeicaoEditorCard
                  refeicao={refeicao}
                  onUpdate={patch => updateRefeicao(refeicao.id, patch)}
                  onRemove={() => removeRefeicao(refeicao.id)}
                  onAddAlimento={() => addAlimento(refeicao.id)}
                  onOpenManual={manualDisponivel ? () => abrirManualParaRefeicao(refeicao.id) : undefined}
                />
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 gap-3
                border border-dashed border-white/8 rounded-[18px]"
            >
              <UtensilsCrossed size={24} className="text-white/8" />
              <p className="text-[9px] font-black uppercase tracking-widest
                text-white/15 text-center">
                Nenhuma refeição em {diaAtivo}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Adicionar refeição */}
        <button
          onClick={addRefeicao}
          className="w-full flex items-center justify-center gap-2 py-3.5
            border border-dashed border-white/10 rounded-[18px]
            text-[9px] font-black uppercase tracking-widest text-white/20
            hover:text-sky-400 hover:border-sky-500/25 transition-all"
        >
          <Plus size={14} /> Nova refeição em {diaAtivo}
        </button>
      </div>
    </div>
  );
}
