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

interface WorkoutOption {
  title: string;
  status: string;
  desc: string;
  icon: React.ComponentType<{ size?: string | number; className?: string }>;
  enabled: boolean;
  onClick?: () => void;
  badge: string;
  actionLabel: string;
  tone: "comunidades" | "individual";
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 18 } },
};

const overviewItems = [
  { label: "Semana", value: "Cronograma", icon: CalendarDays },
  { label: "Acompanhamento", value: "Instrutor", icon: ShieldCheck },
  { label: "Execução", value: "Vídeo e guia", icon: Video },
  { label: "Offline", value: "PDF", icon: Dumbbell },
];

const guideHighlights = [
  { label: "Busca inteligente", icon: BookOpen },
  { label: "Vídeo no app", icon: PlayCircle },
  { label: "Passo a passo", icon: ShieldCheck },
];

export function WorkoutHubView({ onBack, onOpenCommunities }: WorkoutHubViewProps) {
  const [screen, setScreen] = useState<"hub" | "guia">("hub");

  if (screen === "guia") {
    return <ExerciseGuideView onBack={() => setScreen("hub")} />;
  }

  const communityEnabled = Boolean(onOpenCommunities);

  const funcionalidades: WorkoutOption[] = [
    {
      title: "AtivoraComunidades",
      status: communityEnabled ? "Disponível" : "Indisponível",
      desc: "Treinos semanais da comunidade com alinhamento do instrutor, video e material de apoio.",
      icon: Users,
      enabled: communityEnabled,
      onClick: onOpenCommunities,
      badge: "Treino em grupo",
      actionLabel: "Entrar nas comunidades",
      tone: "comunidades",
    },
    {
      title: "Treino Individual",
      status: "Em breve",
      desc: "Plano pessoal com histórico próprio, progressão individual e execução guiada dentro do app.",
      icon: Dumbbell,
      enabled: false,
      onClick: undefined,
      badge: "Plano exclusivo",
      actionLabel: "Entrar na lista",
      tone: "individual",
    },
  ];

  return (
    <motion.div
      key="workout-hub"
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, y: -12 }}
      className="mx-auto w-full max-w-6xl space-y-4 overflow-x-clip text-left sm:space-y-5"
    >
      <motion.button
        variants={itemVariants}
        type="button"
        onClick={onBack}
        className="flex min-h-10 items-center gap-2 rounded-xl px-1 text-[10px] font-black uppercase tracking-widest text-white/35 transition-colors hover:text-white"
      >
        <ChevronLeft size={16} />
        Voltar ao painel
      </motion.button>

      <motion.section
        variants={itemVariants}
        className="relative overflow-hidden rounded-[24px] border border-sky-500/15 bg-[#06101D] p-4 sm:rounded-[28px] sm:p-6 lg:p-7"
      >
        <div className="relative grid gap-4 sm:gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-black">
              <Dumbbell size={12} />
              Treinos
            </div>
            <h1 className="mt-4 text-[1.9rem] font-black italic leading-none tracking-tighter text-white sm:text-5xl">
              Treino certo, <span className="text-sky-400">execução clara</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/45">
              Cada área tem uma função própria: guia técnico, treino em comunidade e plano individual.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {overviewItems.map(item => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-black/20 p-3 sm:p-4">
                <item.icon className="text-sky-300" size={18} />
                <p className="mt-3 text-[9px] font-black uppercase tracking-widest text-white/25">{item.label}</p>
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
          className="group relative w-full max-w-full overflow-hidden rounded-[24px] border border-sky-500/30 bg-[#071727] p-4 text-left shadow-2xl shadow-sky-950/20 transition-all hover:border-sky-400/55 hover:bg-[#082038] active:scale-[0.99] sm:rounded-[28px] sm:p-5 md:col-span-2"
        >
          <div className="absolute right-[-44px] top-[-44px] h-40 w-40 rounded-full border border-sky-500/15" />
          <div className="relative flex h-full min-w-0 flex-col justify-between gap-5 sm:gap-6 md:flex-row md:items-end">
            <div className="min-w-0 max-w-2xl pr-4 sm:pr-6 md:pr-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-black">
                <BookOpen size={12} />
                Execução técnica
              </div>
              <h2 className="mt-3 text-[1.45rem] font-black italic leading-tight tracking-tighter text-white sm:mt-5 sm:text-[2.6rem] sm:leading-none md:text-5xl">
                Guia de <span className="text-sky-400">treinos</span>
              </h2>
              <p className="mt-2.5 text-sm leading-relaxed text-white/45 sm:mt-3">
                Biblioteca de exercícios com busca rápida, demonstração e orientação clara para executar sem erro.
              </p>
            </div>

            <div className="grid w-full min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 md:max-w-[340px] md:grid-cols-1 md:justify-end">
              {guideHighlights.map(item => (
                <span
                  key={item.label}
                  className="inline-flex min-h-9 w-full max-w-full items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-white/65"
                >
                  <item.icon className="shrink-0 text-sky-300" size={14} />
                  <span className="min-w-0 break-words leading-tight [overflow-wrap:anywhere]">
                    {item.label}
                  </span>
                </span>
              ))}
            </div>

            <ArrowRight className="absolute bottom-4 right-3 hidden text-sky-300 transition-transform group-hover:translate-x-1 sm:bottom-5 sm:right-5 sm:block" size={20} />
          </div>
        </button>

        {funcionalidades.map(item => (
          <button
            key={item.title}
            type="button"
            disabled={!item.enabled}
            onClick={item.enabled ? item.onClick : undefined}
            className={`group rounded-[24px] border p-4 text-left transition-all sm:rounded-[28px] sm:p-5 ${
              item.enabled && item.tone === "comunidades"
                ? "border-emerald-500/25 bg-emerald-500/10 hover:border-emerald-400/45 hover:bg-emerald-500/15 active:scale-[0.99]"
                : item.enabled
                  ? "border-sky-500/20 bg-sky-500/10 hover:border-sky-500/40 hover:bg-sky-500/20 active:scale-[0.99]"
                  : "cursor-not-allowed border-white/10 bg-white/5 opacity-60"
            }`}
          >
            <div className="flex h-full flex-col justify-between gap-5">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div
                    className={`rounded-2xl p-3 ${
                      item.enabled && item.tone === "comunidades"
                        ? "bg-emerald-500 text-black"
                        : item.enabled
                          ? "bg-sky-500 text-black"
                          : "bg-white/10 text-white/30"
                    }`}
                  >
                    <item.icon size={20} />
                  </div>

                  <span
                    className={`rounded-full px-2 py-1 text-[8px] font-black uppercase tracking-widest ${
                      item.enabled && item.tone === "comunidades"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : item.enabled
                          ? "bg-sky-500/15 text-sky-300"
                          : "bg-white/10 text-white/30"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <span
                  className={`mt-4 inline-flex rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-widest ${
                    item.tone === "comunidades" ? "bg-emerald-500/10 text-emerald-300" : "bg-white/10 text-white/45"
                  }`}
                >
                  {item.badge}
                </span>

                <h2 className="mt-2 break-words text-2xl font-black italic leading-tight text-white [overflow-wrap:anywhere]">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-white/40">{item.desc}</p>
              </div>

              <div className="flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-widest">
                <span className={item.enabled ? "text-white/65" : "text-white/25"}>
                  {item.enabled ? item.actionLabel : "Indisponível"}
                </span>
                {item.enabled ? (
                  <ArrowRight
                    size={17}
                    className={`transition-transform group-hover:translate-x-1 ${
                      item.tone === "comunidades" ? "text-emerald-300" : "text-sky-300"
                    }`}
                  />
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
