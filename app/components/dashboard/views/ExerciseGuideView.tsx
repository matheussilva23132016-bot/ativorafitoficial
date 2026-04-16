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

const youtubeEmbed = (videoId: string) =>
  `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`;

export function ExerciseGuideView({ onBack }: ExerciseGuideViewProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"todos" | ExerciseCategory>("todos");
  const [selectedId, setSelectedId] = useState(exerciseGuide[0]?.id ?? "");
  const detailRef = useRef<HTMLElement | null>(null);

  const filteredExercises = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return exerciseGuide.filter(exercicio => {
      const matchFilter = filter === "todos" || exercicio.categoria === filter;
      const searchText = [
        exercicio.nome,
        exercicio.grupo,
        exercicio.resumo,
        ...exercicio.musculos,
      ].join(" ").toLowerCase();

      return matchFilter && (!normalizedQuery || searchText.includes(normalizedQuery));
    });
  }, [filter, query]);

  const selected =
    exerciseGuide.find(exercicio => exercicio.id === selectedId) ??
    filteredExercises[0] ??
    exerciseGuide[0];

  const totalInferiores = exerciseGuide.filter(exercicio => exercicio.categoria === "inferiores").length;
  const totalSuperiores = exerciseGuide.length - totalInferiores;

  const selectExercise = (id: string) => {
    setSelectedId(id);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
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
      className="mx-auto w-full max-w-7xl space-y-4 pb-4 text-left sm:space-y-5"
    >
      <button
        type="button"
        onClick={onBack}
        className="flex min-h-10 items-center gap-2 rounded-xl px-1 text-[10px] font-black uppercase tracking-widest text-white/35 transition-colors hover:text-white"
      >
        <ChevronLeft size={16} />
        Voltar para treinos
      </button>

      <section className="relative overflow-hidden rounded-[24px] border border-sky-500/15 bg-[#06101D] p-4 sm:rounded-[28px] sm:p-7 lg:p-8">
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-black">
              <PlayCircle size={12} />
              Guia de treinos
            </div>
            <h1 className="mt-4 text-3xl font-black italic leading-none tracking-tighter text-white sm:mt-5 sm:text-5xl">
              Biblioteca de <span className="text-sky-400">exercícios</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/45">
              Lista premium com os exercícios do guia ShapeSaiyajin, execução dentro do app, instruções rápidas, cuidados técnicos e divisão por superiores/core e inferiores.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Total", value: exerciseGuide.length },
              { label: "Superiores", value: totalSuperiores },
              { label: "Inferiores", value: totalInferiores },
            ].map(item => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-black/20 p-3 sm:p-4">
                <p className="text-[8px] font-black uppercase tracking-widest text-white/25">
                  {item.label}
                </p>
                <p className="mt-2 text-xl font-black italic text-white sm:text-2xl">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[380px_minmax(0,1fr)] xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="order-1 space-y-4">
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-3 sm:p-4 lg:sticky lg:top-24 lg:z-10">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={17} />
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Buscar exercício, músculo ou foco..."
                className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 pl-11 pr-4 text-sm font-bold text-white outline-none transition-all placeholder:text-white/20 focus:border-sky-500/45"
              />
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {filters.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={`min-h-11 rounded-xl px-2 text-[8px] font-black uppercase leading-tight tracking-wide transition-all sm:text-[9px] ${
                    filter === item.id
                      ? "bg-sky-500 text-black"
                      : "bg-white/5 text-white/35 active:bg-white/10"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <p className="mt-3 text-[10px] font-bold text-white/30">
              {filteredExercises.length} exercício{filteredExercises.length === 1 ? "" : "s"} encontrado{filteredExercises.length === 1 ? "" : "s"}. Toque em um card para abrir a execução.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:max-h-[calc(100vh-230px)] lg:grid-cols-1 lg:overflow-y-auto lg:pr-1">
            {filteredExercises.length > 0 ? filteredExercises.map(exercicio => {
              const active = selected.id === exercicio.id;
              return (
                <button
                  key={exercicio.id}
                  type="button"
                  onClick={() => selectExercise(exercicio.id)}
                  className={`rounded-2xl border p-4 text-left transition-all ${
                    active
                      ? "border-sky-500/45 bg-sky-500/15"
                      : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.08]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-white">{exercicio.nome}</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-white/30">
                        {exercicio.grupo}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-1 text-[7px] font-black uppercase tracking-widest ${
                      exercicio.categoria === "inferiores"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-sky-500/15 text-sky-300"
                    }`}>
                      {exercicio.categoria === "inferiores" ? "Inferiores" : "Superior"}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-white/40">
                    {exercicio.resumo}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {exercicio.musculos.slice(0, 3).map(musculo => (
                      <span key={musculo} className="rounded-lg bg-black/25 px-2 py-1 text-[8px] font-bold text-white/30">
                        {musculo}
                      </span>
                    ))}
                  </div>
                </button>
              );
            }) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
                <Search className="mx-auto text-white/20" size={24} />
                <p className="mt-3 text-sm font-black text-white">Nenhum exercício encontrado.</p>
                <p className="mt-1 text-xs text-white/35">Tente outro nome, músculo ou categoria.</p>
              </div>
            )}
          </div>
        </div>

        <aside ref={detailRef} className="order-2 scroll-mt-24 lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-4 rounded-[24px] border border-white/10 bg-white/5 p-4 sm:rounded-[28px] sm:p-5">
            <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)] 2xl:grid-cols-[340px_minmax(0,1fr)]">
              <div className="overflow-hidden rounded-[24px] border border-white/10 bg-black/30">
                {selected.videoId ? (
                  <div className="mx-auto aspect-[9/16] max-h-[560px] w-full max-w-[360px] bg-black">
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
                  <div className="flex aspect-[9/16] max-h-[560px] w-full flex-col items-center justify-center gap-3 bg-black/40 p-6 text-center">
                    <Video className="text-white/25" size={30} />
                    <p className="text-xs font-black uppercase tracking-widest text-white/45">
                      Vídeo pendente no guia
                    </p>
                    <p className="max-w-sm text-xs leading-relaxed text-white/30">
                      O PDF não trouxe uma URL detectável para este exercício. As instruções técnicas ficam disponíveis no app.
                    </p>
                  </div>
                )}
              </div>

              <div className="min-w-0 space-y-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-black italic leading-none text-white sm:text-3xl">{selected.nome}</h2>
                    <span className="rounded-full bg-white/[0.08] px-2 py-1 text-[8px] font-black uppercase tracking-widest text-white/35">
                      {selected.categoria === "inferiores" ? "Inferiores" : "Superiores/Core"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-white/45">{selected.resumo}</p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {selected.musculos.map(musculo => (
                    <span key={musculo} className="rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-white/35">
                      {musculo}
                    </span>
                  ))}
                </div>

                <div className="grid gap-3">
                  {[
                    { title: "Como fazer", icon: Dumbbell, items: selected.comoFazer },
                    { title: "Posição", icon: ShieldCheck, items: selected.posicao },
                    { title: "Cuidados", icon: AlertTriangle, items: selected.cuidados },
                  ].map(section => (
                    <div key={section.title} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-center gap-2">
                        <section.icon size={14} className="text-sky-300" />
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/35">
                          {section.title}
                        </p>
                      </div>
                      <ul className="mt-3 space-y-2">
                        {section.items.map(item => (
                          <li key={item} className="flex gap-2 text-xs leading-relaxed text-white/45">
                            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-sky-400/60" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </motion.div>
  );
}
