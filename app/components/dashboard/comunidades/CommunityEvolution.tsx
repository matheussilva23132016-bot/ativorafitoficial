"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Camera,
  CheckCircle2,
  ChevronDown,
  Clock,
  Plus,
  RefreshCw,
  Ruler,
  Scale,
  Target,
  TrendingUp,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { estimarBF } from "@/lib/communities/bf-estimator";

interface Medida {
  id: string;
  created_at: string;
  peso_kg: number | null;
  altura_cm: number | null;
  cintura_cm: number | null;
  quadril_cm: number | null;
  biceps_cm: number | null;
  bf_estimado: number | null;
  objetivo: string | null;
  obs: string | null;
}

interface CommunityEvolutionProps {
  currentUser: any;
  communityId: string;
  userTags: string[];
  onNotify?: (n: any) => void;
}

type View = "dashboard" | "novo_registro" | "historico";
type HistoryRange = "7d" | "30d" | "all";

function parseNumber(value: string): number | null {
  if (!value.trim()) return null;
  const normalized = Number(value.replace(",", "."));
  return Number.isFinite(normalized) ? normalized : null;
}

function calcDiff(current: number | null, previous: number | null): number | null {
  if (current == null || previous == null) return null;
  return parseFloat((current - previous).toFixed(1));
}

function formatMeasure(value: number | null, unit: string): string {
  if (value == null) return "--";
  const text = Number.isInteger(value) ? String(value) : value.toFixed(1).replace(".0", "");
  return `${text}${unit}`;
}

