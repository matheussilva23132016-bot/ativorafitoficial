"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  Dumbbell,
  Lock,
  PlayCircle,
  ShieldCheck,
  Users,
  Video,
} from "lucide-react";
import { ExerciseGuideView } from "./ExerciseGuideView";

interface WorkoutHubViewProps {
  onBack: () => void;
  onOpenCommunities?: () => void;
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 18 } },
};

export function WorkoutHubView({ onBack, onOpenCommunities }: WorkoutHubViewProps) {
  const [screen, setScreen] = useState<"hub" | "guia">("hub");

  if (screen === "guia") {
    return <ExerciseGuideView onBack={() => setScreen("hub")} />;
  }

  const funcionalidades = [
    {
      title: "AtivoraComunidades",
      status: "Disponível",
      desc: "Treinos semanais publicados nas comunidades, pedidos ao instrutor, vídeos, links de execução e PDF offline.",
      icon: Users,
      enabled: true,
      onClick: onOpenCommunities,
    },
    {
      title: "Treino Individual",
      status: "Em breve",
      desc: "Área reservada para treinos particulares fora das comunidades, com histórico e execução guiada.",
      icon: Dumbbell,
      enabled: false,
      onClick: undefined,
    },
  ];

  return (
    <motion.div
      key="workout-hub"
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, y: -12 }}
      className="mx-auto w-full max-w-6xl space-y-6 text-left"
    >
      <motion.button
        variants={itemVariants}
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/35 transition-colors hover:text-white"
      >
        <ChevronLeft size={16} />
        Voltar ao painel
      </motion.button>

      <motion.section
        variants={itemVariants}
        className="relative overflow-hidden rounded-[28px] border border-sky-500/15 bg-[#06101D] p-5 sm:p-7 lg:p-8"
      >
        <div className="relative grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-black">
              <Dumbbell size={12} />
              Treinos
            </div>
            <h1 className="mt-5 text-4xl font-black italic leading-none tracking-tighter text-white sm:text-5xl">
              Treino certo, <span className="text-sky-400">execução clara</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/45">
              Acesse o guia de exercícios, abra treinos das comunidades e acompanhe o que já está liberado. Cada card mostra exatamente de onde o plano vem.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {[
              { label: "Semana", value: "Cronograma", icon: CalendarDays },
              { label: "Acompanhamento", value: "Instrutor", icon: ShieldCheck },
              { label: "Execução", value: "Vídeo e link", icon: Video },
              { label: "Offline", value: "PDF", icon: Dumbbell },
            ].map(item => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <item.icon className="text-sky-300" size={18} />
                <p className="mt-3 text-[9px] font-black uppercase tracking-widest text-white/25">
                  {item.label}
                </p>
                <p className="mt-1 text-sm font-black text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section variants={itemVariants} className="grid gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={() => setScreen("guia")}
          className="group relative min-h-[260px] overflow-hidden rounded-[28px] border border-sky-500/30 bg-[#071727] p-5 text-left shadow-2xl shadow-sky-950/20 transition-all hover:border-sky-400/55 hover:bg-[#082038] active:scale-[0.99] md:col-span-2"
        >
          <div className="absolute right-[-44px] top-[-44px] h-40 w-40 rounded-full border border-sky-500/15" />
          <div className="relative flex h-full flex-col justify-between gap-8 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-black">
                <BookOpen size={12} />
                Guia de execução
              </div>
              <h2 className="mt-6 text-4xl font-black italic leading-none tracking-tighter text-white sm:text-5xl">
                Guia de <span className="text-sky-400">treinos</span>
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-white/45">
                Pesquise exercícios, veja posição correta, cuidados técnicos e vídeo de execução no player do app.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:min-w-[280px]">
              {[
                { label: "Busca", value: "Lupa", icon: BookOpen },
                { label: "Player", value: "No app", icon: PlayCircle },
              ].map(item => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <item.icon className="text-sky-300" size={18} />
                  <p className="mt-3 text-[8px] font-black uppercase tracking-widest text-white/25">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm font-black text-white">{item.value}</p>
                </div>
              ))}
            </div>

            <ArrowRight className="absolute bottom-5 right-5 text-sky-300 transition-transform group-hover:translate-x-1" size={20} />
          </div>
        </button>

        {funcionalidades.map(item => (
          <button
            key={item.title}
            type="button"
            disabled={!item.enabled}
            onClick={item.enabled ? item.onClick : undefined}
            className={`group min-h-[220px] rounded-[28px] border p-5 text-left transition-all ${
              item.enabled
                ? "border-sky-500/20 bg-sky-500/10 hover:border-sky-500/40 hover:bg-sky-500/20 active:scale-[0.99]"
                : "cursor-not-allowed border-white/10 bg-white/5 opacity-55"
            }`}
          >
            <div className="flex h-full flex-col justify-between gap-6">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div className={`rounded-2xl p-3 ${item.enabled ? "bg-sky-500 text-black" : "bg-white/10 text-white/30"}`}>
                    <item.icon size={20} />
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[8px] font-black uppercase tracking-widest ${
                    item.enabled ? "bg-emerald-500/15 text-emerald-300" : "bg-white/10 text-white/30"
                  }`}>
                    {item.status}
                  </span>
                </div>
                <h2 className="mt-6 text-2xl font-black italic text-white">{item.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-white/40">{item.desc}</p>
              </div>

              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                <span className={item.enabled ? "text-sky-300" : "text-white/25"}>
                  {item.enabled ? "Abrir treinos" : "Indisponível"}
                </span>
                {item.enabled ? (
                  <ArrowRight size={17} className="text-sky-300 transition-transform group-hover:translate-x-1" />
                ) : (
                  <Lock size={16} className="text-white/20" />
                )}
              </div>
            </div>
          </button>
        ))}
      </motion.section>
    </motion.div>
  );
}
