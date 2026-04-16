"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, Ruler, Activity, Plus, Camera,
  AlertTriangle, RefreshCw, ChevronDown, ChevronUp,
  Scale, Target, X, CheckCircle2, BarChart3,
} from "lucide-react";
import { estimarBF } from "@/lib/communities/bf-estimator";
import { toast } from "sonner";

// ══════════════════════════════════════════════════════════════════
// TIPOS
// ══════════════════════════════════════════════════════════════════
interface Medida {
  id:           string;
  created_at:   string;
  peso_kg:      number | null;
  altura_cm:    number | null;
  cintura_cm:   number | null;
  quadril_cm:   number | null;
  biceps_cm:    number | null;
  bf_estimado:  number | null;
  objetivo:     string | null;
  obs:          string | null;
}

interface CommunityEvolutionProps {
  currentUser:  any;
  communityId:  string;
  userTags:     string[];
  onNotify?:    (n: any) => void;
}

type View = "dashboard" | "novo_registro" | "historico" | "bf_calc";

// ══════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════
function calcDiff(atual: number | null, anterior: number | null): string | null {
  if (atual == null || anterior == null) return null;
  const diff = atual - anterior;
  return diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// ══════════════════════════════════════════════════════════════════
// COMPONENTE
// ══════════════════════════════════════════════════════════════════
export function CommunityEvolution({
  currentUser, communityId, userTags, onNotify,
}: CommunityEvolutionProps) {
  const [view, setView]           = useState<View>("dashboard");
  const [medidas, setMedidas]     = useState<Medida[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [showBFCalc, setShowBFCalc] = useState(false);

  // Formulário de novo registro
  const [form, setForm] = useState({
    peso_kg:   "",
    altura_cm: "",
    cintura_cm:"",
    quadril_cm:"",
    biceps_cm: "",
    objetivo:  "",
    sexo:      "M" as "M" | "F",
    obs:       "",
  });

  // Resultado BF
  const [bfResult, setBfResult] = useState<ReturnType<typeof estimarBF> | null>(null);

  // ── Carrega medidas ────────────────────────────────────────────
  const loadMedidas = useCallback(async () => {
    if (!currentUser?.id) { setLoading(false); return; }
    setLoading(true);
    try {
      const res  = await fetch(
        `/api/communities/${communityId}/medidas?userId=${currentUser.id}`
      );
      const data = res.ok ? await res.json() : {};
      setMedidas(data.medidas ?? []);
    } catch {
      setMedidas([]);
    } finally {
      setLoading(false);
    }
  }, [communityId, currentUser?.id]);

  useEffect(() => { loadMedidas(); }, [loadMedidas]);

  // ── Calcula BF ao preencher medidas ───────────────────────────
  useEffect(() => {
    const { cintura_cm, quadril_cm, altura_cm, peso_kg, sexo } = form;
    if (cintura_cm && altura_cm && peso_kg) {
      try {
        const result = estimarBF({
          sexo,
          cintura_cm: parseFloat(cintura_cm),
          quadril_cm: parseFloat(quadril_cm || cintura_cm),
          altura_cm:  parseFloat(altura_cm),
          peso_kg:    parseFloat(peso_kg),
        });
        setBfResult(result);
      } catch {
        setBfResult(null);
      }
    } else {
      setBfResult(null);
    }
  }, [form.cintura_cm, form.quadril_cm, form.altura_cm, form.peso_kg, form.sexo]);

  // ── Salvar medida ──────────────────────────────────────────────
  const handleSalvar = async () => {
    if (!form.peso_kg && !form.cintura_cm) {
      toast.warning("Preencha ao menos peso ou cintura.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        userId:       currentUser?.id,
        comunidadeId: communityId,
        peso_kg:      form.peso_kg    ? parseFloat(form.peso_kg)    : null,
        altura_cm:    form.altura_cm  ? parseFloat(form.altura_cm)  : null,
        cintura_cm:   form.cintura_cm ? parseFloat(form.cintura_cm) : null,
        quadril_cm:   form.quadril_cm ? parseFloat(form.quadril_cm) : null,
        biceps_cm:    form.biceps_cm  ? parseFloat(form.biceps_cm)  : null,
        bf_estimado:  bfResult?.bf_estimado ?? null,
        sexo:         form.sexo,
        objetivo:     form.objetivo || null,
        obs:          form.obs      || null,
      };

      const res = await fetch(`/api/communities/${communityId}/medidas`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Falha ao salvar");

      onNotify?.({
        title:   "Biometria Registrada",
        type:    "social",
      });

      toast.success("Dados sincronizados com sucesso.");
      setForm({
        peso_kg: "", altura_cm: "", cintura_cm: "",
        quadril_cm: "", biceps_cm: "", objetivo: "",
        sexo: "M", obs: "",
      });
      setBfResult(null);
      setView("dashboard");
      await loadMedidas();
    } catch (err: any) {
      toast.error("Erro ao salvar biometria: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Derivados ──────────────────────────────────────────────────
  const ultima   = medidas[0]  ?? null;
  const anterior = medidas[1]  ?? null;

  const metricsCards = [
    {
      label:  "Peso Atual",
      value:  ultima?.peso_kg    ? `${ultima.peso_kg}kg`   : "—",
      change: calcDiff(ultima?.peso_kg ?? null, anterior?.peso_kg ?? null),
      icon:   Scale,
      color:  "text-sky-500",
      bg:     "bg-sky-500/10 border-sky-500/20",
    },
    {
      label:  "Cintura",
      value:  ultima?.cintura_cm ? `${ultima.cintura_cm}cm` : "—",
      change: calcDiff(ultima?.cintura_cm ?? null, anterior?.cintura_cm ?? null),
      icon:   Ruler,
      color:  "text-emerald-500",
      bg:     "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label:  "BF Estimado",
      value:  ultima?.bf_estimado != null ? `${ultima.bf_estimado}%` : "—",
      change: calcDiff(ultima?.bf_estimado ?? null, anterior?.bf_estimado ?? null),
      icon:   TrendingUp,
      color:  "text-rose-500",
      bg:     "bg-rose-500/10 border-rose-500/20",
    },
    {
      label:  "Bíceps",
      value:  ultima?.biceps_cm  ? `${ultima.biceps_cm}cm`  : "—",
      change: calcDiff(ultima?.biceps_cm ?? null, anterior?.biceps_cm ?? null),
      icon:   Activity,
      color:  "text-purple-500",
      bg:     "bg-purple-500/10 border-purple-500/20",
    },
  ];

  // ══════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 text-left">

      {/* ── HEADER ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white leading-none">
            Relatório de <span className="text-sky-500">Performance</span>
          </h2>
          <p className="text-[10px] font-black uppercase text-white/20 tracking-widest mt-1.5 italic">
            Sincronia de dados biométricos
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {medidas.length > 0 && (
            <button
              onClick={() => setView(view === "historico" ? "dashboard" : "historico")}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase text-white/40 hover:text-white hover:border-white/20 transition-all"
            >
              <BarChart3 size={13} />
              Histórico
            </button>
          )}
          <button
            onClick={() => setView(view === "novo_registro" ? "dashboard" : "novo_registro")}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-500 text-black rounded-xl text-[10px] font-black uppercase hover:scale-105 transition-all shadow-lg"
          >
            {view === "novo_registro"
              ? <><X size={13} /> Cancelar</>
              : <><Plus size={13} /> Novo Registro</>
            }
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ══════════════════════════════════════════════════════
            VIEW: NOVO REGISTRO
            ══════════════════════════════════════════════════════ */}
        {view === "novo_registro" && (
          <motion.div
            key="novo"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-gradient-to-br from-[#050B14] to-[#0A1222] border border-white/5 rounded-[28px] p-6 sm:p-10 shadow-2xl"
          >
            <div className="max-w-2xl mx-auto space-y-7">

              {/* Título */}
              <div className="text-center">
                <div className="w-14 h-14 bg-sky-500/10 text-sky-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-sky-500/20">
                  <Activity size={26} />
                </div>
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">
                  Novo Registro Biométrico
                </h3>
                <p className="text-xs text-white/25 mt-2 leading-relaxed max-w-sm mx-auto">
                  Registre suas medidas para acompanhar sua evolução ao longo do tempo.
                </p>
              </div>

              {/* Sexo */}
              <div className="flex gap-3">
                {[{ v: "M", l: "Masculino" }, { v: "F", l: "Feminino" }].map(s => (
                  <button
                    key={s.v}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, sexo: s.v as "M" | "F" }))}
                    className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all
                      ${form.sexo === s.v
                        ? "bg-sky-500/10 border-sky-500 text-sky-400"
                        : "bg-white/5 border-white/10 text-white/25 hover:border-white/20"}`}
                  >
                    {s.l}
                  </button>
                ))}
              </div>

              {/* Campos de medida */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: "peso_kg",    label: "Peso (kg)",     placeholder: "80.5", icon: Scale    },
                  { key: "altura_cm",  label: "Altura (cm)",   placeholder: "175",  icon: Ruler    },
                  { key: "cintura_cm", label: "Cintura (cm)",  placeholder: "80",   icon: Target   },
                  { key: "quadril_cm", label: "Quadril (cm)",  placeholder: "95",   icon: Target   },
                  { key: "biceps_cm",  label: "Bíceps (cm)",   placeholder: "38",   icon: Activity },
                ].map(f => (
                  <div key={f.key} className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-white/30 flex items-center gap-1.5">
                      <f.icon size={11} /> {f.label}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder={f.placeholder}
                      value={(form as any)[f.key]}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full bg-[#010307] border border-white/10 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-sky-500/40 transition-all"
                    />
                  </div>
                ))}

                {/* Objetivo */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/30">
                    Objetivo
                  </label>
                  <select
                    value={form.objetivo}
                    onChange={e => setForm(p => ({ ...p, objetivo: e.target.value }))}
                    className="w-full bg-[#010307] border border-white/10 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-sky-500/40 transition-all appearance-none"
                  >
                    <option value="">Selecionar...</option>
                    <option value="emagrecimento">Emagrecimento</option>
                    <option value="hipertrofia">Hipertrofia</option>
                    <option value="recomposicao">Recomposição</option>
                    <option value="manutencao">Manutenção</option>
                    <option value="performance">Performance</option>
                  </select>
                </div>
              </div>

              {/* Obs */}
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-white/30">
                  Observações (opcional)
                </label>
                <textarea
                  value={form.obs}
                  onChange={e => setForm(p => ({ ...p, obs: e.target.value }))}
                  placeholder="Como você está se sentindo? Alguma observação relevante..."
                  className="w-full bg-[#010307] border border-white/10 rounded-xl py-3 px-4 text-sm text-white h-20 resize-none outline-none focus:border-sky-500/40 transition-all placeholder:text-white/15"
                />
              </div>

              {/* Preview BF estimado */}
              <AnimatePresence>
                {bfResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-5 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-sky-400 tracking-widest">
                        BF Estimado (Fórmula Navy)
                      </span>
                      <span className="text-2xl font-black italic text-sky-400">
                        {bfResult.bf_estimado}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white/40">
                        {bfResult.classificacao}
                      </span>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-6 h-1.5 rounded-full transition-all ${
                              i < Math.ceil(bfResult.bf_estimado / 12)
                                ? "bg-sky-500"
                                : "bg-white/10"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-[9px] text-orange-400/70 leading-relaxed">
                      {bfResult.aviso}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Aviso ético */}
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 flex gap-3 items-start">
                <AlertTriangle size={15} className="text-orange-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-orange-500/80 leading-relaxed font-medium">
                  Dados de apoio para acompanhamento remoto. Não substituem avaliação
                  presencial ou bioimpedância. Revisão profissional recomendada.
                </p>
              </div>

              <button
                onClick={handleSalvar}
                disabled={saving}
                className="w-full py-4 bg-sky-500 text-black font-black uppercase tracking-widest text-xs rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {saving
                  ? <><RefreshCw size={14} className="animate-spin" /> Salvando...</>
                  : "Registrar Biometria"
                }
              </button>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════
            VIEW: HISTÓRICO
            ══════════════════════════════════════════════════════ */}
        {view === "historico" && (
          <motion.div
            key="historico"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {loading ? (
              <div className="py-16 flex justify-center">
                <RefreshCw className="animate-spin text-sky-500" size={24} />
              </div>
            ) : medidas.length === 0 ? (
              <div className="py-16 text-center opacity-20">
                <BarChart3 size={32} className="mx-auto mb-3" />
                <p className="text-[10px] font-black uppercase tracking-widest">
                  Nenhum registro encontrado
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {medidas.map((m, idx) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-[#050B14] border border-white/5 rounded-[22px] p-5 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[9px] font-black uppercase text-white/25 tracking-widest">
                        {formatDate(m.created_at)}
                      </span>
                      {idx === 0 && (
                        <span className="px-2 py-0.5 bg-sky-500/10 text-sky-400 text-[8px] font-black uppercase rounded-full border border-sky-500/20">
                          Mais Recente
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: "Peso",    value: m.peso_kg    ? `${m.peso_kg}kg`    : "—", color: "text-sky-400"     },
                        { label: "Cintura", value: m.cintura_cm ? `${m.cintura_cm}cm` : "—", color: "text-emerald-400" },
                        { label: "BF%",     value: m.bf_estimado != null ? `${m.bf_estimado}%` : "—", color: "text-rose-400" },
                        { label: "Bíceps",  value: m.biceps_cm  ? `${m.biceps_cm}cm`  : "—", color: "text-purple-400"  },
                      ].map(stat => (
                        <div key={stat.label} className="bg-white/5 rounded-xl p-3 border border-white/5">
                          <span className="text-[8px] font-black uppercase text-white/20 tracking-widest block mb-1">
                            {stat.label}
                          </span>
                          <span className={`text-base font-black italic ${stat.color}`}>
                            {stat.value}
                          </span>
                        </div>
                      ))}
                    </div>
                    {m.obs && (
                      <p className="mt-3 text-[10px] text-white/25 italic border-t border-white/5 pt-3">
                        "{m.obs}"
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════
            VIEW: DASHBOARD
            ══════════════════════════════════════════════════════ */}
        {view === "dashboard" && (
          <motion.div
            key="dash"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {loading ? (
              <div className="py-16 flex justify-center">
                <RefreshCw className="animate-spin text-sky-500" size={24} />
              </div>
            ) : (
              <>
                {/* Métricas principais */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {metricsCards.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className={`${m.bg} border rounded-[22px] p-5 relative overflow-hidden`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-2.5 rounded-xl bg-white/5 ${m.color} border border-white/5`}>
                          <m.icon size={16} />
                        </div>
                        {m.change && (
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full bg-white/5 border border-white/10
                            ${m.change.startsWith("+") ? "text-emerald-400" : "text-rose-400"}`}>
                            {m.change}
                          </span>
                        )}
                      </div>
                      <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">
                        {m.label}
                      </p>
                      <h4 className="text-2xl font-black italic text-white">{m.value}</h4>
                    </motion.div>
                  ))}
                </div>

                {/* Sem registros — CTA */}
                {medidas.length === 0 && (
                  <div className="bg-[#050B14] border border-dashed border-white/10 rounded-[28px] p-10 text-center space-y-4">
                    <Activity size={32} className="mx-auto text-white/10" />
                    <p className="text-[10px] font-black uppercase text-white/20 tracking-widest">
                      Nenhum registro biométrico ainda
                    </p>
                    <button
                      onClick={() => setView("novo_registro")}
                      className="px-6 py-3 bg-sky-500 text-black font-black uppercase text-[10px] rounded-xl hover:scale-105 transition-all"
                    >
                      Fazer Primeiro Registro
                    </button>
                  </div>
                )}

                {/* Evolução resumida */}
                {medidas.length >= 2 && (
                  <div className="bg-[#050B14] border border-white/5 rounded-[28px] p-6 sm:p-8 shadow-xl">
                    <h3 className="text-sm font-black uppercase tracking-widest text-white mb-5 flex items-center gap-2">
                      <TrendingUp size={16} className="text-sky-500" /> Evolução Geral
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        {
                          label:   "Variação de Peso",
                          value:   calcDiff(ultima?.peso_kg ?? null, medidas[medidas.length - 1]?.peso_kg ?? null),
                          sub:     `${medidas[medidas.length - 1]?.peso_kg ?? "—"}kg → ${ultima?.peso_kg ?? "—"}kg`,
                          good:    (v: string) => v.startsWith("-"),
                          color:   "sky",
                        },
                        {
                          label:   "Variação de Cintura",
                          value:   calcDiff(ultima?.cintura_cm ?? null, medidas[medidas.length - 1]?.cintura_cm ?? null),
                          sub:     `${medidas[medidas.length - 1]?.cintura_cm ?? "—"}cm → ${ultima?.cintura_cm ?? "—"}cm`,
                          good:    (v: string) => v.startsWith("-"),
                          color:   "emerald",
                        },
                        {
                          label:   "Variação de BF%",
                          value:   calcDiff(ultima?.bf_estimado ?? null, medidas[medidas.length - 1]?.bf_estimado ?? null),
                          sub:     `${medidas[medidas.length - 1]?.bf_estimado ?? "—"}% → ${ultima?.bf_estimado ?? "—"}%`,
                          good:    (v: string) => v.startsWith("-"),
                          color:   "rose",
                        },
                      ].map((ev, i) => (
                        <div key={i} className="bg-white/5 border border-white/5 rounded-2xl p-5">
                          <p className="text-[8px] font-black uppercase text-white/20 tracking-widest mb-2">
                            {ev.label}
                          </p>
                          <p className={`text-2xl font-black italic mb-1
                            ${ev.value
                              ? ev.good(ev.value) ? "text-emerald-400" : "text-rose-400"
                              : "text-white/20"}`}>
                            {ev.value ?? "—"}
                          </p>
                          <p className="text-[9px] text-white/20 font-medium">{ev.sub}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Antes e Depois */}
                <div className="bg-[#050B14] border border-white/5 rounded-[28px] p-6 sm:p-8 shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <Camera size={18} className="text-sky-500" />
                    <h4 className="text-sm font-black uppercase tracking-widest text-white">
                      Registro Visual Alpha
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="aspect-[3/4] bg-white/5 rounded-[22px] border border-white/5 overflow-hidden relative group cursor-pointer hover:border-white/10 transition-colors">
                      <div className="absolute top-3 left-3 z-10 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[8px] font-black uppercase text-white/40">
                        Inicial
                      </div>
                      <div className="w-full h-full flex flex-col items-center justify-center text-white/10 gap-2">
                        <Camera size={24} className="opacity-20" />
                        <span className="text-[8px] font-black uppercase tracking-widest opacity-20">
                          Adicionar Foto
                        </span>
                      </div>
                    </div>
                    <div className="aspect-[3/4] bg-white/5 rounded-[22px] border border-sky-500/20 overflow-hidden relative group cursor-pointer hover:border-sky-500/40 transition-colors">
                      <div className="absolute top-3 left-3 z-10 bg-sky-500 px-2.5 py-1 rounded-full text-[8px] font-black uppercase text-black">
                        Atual
                      </div>
                      <div className="w-full h-full flex flex-col items-center justify-center text-white/10 gap-2">
                        <Camera size={24} className="opacity-20" />
                        <span className="text-[8px] font-black uppercase tracking-widest opacity-20">
                          Adicionar Foto
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