function formatDiff(value: number | null, unit: string): string | null {
  if (value == null) return null;
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(1).replace(".0", "")}${unit}`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toTimestamp(value: string): number {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function diffTone(diff: number | null, preferDecrease = false): string {
  if (diff == null || diff === 0) return "text-white/45";
  if (preferDecrease) return diff < 0 ? "text-emerald-300" : "text-rose-300";
  return diff > 0 ? "text-emerald-300" : "text-rose-300";
}

export function CommunityEvolution({
  currentUser,
  communityId,
  onNotify,
}: CommunityEvolutionProps) {
  const [view, setView] = useState<View>("dashboard");
  const [medidas, setMedidas] = useState<Medida[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [historyRange, setHistoryRange] = useState<HistoryRange>("30d");
  const [historyLimit, setHistoryLimit] = useState(8);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileStats, setShowMobileStats] = useState(false);
  const [showMobileHistoryFilters, setShowMobileHistoryFilters] = useState(false);
  const [showMobileConsolidado, setShowMobileConsolidado] = useState(false);
  const [showMobileTimeline, setShowMobileTimeline] = useState(false);
  const [showVisual, setShowVisual] = useState(false);
  const [expandedObs, setExpandedObs] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState({
    peso_kg: "",
    altura_cm: "",
    cintura_cm: "",
    quadril_cm: "",
    biceps_cm: "",
    objetivo: "",
    sexo: "M" as "M" | "F",
    obs: "",
  });
  const [bfResult, setBfResult] = useState<ReturnType<typeof estimarBF> | null>(null);

  const canRegister = Boolean(currentUser?.id);

  const loadMedidas = useCallback(async () => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/communities/${communityId}/medidas?userId=${encodeURIComponent(currentUser.id)}`,
      );
      const data = res.ok ? await res.json() : {};
      setMedidas(Array.isArray(data.medidas) ? data.medidas : []);
    } catch {
      setMedidas([]);
    } finally {
      setLoading(false);
    }
  }, [communityId, currentUser?.id]);

  useEffect(() => {
    loadMedidas();
  }, [loadMedidas]);

  useEffect(() => {
    const peso = parseNumber(form.peso_kg);
    const altura = parseNumber(form.altura_cm);
    const cintura = parseNumber(form.cintura_cm);
    const quadril = parseNumber(form.quadril_cm);

    if (peso == null || altura == null || cintura == null) {
      setBfResult(null);
      return;
    }

    try {
      const result = estimarBF({
        sexo: form.sexo,
        peso_kg: peso,
        altura_cm: altura,
        cintura_cm: cintura,
        quadril_cm: quadril ?? cintura,
      });
      setBfResult(result);
    } catch {
      setBfResult(null);
    }
  }, [form.peso_kg, form.altura_cm, form.cintura_cm, form.quadril_cm, form.sexo]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateViewport = () => setIsMobile(window.innerWidth < 640);
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    setHistoryLimit(isMobile ? 4 : 8);
  }, [historyRange, isMobile]);

  useEffect(() => {
    if (historyRange !== "30d") setShowMobileHistoryFilters(true);
  }, [historyRange]);

  const handleSalvar = async () => {
    const peso = parseNumber(form.peso_kg);
    const cintura = parseNumber(form.cintura_cm);

    if (peso == null && cintura == null) {
      toast.warning("Preencha ao menos peso ou cintura.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        userId: currentUser?.id,
        comunidadeId: communityId,
        peso_kg: peso,
        altura_cm: parseNumber(form.altura_cm),
        cintura_cm: cintura,
        quadril_cm: parseNumber(form.quadril_cm),
        biceps_cm: parseNumber(form.biceps_cm),
        bf_estimado: bfResult?.bf_estimado ?? null,
        sexo: form.sexo,
        objetivo: form.objetivo || null,
        obs: form.obs || null,
      };

      const res = await fetch(`/api/communities/${communityId}/medidas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Falha ao salvar");

      onNotify?.({
        title: "Biometria registrada",
        message: "Seu progresso foi atualizado na comunidade.",
        type: "social",
      });
      toast.success("Registro salvo com sucesso.");

      setForm({
        peso_kg: "",
        altura_cm: "",
        cintura_cm: "",
        quadril_cm: "",
        biceps_cm: "",
        objetivo: "",
        sexo: "M",
        obs: "",
      });
      setBfResult(null);
      setView("dashboard");
      await loadMedidas();
    } catch (err: any) {
      toast.error(`Erro ao salvar biometria: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const ultima = medidas[0] ?? null;
  const anterior = medidas[1] ?? null;
  const primeira = medidas.length > 0 ? medidas[medidas.length - 1] : null;

  const totalRegistros = medidas.length;
  const objetivoAtual = ultima?.objetivo ?? null;
  const ultimaAtualizacao = ultima ? formatDateTime(ultima.created_at) : null;

  const metricas = [
    {
      label: "Peso atual",
      value: formatMeasure(ultima?.peso_kg ?? null, " kg"),
      diff: calcDiff(ultima?.peso_kg ?? null, anterior?.peso_kg ?? null),
      icon: Scale,
      tone: "text-sky-300",
      card: "bg-sky-500/10 border-sky-500/20",
      preferDecrease: false,
    },
    {
      label: "Cintura",
      value: formatMeasure(ultima?.cintura_cm ?? null, " cm"),
      diff: calcDiff(ultima?.cintura_cm ?? null, anterior?.cintura_cm ?? null),
      icon: Ruler,
      tone: "text-emerald-300",
      card: "bg-emerald-500/10 border-emerald-500/20",
      preferDecrease: true,
    },
    {
      label: "BF estimado",
      value: formatMeasure(ultima?.bf_estimado ?? null, "%"),
      diff: calcDiff(ultima?.bf_estimado ?? null, anterior?.bf_estimado ?? null),
      icon: TrendingUp,
      tone: "text-rose-300",
      card: "bg-rose-500/10 border-rose-500/20",
      preferDecrease: true,
    },
    {
      label: "Bíceps",
      value: formatMeasure(ultima?.biceps_cm ?? null, " cm"),
      diff: calcDiff(ultima?.biceps_cm ?? null, anterior?.biceps_cm ?? null),
      icon: Activity,
      tone: "text-amber-300",
      card: "bg-amber-500/10 border-amber-500/20",
      preferDecrease: false,
    },
  ];

  const resumoEvolucao = [
    {
      label: "Peso",
      inicial: formatMeasure(primeira?.peso_kg ?? null, " kg"),
      atual: formatMeasure(ultima?.peso_kg ?? null, " kg"),
      diff: calcDiff(ultima?.peso_kg ?? null, primeira?.peso_kg ?? null),
      preferDecrease: false,
    },
    {
      label: "Cintura",
      inicial: formatMeasure(primeira?.cintura_cm ?? null, " cm"),
      atual: formatMeasure(ultima?.cintura_cm ?? null, " cm"),
      diff: calcDiff(ultima?.cintura_cm ?? null, primeira?.cintura_cm ?? null),
      preferDecrease: true,
    },
    {
      label: "BF",
      inicial: formatMeasure(primeira?.bf_estimado ?? null, "%"),
      atual: formatMeasure(ultima?.bf_estimado ?? null, "%"),
      diff: calcDiff(ultima?.bf_estimado ?? null, primeira?.bf_estimado ?? null),
      preferDecrease: true,
    },
  ];

  const periodosHistorico: { id: HistoryRange; label: string }[] = [
    { id: "7d", label: "7 dias" },
    { id: "30d", label: "30 dias" },
    { id: "all", label: "Tudo" },
  ];

  const medidasFiltradas = useMemo(() => {
    if (historyRange === "all") return medidas;

    const now = Date.now();
    const diffDays = historyRange === "7d" ? 7 : 30;
    const minTimestamp = now - diffDays * 24 * 60 * 60 * 1000;
    return medidas.filter(item => toTimestamp(item.created_at) >= minTimestamp);
  }, [historyRange, medidas]);

  const medidasVisiveis = useMemo(
    () => medidasFiltradas.slice(0, historyLimit),
    [medidasFiltradas, historyLimit],
  );
  const hasMoreHistory = historyLimit < medidasFiltradas.length;

  const timeline = medidas.slice(0, isMobile ? 2 : 4);

  return (
    <div className="space-y-4 text-left sm:space-y-5">
      <section className="rounded-[24px] border border-white/10 bg-[#06101D] p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-widest text-sky-300">Evolução física</p>
            <h2 className="mt-2 break-words text-2xl font-black italic leading-none tracking-tighter text-white sm:text-3xl">
              Progresso claro, sem poluição
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-white/40">
              Acompanhe peso, cintura e BF com leitura objetiva para desktop e smartphone.
            </p>
          </div>

          <div className="flex w-full flex-wrap gap-2 lg:w-auto">
            <button
              type="button"
              onClick={loadMedidas}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-[10px] font-black uppercase tracking-widest text-white/60 transition hover:text-white lg:flex-none"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              Atualizar
            </button>

            {medidas.length > 0 && (
              <button
                type="button"
                onClick={() => setView(view === "historico" ? "dashboard" : "historico")}
                className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border px-4 text-[10px] font-black uppercase tracking-widest transition ${
                  view === "historico"
                    ? "border-sky-500/30 bg-sky-500/15 text-sky-200"
                    : "border-white/10 bg-white/5 text-white/50 hover:text-white"
                } lg:flex-none`}
              >
                <BarChart3 size={13} />
                Histórico
              </button>
            )}

            {canRegister && (
              <button
                type="button"
                onClick={() => setView(view === "novo_registro" ? "dashboard" : "novo_registro")}
                className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest transition lg:flex-none ${
                  view === "novo_registro"
                    ? "border border-white/10 bg-white/5 text-white/70"
                    : "bg-sky-500 text-black hover:bg-sky-400"
                }`}
              >
                {view === "novo_registro" ? <X size={13} /> : <Plus size={13} />}
                {view === "novo_registro" ? "Fechar" : "Novo registro"}
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {[
            { label: "Registros", value: totalRegistros, icon: BarChart3, tone: "text-sky-300" },
            { label: "Objetivo", value: objetivoAtual || "Não definido", icon: Target, tone: "text-amber-300" },
            { label: "Último BF", value: formatMeasure(ultima?.bf_estimado ?? null, "%"), icon: TrendingUp, tone: "text-rose-300" },
            { label: "Atualizado", value: ultimaAtualizacao ? ultimaAtualizacao.split(" ").slice(0, 2).join(" ") : "Sem dados", icon: Clock, tone: "text-white" },
          ].slice(0, isMobile && !showMobileStats ? 2 : 4).map(card => (
            <article key={card.label} className="rounded-2xl border border-white/10 bg-black/20 p-3 sm:p-4">
              <card.icon size={16} className={card.tone} />
              <p className="mt-2 text-[8px] font-black uppercase tracking-widest text-white/30">{card.label}</p>
              <p className="mt-1 truncate text-sm font-black text-white">{card.value}</p>
            </article>
          ))}
        </div>
        {isMobile && (
          <button
            type="button"
            onClick={() => setShowMobileStats(current => !current)}
            className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-[10px] font-black uppercase tracking-widest text-white/55 transition hover:text-white sm:hidden"
          >
            {showMobileStats ? "Ver resumo compacto" : "Ver todos os indicadores"}
          </button>
        )}
      </section>

      <AnimatePresence mode="wait">
        {view === "novo_registro" && (
          <motion.section
            key="novo_registro"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-[24px] border border-white/10 bg-[#050B14] p-4 sm:p-6"
          >
            <div className="mx-auto max-w-3xl space-y-4">
              <div className="flex items-start gap-3">
                <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 p-2 text-sky-300">
                  <Activity size={16} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-black uppercase tracking-widest text-white">Novo registro biométrico</h3>
                  <p className="mt-1 text-xs leading-relaxed text-white/35">
                    Preencha os campos principais para atualizar sua evolução na comunidade.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "M", label: "Masculino" },
                  { value: "F", label: "Feminino" },
                ].map(item => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, sexo: item.value as "M" | "F" }))}
                    className={`min-h-11 rounded-xl border text-[10px] font-black uppercase tracking-widest transition ${
                      form.sexo === item.value
                        ? "border-sky-500/35 bg-sky-500/15 text-sky-200"
                        : "border-white/10 bg-white/5 text-white/45 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-2">
                  <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-white/35">
                    <Scale size={11} />
                    Peso (kg)
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 80.5"
                    value={form.peso_kg}
                    onChange={event => setForm(prev => ({ ...prev, peso_kg: event.target.value }))}
                    className="min-h-11 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-sky-500/45"
                  />
                </label>

                <label className="space-y-2">
                  <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-white/35">
                    <Ruler size={11} />
                    Altura (cm)
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 175"
                    value={form.altura_cm}
                    onChange={event => setForm(prev => ({ ...prev, altura_cm: event.target.value }))}
                    className="min-h-11 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-sky-500/45"
                  />
                </label>

                <label className="space-y-2">
                  <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-white/35">
                    <Target size={11} />
                    Cintura (cm)
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 80"
                    value={form.cintura_cm}
                    onChange={event => setForm(prev => ({ ...prev, cintura_cm: event.target.value }))}
                    className="min-h-11 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-sky-500/45"
                  />
                </label>

                <label className="space-y-2">
                  <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-white/35">
                    <Target size={11} />
                    Quadril (cm)
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 95"
                    value={form.quadril_cm}
                    onChange={event => setForm(prev => ({ ...prev, quadril_cm: event.target.value }))}
                    className="min-h-11 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-sky-500/45"
                  />
                </label>

                <label className="space-y-2">
                  <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-white/35">
                    <Activity size={11} />
                    Bíceps (cm)
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 38"
                    value={form.biceps_cm}
                    onChange={event => setForm(prev => ({ ...prev, biceps_cm: event.target.value }))}
                    className="min-h-11 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-sky-500/45"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/35">Objetivo</span>
                  <select
                    value={form.objetivo}
                    onChange={event => setForm(prev => ({ ...prev, objetivo: event.target.value }))}
                    className="min-h-11 w-full appearance-none rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition focus:border-sky-500/45"
                  >
                    <option value="">Selecionar</option>
                    <option value="emagrecimento">Emagrecimento</option>
                    <option value="hipertrofia">Hipertrofia</option>
                    <option value="recomposicao">Recomposicao</option>
                    <option value="manutencao">Manutencao</option>
                    <option value="performance">Performance</option>
                  </select>
                </label>
              </div>

              <label className="space-y-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-white/35">observações (opcional)</span>
                <textarea
                  value={form.obs}
                  onChange={event => setForm(prev => ({ ...prev, obs: event.target.value }))}
                  placeholder="Anote sensações, energia do treino ou observações importantes."
                  className="min-h-20 w-full resize-none rounded-xl border border-white/10 bg-black/30 p-4 text-sm leading-relaxed text-white outline-none transition placeholder:text-white/20 focus:border-sky-500/45"
                />
              </label>

              <AnimatePresence>
                {bfResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[9px] font-black uppercase tracking-widest text-sky-300">BF estimado</p>
                      <p className="text-xl font-black italic text-sky-200">{bfResult.bf_estimado}%</p>
                    </div>
                    <p className="mt-1 text-xs font-bold text-white/55">{bfResult.classificacao}</p>
                    <div className="mt-2 flex gap-1.5">
                      {[...Array(5)].map((_, index) => (
                        <div
                          key={index}
                          className={`h-1.5 flex-1 rounded-full ${
                            index < Math.min(5, Math.max(1, Math.ceil(bfResult.bf_estimado / 12)))
                              ? "bg-sky-400"
                              : "bg-white/10"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="mt-2 text-[10px] leading-relaxed text-white/50">{bfResult.aviso}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-300" />
                  <p className="text-[10px] leading-relaxed text-amber-100/80">
                    Estimativa de apoio para acompanhamento remoto. Não substitui avaliação presencial.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSalvar}
                disabled={saving}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 text-[10px] font-black uppercase tracking-widest text-black transition hover:bg-sky-400 disabled:opacity-45"
              >
                {saving ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                {saving ? "Salvando..." : "Registrar biometria"}
              </button>
            </div>
          </motion.section>
        )}

        {view === "historico" && (
          <motion.section
            key="historico"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/45">
                  Período: {periodosHistorico.find(item => item.id === historyRange)?.label ?? "30 dias"}
                </p>
                <p className="text-[9px] font-black uppercase tracking-widest text-sky-300">
                  {medidasFiltradas.length} registros
                </p>
              </div>

              <div className="sm:hidden">
                <button
                  type="button"
                  onClick={() => setShowMobileHistoryFilters(current => !current)}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-[10px] font-black uppercase tracking-widest text-white/55 transition hover:text-white"
                >
                  {showMobileHistoryFilters ? "Ocultar filtros" : "Mostrar filtros"}
                </button>
              </div>

              <div className={`${showMobileHistoryFilters ? "block" : "hidden"} sm:hidden`}>
                <select
                  value={historyRange}
                  onChange={event => setHistoryRange(event.target.value as HistoryRange)}
                  className="min-h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-bold text-white outline-none transition focus:border-sky-500/35"
                >
                  {periodosHistorico.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="hidden grid-cols-3 gap-2 sm:flex sm:flex-wrap">
                {periodosHistorico.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setHistoryRange(item.id)}
                    className={`inline-flex min-h-11 items-center justify-center rounded-xl px-3 text-[9px] font-black uppercase tracking-widest transition sm:px-4 ${
                      historyRange === item.id
                        ? "border border-sky-500/30 bg-sky-500/15 text-sky-200"
                        : "border border-white/10 bg-white/5 text-white/45 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-[240px] items-center justify-center rounded-[22px] border border-white/10 bg-[#050B14]">
                <RefreshCw size={22} className="animate-spin text-sky-400" />
              </div>
            ) : medidasFiltradas.length === 0 ? (
              <div className="rounded-[22px] border border-white/10 bg-[#050B14] p-8 text-center">
                <BarChart3 size={30} className="mx-auto text-white/20" />
                <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-white/35">
                  Nenhum registro neste período
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {medidasVisiveis.map((item, index) => {
                    const prevItem = medidasFiltradas[index + 1] ?? null;
                    const pesoDelta = formatDiff(
                      calcDiff(item.peso_kg ?? null, prevItem?.peso_kg ?? null),
                      " kg",
                    );
                    const cinturaDelta = formatDiff(
                      calcDiff(item.cintura_cm ?? null, prevItem?.cintura_cm ?? null),
                      " cm",
                    );
                    const expanded = expandedObs[item.id] ?? false;
                    const hasObs = Boolean(item.obs?.trim());

                    return (
                      <motion.article
                        key={item.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(index * 0.04, 0.3) }}
                        className="rounded-[22px] border border-white/10 bg-[#050B14] p-4 sm:p-5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-[9px] font-black uppercase tracking-widest text-white/35">
                            {formatDate(item.created_at)}
                          </p>
                          {index === 0 && (
                            <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-sky-300">
                              Mais recente
                            </span>
                          )}
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {[
                            { label: "Peso", value: formatMeasure(item.peso_kg, " kg"), tone: "text-sky-300" },
                            { label: "Cintura", value: formatMeasure(item.cintura_cm, " cm"), tone: "text-emerald-300" },
                            { label: "BF", value: formatMeasure(item.bf_estimado, "%"), tone: "text-rose-300" },
                            { label: "Bíceps", value: formatMeasure(item.biceps_cm, " cm"), tone: "text-amber-300" },
                          ].map(stat => (
                            <div key={stat.label} className="rounded-xl border border-white/10 bg-white/5 p-3">
                              <p className="text-[8px] font-black uppercase tracking-widest text-white/30">{stat.label}</p>
                              <p className={`mt-1 text-sm font-black ${stat.tone}`}>{stat.value}</p>
                            </div>
                          ))}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {pesoDelta && (
                            <span className={`rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-widest ${
                              pesoDelta.startsWith("-")
                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                                : "border-amber-500/20 bg-amber-500/10 text-amber-300"
                            }`}>
                              Peso {pesoDelta}
                            </span>
                          )}
                          {cinturaDelta && (
                            <span className={`rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-widest ${
                              cinturaDelta.startsWith("-")
                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                                : "border-amber-500/20 bg-amber-500/10 text-amber-300"
                            }`}>
                              Cintura {cinturaDelta}
                            </span>
                          )}
                          {item.objetivo && (
                            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-white/40">
                              Objetivo: {item.objetivo}
                            </span>
                          )}
                        </div>

                        {hasObs && (
                          <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
                            <p className={`text-xs leading-relaxed text-white/55 ${expanded ? "" : "line-clamp-2"}`}>
                              {item.obs}
                            </p>
                            {(item.obs?.length ?? 0) > 120 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedObs(current => ({ ...current, [item.id]: !expanded }))
                                }
                                className="mt-2 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-sky-300/80 transition hover:text-sky-200"
                              >
                                {expanded ? "Mostrar menos" : "Ver observação"}
                                <ChevronDown size={11} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
                              </button>
                            )}
                          </div>
                        )}
                      </motion.article>
                    );
                  })}
                </div>

                {hasMoreHistory && (
                  <button
                    type="button"
                    onClick={() => setHistoryLimit(current => current + (isMobile ? 4 : 8))}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-[10px] font-black uppercase tracking-widest text-white/55 transition hover:text-white"
                  >
                    Mostrar mais registros
                  </button>
                )}
              </>
            )}
          </motion.section>
        )}

        {view === "dashboard" && (
          <motion.section
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3 sm:space-y-4"
          >
            {loading ? (
              <div className="flex min-h-[240px] items-center justify-center rounded-[22px] border border-white/10 bg-[#050B14]">
                <RefreshCw size={22} className="animate-spin text-sky-400" />
              </div>
            ) : medidas.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-white/10 bg-[#050B14] p-8 text-center">
                <Activity size={30} className="mx-auto text-white/20" />
                <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-white/35">
                  Nenhum registro biométrico ainda
                </p>
                <button
                  type="button"
                  onClick={() => setView("novo_registro")}
                  className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-sky-500 px-4 text-[10px] font-black uppercase tracking-widest text-black transition hover:bg-sky-400"
                >
                  Fazer primeiro registro
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
                  {metricas.map(card => (
                    <article key={card.label} className={`rounded-2xl border p-3 sm:p-4 ${card.card}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className={`rounded-xl border border-white/10 bg-black/20 p-2 ${card.tone}`}>
                          <card.icon size={14} />
                        </div>
                        {card.diff != null && (
                          <span className={`rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest ${diffTone(card.diff, card.preferDecrease)}`}>
                            {formatDiff(card.diff, card.label === "BF estimado" ? "%" : card.label === "Peso atual" ? " kg" : " cm")}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-[8px] font-black uppercase tracking-widest text-white/30">{card.label}</p>
                      <p className="mt-1 text-lg font-black text-white">{card.value}</p>
                    </article>
                  ))}
                </div>

                {medidas.length >= 2 && (
                  <>
                    {isMobile && (
                      <button
                        type="button"
                        onClick={() => setShowMobileConsolidado(current => !current)}
                        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-[10px] font-black uppercase tracking-widest text-white/55 transition hover:text-white sm:hidden"
                      >
                        {showMobileConsolidado ? "Ocultar evolução consolidada" : "Mostrar evolução consolidada"}
                      </button>
                    )}

                    {(!isMobile || showMobileConsolidado) && (
                      <section className="rounded-[22px] border border-white/10 bg-[#050B14] p-4 sm:p-5">
                        <h3 className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/55">
                          <TrendingUp size={14} className="text-sky-400" />
                          Evolução consolidada
                        </h3>
                        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
                          {resumoEvolucao.map(item => (
                            <article key={item.label} className="rounded-xl border border-white/10 bg-white/5 p-3">
                              <p className="text-[8px] font-black uppercase tracking-widest text-white/30">{item.label}</p>
                              <p className={`mt-1 text-sm font-black ${diffTone(item.diff, item.preferDecrease)}`}>
                                {formatDiff(item.diff, item.label === "BF" ? "%" : item.label === "Peso" ? " kg" : " cm") ?? "--"}
                              </p>
                              <p className="mt-1 text-[10px] text-white/45">
                                {item.inicial} {"->"} {item.atual}
                              </p>
                            </article>
                          ))}
                        </div>
                      </section>
                    )}
                  </>
                )}

                {isMobile && (
                  <button
                    type="button"
                    onClick={() => setShowMobileTimeline(current => !current)}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-[10px] font-black uppercase tracking-widest text-white/55 transition hover:text-white sm:hidden"
                  >
                    {showMobileTimeline ? "Ocultar linha do tempo" : "Mostrar linha do tempo"}
                  </button>
                )}

                {(!isMobile || showMobileTimeline) && (
                  <section className="rounded-[22px] border border-white/10 bg-[#050B14] p-4 sm:p-5">
                    <h3 className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/55">
                      <Clock size={14} className="text-sky-400" />
                      Linha do tempo rápida
                    </h3>
                    <div className="mt-3 space-y-2">
                      {timeline.map((item, index) => (
                        <div
                          key={item.id}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-[9px] font-black uppercase tracking-widest text-white/35">
                              {formatDate(item.created_at)}
                            </p>
                            {index === 0 && (
                              <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-sky-300">
                                Atual
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-white/60">
                            Peso: <span className="font-black text-white">{formatMeasure(item.peso_kg, " kg")}</span>{" "}
                            | Cintura: <span className="font-black text-white">{formatMeasure(item.cintura_cm, " cm")}</span>{" "}
                            | BF: <span className="font-black text-white">{formatMeasure(item.bf_estimado, "%")}</span>
                          </p>
                        </div>
                      ))}
                    </div>

                    {isMobile && medidas.length > timeline.length && (
                      <button
                        type="button"
                        onClick={() => setView("historico")}
                        className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-[9px] font-black uppercase tracking-widest text-white/55 transition hover:text-white"
                      >
                        Ver histórico completo
                      </button>
                    )}
                  </section>
                )}

                <section className="rounded-[22px] border border-white/10 bg-[#050B14] p-4 sm:p-5">
                  <button
                    type="button"
                    onClick={() => setShowVisual(current => !current)}
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-[9px] font-black uppercase tracking-widest text-white/55 transition hover:text-white"
                  >
                    <Camera size={13} className="text-sky-400" />
                    Registro visual
                    <ChevronDown size={11} className={`transition-transform ${showVisual ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {showVisual && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 overflow-hidden"
                      >
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { label: "Inicial", tone: "border-white/10 text-white/40" },
                            { label: "Atual", tone: "border-sky-500/25 text-sky-200" },
                          ].map(item => (
                            <div
                              key={item.label}
                              className={`aspect-[3/4] rounded-[18px] border bg-white/5 ${item.tone} flex flex-col items-center justify-center gap-2`}
                            >
                              <Camera size={20} className="opacity-40" />
                              <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
                              <span className="text-[8px] uppercase tracking-widest opacity-60">Adicionar foto</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>
              </>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
