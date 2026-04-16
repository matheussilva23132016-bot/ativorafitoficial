"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Bell,
  CalendarCheck2,
  Camera,
  ChevronLeft,
  LockKeyhole,
  MessageSquarePlus,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";

interface SimpleDashboardViewProps {
  mode: "metricas" | "config";
  onBack: () => void;
  onSuggestions: () => void;
}

const viewCopy = {
  metricas: {
    badge: "Evolução",
    title: "Histórico corporal e constância",
    description:
      "Acompanhe medidas salvas no Meu Perfil, treinos concluídos, cardápios seguidos e desafios aprovados nas comunidades. O foco aqui é mostrar progresso real, semana após semana.",
    accent: "text-emerald-300",
    cards: [
      {
        icon: Camera,
        title: "Medidas do Meu Perfil",
        text: "Use peso, cintura, quadril, IMC, RCQ e RFM para comparar sua evolução com mais contexto.",
      },
      {
        icon: CalendarCheck2,
        title: "Constância",
        text: "Veja frequência de treinos, refeições marcadas e desafios aprovados dentro das comunidades.",
      },
      {
        icon: BarChart3,
        title: "Histórico de comunidades",
        text: "Reúna ranking semanal, selos, vitórias e registros de treino ou nutrição em uma linha do tempo clara.",
      },
    ],
  },
  config: {
    badge: "Ajustes do app",
    title: "Conta, privacidade e preferências",
    description:
      "Ajuste notificações, privacidade, sessão e comportamento do app sem precisar mexer em SQL ou configurações escondidas.",
    accent: "text-sky-300",
    cards: [
      {
        icon: SlidersHorizontal,
        title: "Preferências",
        text: "Escolha como quer receber alertas, avisos das comunidades e mensagens importantes.",
      },
      {
        icon: ShieldCheck,
        title: "Privacidade",
        text: "Controle exposição do perfil social, dados corporais, comunidades e permissões sensíveis.",
      },
      {
        icon: LockKeyhole,
        title: "Segurança",
        text: "Revise sessão, conta, senha e proteção de acesso quando essas opções forem liberadas.",
      },
    ],
  },
};

export function SimpleDashboardView({ mode, onBack, onSuggestions }: SimpleDashboardViewProps) {
  const copy = viewCopy[mode];

  return (
    <motion.div
      key={`simple-${mode}`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="mx-auto w-full max-w-6xl space-y-5 text-left"
    >
      <button
        type="button"
        onClick={onBack}
        className="flex min-h-10 items-center gap-2 rounded-lg px-1 text-[10px] font-black uppercase tracking-widest text-white/35 transition-colors hover:text-white"
      >
        <ChevronLeft size={16} />
        Voltar ao painel
      </button>

      <section className="rounded-[28px] border border-white/10 bg-[#06101D] p-5 sm:p-7 lg:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/8 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-white/45">
              <Bell size={12} className={copy.accent} />
              {copy.badge}
            </div>
            <h1 className="mt-5 text-4xl font-black italic leading-none tracking-tighter text-white sm:text-5xl">
              {copy.title}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/50">
              {copy.description}
            </p>
          </div>

          <div className="rounded-lg border border-sky-500/15 bg-sky-500/8 p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-sky-300">
              Quer mudar algo no beta?
            </p>
            <p className="mt-2 text-sm leading-relaxed text-white/50">
              Conte exatamente o que travou, faltou ou atrapalhou sua rotina. Isso ajuda a decidir a próxima melhoria.
            </p>
            <button
              type="button"
              onClick={onSuggestions}
              className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 text-[10px] font-black uppercase tracking-widest text-black"
            >
              <MessageSquarePlus size={14} />
              Enviar sugestão
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {copy.cards.map(card => {
          const Icon = card.icon;
          return (
            <article key={card.title} className="rounded-lg border border-white/10 bg-white/5 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/8">
                <Icon size={20} className={copy.accent} />
              </div>
              <h2 className="mt-4 text-lg font-black text-white">{card.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/45">{card.text}</p>
            </article>
          );
        })}
      </section>
    </motion.div>
  );
}
