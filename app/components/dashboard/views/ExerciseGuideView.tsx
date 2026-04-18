"use client";

import React, { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ChevronLeft,
  Dumbbell,
  PlayCircle,
  Search,
  ShieldCheck,
  Video,
} from "lucide-react";
import { exerciseGuide, type ExerciseCategory } from "./exerciseGuideData";

interface ExerciseGuideViewProps {
  onBack: () => void;
}

const filters: { id: "todos" | ExerciseCategory; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "superiores", label: "Superiores/Core" },
  { id: "inferiores", label: "Inferiores" },
];

const detailTabs = [
  { id: "como", label: "Como fazer", icon: Dumbbell },
  { id: "posicao", label: "Posição", icon: ShieldCheck },
  { id: "cuidados", label: "Cuidados", icon: AlertTriangle },
] as const;

const youtubeEmbed = (videoId: string) =>
  `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`;

export function ExerciseGuideView({ onBack }: ExerciseGuideViewProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"todos" | ExerciseCategory>("todos");
  const [selectedId, setSelectedId] = useState(exerciseGuide[0]?.id ?? "");
  const [detailTab, setDetailTab] = useState<(typeof detailTabs)[number]["id"]>("como");
  const [mobilePanel, setMobilePanel] = useState<"lista" | "detalhes">("lista");
  const detailRef = useRef<HTMLElement | null>(null);

  const filteredExercises = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return exerciseGuide.filter(exercicio => {
      const matchFilter = filter === "todos" || exercicio.categoria === filter;
      const searchText = [exercicio.nome, exercicio.grupo, exercicio.resumo, ...exercicio.musculos]
        .join(" ")
        .toLowerCase();
      return matchFilter && (!normalizedQuery || searchText.includes(normalizedQuery));
    });
  }, [filter, query]);

  const selected =
    exerciseGuide.find(exercicio => exercicio.id === selectedId) ??
    filteredExercises[0] ??
    exerciseGuide[0];

  const totalInferiores = exerciseGuide.filter(exercicio => exercicio.categoria === "inferiores").length;
  const totalSuperiores = exerciseGuide.length - totalInferiores;

  const selectedItems =
    detailTab === "como"
      ? selected.comoFazer
      : detailTab === "posicao"
        ? selected.posicao
        : selected.cuidados;

  const selectExercise = (id: string) => {
    setSelectedId(id);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setMobilePanel("detalhes");
      window.requestAnimationFrame(() => {
        detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  };

  return (
    <motion.div
      key="exercise-guide"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="mx-auto w-full max-w-7xl space-y-4 overflow-x-clip pb-4 text-left sm:space-y-5"
    >
      <button
        type="button"
        onClick={onBack}
        className="flex min-h-10 items-center gap-2 rounded-xl px-1 text-[10px] font-black uppercase tracking-widest text-white/35 transition-colors hover:text-white"
      >
        <ChevronLeft size={16} />
        Voltar para treinos
      </button>

      <section className="relative overflow-hidden rounded-[24px] border border-sky-500/15 bg-[#06101D] p-4 sm:rounded-[28px] sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-black">
              <PlayCircle size={12} />
              Guia de treinos
            </div>
            <h1 className="mt-4 text-3xl font-black italic leading-none tracking-tighter text-white sm:text-5xl">
              Biblioteca de <span className="text-sky-400">exercícios</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/45">
              Busca rápida com divisão por categoria, video no app e pontos técnicos sem excesso de informação.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[
              { label: "Total", value: exerciseGuide.length },
              { label: "Superiores", value: totalSuperiores },
              { label: "Inferiores", value: totalInferiores },
            ].map(item => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-black/20 p-3 sm:p-4">
                <p className="text-[8px] font-black uppercase tracking-widest text-white/25">{item.label}</p>
                <p className="mt-1 text-xl font-black italic text-white sm:text-2xl">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 min-w-0 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className={`space-y-3 ${mobilePanel === "detalhes" ? "hidden lg:block" : ""}`}>
          <div className="rounded-[22px] border border-white/10 bg-white/5 p-3 sm:p-4 lg:sticky lg:top-24">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Buscar exercício, músculo ou foco..."
                className="h-11 w-full rounded-xl border border-white/10 bg-black/20 pl-11 pr-4 text-sm font-bold text-white outline-none transition placeholder:text-white/20 focus:border-sky-500/45"
              />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {filters.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={`min-h-10 rounded-lg px-2 py-1.5 text-[8px] font-black uppercase leading-tight tracking-wide transition-all [overflow-wrap:anywhere] sm:text-[9px] ${
                    filter === item.id
                      ? "bg-sky-500 text-black"
                      : "border border-white/10 bg-white/5 text-white/35 hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <p className="mt-3 text-[10px] font-bold text-white/30">
              {filteredExercises.length} exercício{filteredExercises.length === 1 ? "" : "s"} encontrado
              {filteredExercises.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="grid gap-2 lg:max-h-[calc(100vh-265px)] lg:overflow-y-auto lg:pr-1">
            {filteredExercises.length > 0 ? (
              filteredExercises.map(exercicio => {
                const active = selected.id === exercicio.id;
                return (
                  <button
                    key={exercicio.id}
                    type="button"
                    onClick={() => selectExercise(exercicio.id)}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      active
                        ? "border-sky-500/45 bg-sky-500/15"
                        : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.08]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="break-words text-sm font-black text-white [overflow-wrap:anywhere]">
                          {exercicio.nome}
                        </p>
                        <p className="mt-1 break-words text-[10px] font-bold uppercase tracking-wide text-white/30 [overflow-wrap:anywhere]">
                          {exercicio.grupo}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-[7px] font-black uppercase tracking-widest ${
                          exercicio.categoria === "inferiores"
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-sky-500/15 text-sky-300"
                        }`}
                      >
                        {exercicio.categoria === "inferiores" ? "Inferiores" : "Superiores"}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {exercicio.musculos.slice(0, 2).map(musculo => (
                        <span
                          key={musculo}
                          className="rounded-lg border border-white/10 bg-black/25 px-2 py-1 text-[8px] font-bold text-white/30"
                        >
                          {musculo}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
                <Search className="mx-auto text-white/20" size={24} />
                <p className="mt-3 text-sm font-black text-white">Nenhum exercício encontrado.</p>
                <p className="mt-1 text-xs text-white/35">Tente outro nome, músculo ou categoria.</p>
              </div>
            )}
          </div>
        </div>

        <aside
          ref={detailRef}
          className={`scroll-mt-24 min-w-0 rounded-[24px] border border-white/10 bg-white/5 p-4 sm:p-5 ${
            mobilePanel === "lista" ? "hidden lg:block" : ""
          }`}
        >
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setMobilePanel("lista")}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-[9px] font-black uppercase tracking-widest text-white/45 transition hover:text-white lg:hidden"
            >
              <ChevronLeft size={14} />
              Voltar para lista
            </button>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-black italic leading-none text-white sm:text-3xl">{selected.nome}</h2>
                <span className="rounded-full bg-white/[0.08] px-2 py-1 text-[8px] font-black uppercase tracking-widest text-white/35">
                  {selected.categoria === "inferiores" ? "Inferiores" : "Superiores/Core"}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-white/45">{selected.resumo}</p>
            </div>

            <div className="overflow-hidden rounded-[20px] border border-white/10 bg-black/30">
              {selected.videoId ? (
                <div className="aspect-video w-full bg-black">
                  <iframe
                    key={selected.videoId}
                    title={`Vídeo de execução - ${selected.nome}`}
                    src={youtubeEmbed(selected.videoId)}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 bg-black/40 p-6 text-center">
                  <Video className="text-white/25" size={28} />
                  <p className="text-xs font-black uppercase tracking-widest text-white/45">Vídeo pendente no guia</p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {selected.musculos.map(musculo => (
                <span
                  key={musculo}
                  className="rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-white/35"
                >
                  {musculo}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {detailTabs.map(item => {
                const Icon = item.icon;
                const active = detailTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDetailTab(item.id)}
                    className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border px-2 text-[8px] font-black uppercase tracking-widest transition [overflow-wrap:anywhere] sm:text-[9px] ${
                      active
                        ? "border-sky-500/35 bg-sky-500/15 text-sky-200"
                        : "border-white/10 bg-white/5 text-white/40 hover:text-white"
                    }`}
                  >
                    <Icon size={12} />
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <ul className="space-y-2">
                {selectedItems.map(item => (
                  <li key={item} className="flex gap-2 text-xs leading-relaxed text-white/45">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-sky-400/60" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </section>
    </motion.div>
  );
}
