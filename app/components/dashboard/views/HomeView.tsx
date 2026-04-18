"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  Activity,
  Bell,
  CalendarCheck,
  ChevronRight,
  Flame,
  ShieldCheck,
  Target,
  Users,
  Utensils,
  type LucideIcon,
} from "lucide-react";

interface HomeViewProps {
  hasProfile: boolean;
  currentUser: any;
  onStartWorkout: (id: string) => void;
  setCurrentView: (view: any) => void;
  canBossPanel?: boolean;
}

type HeroAction = {
  label: string;
  onClick: () => void;
};

type SummaryCard = {
  key: string;
  eyebrow: string;
  title: string;
  detail: string;
  status: string;
  icon: LucideIcon;
  onClick: () => void;
  actionLabel: string;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { y: 18, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 110, damping: 16 },
  },
};

const roleLabels: Record<string, string> = {
  aluno: "Painel do aluno",
  personal: "Painel do personal trainer",
  instrutor: "Painel do instrutor",
  nutri: "Painel da nutrição",
  nutricionista: "Painel da nutrição",
  influencer: "Painel do influenciador",
  adm: "Painel administrativo",
  admin: "Painel administrativo",
};

const getFirstName = (user: any) => {
  const value = String(user?.name || user?.nickname || "Atleta").trim();
  return value.split(/\s+/)[0] || "Atleta";
};

const clampPercent = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const getWorkoutStatusLabel = (status?: string) => {
  if (status === "concluido") return "Concluído hoje";
  if (status === "em_andamento") return "Em andamento";
  if (status === "nao_iniciado") return "Pronto para iniciar";
  return "Sem treino agendado";
};

export const HomeView = ({
  hasProfile,
  currentUser,
  onStartWorkout,
  setCurrentView,
  canBossPanel,
}: HomeViewProps) => {
  const [stats, setStats] = useState<any>(null);
  const [profileProgress, setProfileProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch(`/api/treinos/dashboard?userId=${currentUser.id}`);
        const json = await res.json();
        if (json.success) setStats(json.data);
      } catch {
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.id) fetchDashboard();
    else setLoading(false);
  }, [currentUser?.id]);

  useEffect(() => {
    let alive = true;

    if (!currentUser?.id) return;

    fetch("/api/perfil/complementar", { cache: "no-store" })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (alive && data?.profile) setProfileProgress(Number(data.profile.progresso || 0));
      })
      .catch(() => {
        if (alive) setProfileProgress(0);
      });

    return () => {
      alive = false;
    };
  }, [currentUser?.id]);

  const firstName = getFirstName(currentUser);
  const roleKey = String(currentUser?.role || "").toLowerCase();
  const roleLabel = roleLabels[roleKey] || "Painel principal";
  const todayWorkout = stats?.hoje;
  const pendingNotifs = stats?.notificacoes?.length ?? 0;
  const completedWeek = Number(stats?.stats?.concluidosSemana ?? 0);
  const weeklyGoal = Number(stats?.stats?.metaSemanal ?? 5);
  const weeklyCompletion = weeklyGoal > 0 ? clampPercent((completedWeek / weeklyGoal) * 100) : 0;
  const streak = Number(currentUser?.streak || 0);
  const workoutReady = Boolean(todayWorkout?.id && todayWorkout.status !== "concluido");
  const workoutStatus = getWorkoutStatusLabel(todayWorkout?.status);
  const immediateFocus = pendingNotifs > 0
    ? `${pendingNotifs} aviso${pendingNotifs === 1 ? "" : "s"} aguardando sua atenção agora.`
    : workoutReady
      ? "Seu treino do dia está pronto para começar."
      : profileProgress < 70
        ? "Finalize seu perfil para liberar ajustes mais precisos."
        : "Sua rotina está organizada para manter constância.";

  const heroState = useMemo(() => {
    if (loading) {
      return {
        lead: "Atualizando seu painel de hoje.",
        detail: "Treino, metas, perfil e avisos estão sendo sincronizados para definir sua próxima prioridade.",
        badge: "Sincronização",
        primary: { label: "Abrir treinos", onClick: () => setCurrentView("treinos") } satisfies HeroAction,
        secondary: { label: "Abrir perfil", onClick: () => setCurrentView("perfil") } satisfies HeroAction,
      };
    }

    if (pendingNotifs > 0) {
      return {
        lead: pendingNotifs === 1 ? "1 aviso precisa da sua atenção." : `${pendingNotifs} avisos precisam da sua atenção.`,
        detail: "Resolva os avisos primeiro para manter treino e nutrição em dia.",
        badge: "Avisos",
        primary: { label: "Abrir comunidades", onClick: () => setCurrentView("comunidades") } satisfies HeroAction,
        secondary: {
          label: workoutReady ? "Começar treino" : "Abrir treinos",
          onClick: () => {
            if (workoutReady) onStartWorkout(todayWorkout.id);
            else setCurrentView("treinos");
          },
        } satisfies HeroAction,
      };
    }

    if (todayWorkout?.id && todayWorkout.status !== "concluido") {
      return {
        lead: "Seu treino de hoje já está liberado.",
        detail: `${todayWorkout.titulo} com ${todayWorkout.totalExercicios} exercícios prontos para execução.`,
        badge: "Treino do dia",
        primary: {
          label: "Começar treino",
          onClick: () => onStartWorkout(todayWorkout.id),
        } satisfies HeroAction,
        secondary: { label: "Abrir nutrição", onClick: () => setCurrentView("nutricao") } satisfies HeroAction,
      };
    }

    if (profileProgress < 70) {
      return {
        lead: "Seu perfil ainda está incompleto.",
        detail: "Complete seus dados para receber orientações de treino e nutrição mais precisas.",
        badge: "Perfil pendente",
        primary: { label: "Completar perfil", onClick: () => setCurrentView("perfil") } satisfies HeroAction,
        secondary: { label: "Ver evolução", onClick: () => setCurrentView("metricas") } satisfies HeroAction,
      };
    }

    return {
      lead: "Você está no ritmo certo nesta semana.",
      detail: `Você já concluiu ${completedWeek} de ${weeklyGoal} treinos planejados.`,
      badge: "Ritmo da semana",
      primary: { label: "Abrir treinos", onClick: () => setCurrentView("treinos") } satisfies HeroAction,
      secondary: { label: "Abrir nutrição", onClick: () => setCurrentView("nutricao") } satisfies HeroAction,
    };
  }, [
    completedWeek,
    loading,
    onStartWorkout,
    pendingNotifs,
    profileProgress,
    setCurrentView,
    todayWorkout,
    weeklyGoal,
    workoutReady,
  ]);

  const summaryCards: SummaryCard[] = [
    {
      key: "treino",
      eyebrow: "Treino",
      title: loading ? "Buscando treino de hoje" : todayWorkout?.titulo || "Nenhum treino publicado",
      detail: todayWorkout?.id
        ? `${todayWorkout.totalExercicios} exercícios disponíveis - ${workoutStatus.toLowerCase()}.`
        : "Assim que um treino for publicado, ele aparece aqui.",
      status: workoutStatus,
      icon: Activity,
      onClick: () => {
        if (workoutReady) onStartWorkout(todayWorkout.id);
        else setCurrentView("treinos");
      },
      actionLabel: workoutReady ? "Iniciar agora" : "Abrir treinos",
    },
    {
      key: "nutricao",
      eyebrow: "Nutrição",
      title: profileProgress >= 70 ? "Plano nutricional disponível" : "Perfil incompleto para nutrição",
      detail:
        profileProgress >= 70
          ? "Cardápio, histórico e avaliação prontos para consulta."
          : "Complete o perfil para liberar um plano alimentar mais assertivo.",
      status: profileProgress >= 70 ? "Pronto para uso" : "Perfil pendente",
      icon: Utensils,
      onClick: () => setCurrentView(profileProgress >= 70 ? "nutricao" : "perfil"),
      actionLabel: profileProgress >= 70 ? "Abrir nutrição" : "Completar perfil",
    },
    {
      key: "evolucao",
      eyebrow: "Evolução",
      title: `${completedWeek} treino${completedWeek === 1 ? "" : "s"} concluído${completedWeek === 1 ? "" : "s"} na semana`,
      detail: `Meta semanal em ${weeklyCompletion}%.`,
      status: `${weeklyCompletion}% da meta`,
      icon: Target,
      onClick: () => setCurrentView("metricas"),
      actionLabel: "Ver evolução",
    },
    {
      key: "comunidades",
      eyebrow: "Comunidades",
      title: pendingNotifs > 0 ? `${pendingNotifs} aviso(s) para revisar` : "Comunidades em dia",
      detail: pendingNotifs > 0 ? "Abra Comunidades para revisar as pendências." : "Sem recados urgentes nas comunidades.",
      status: pendingNotifs > 0 ? "Pendente" : "Em dia",
      icon: Users,
      onClick: () => setCurrentView("comunidades"),
      actionLabel: "Abrir comunidades",
    },
  ];

  return (
    <motion.div
      key="home"
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, y: -20 }}
      variants={containerVariants}
      className="mx-auto max-w-7xl space-y-3 text-left sm:space-y-5 lg:space-y-6"
    >
      <motion.section
        variants={itemVariants}
        className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#06101D] p-4 shadow-2xl sm:p-6 lg:p-8"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.16),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.08),transparent_28%)]" />
        <div className="relative grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-sky-500 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-black">
                {roleLabel}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-white/45">
                Resumo do dia
              </span>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <div className="relative h-14 w-14 overflow-hidden rounded-[18px] border border-white/10 bg-white/5 sm:h-16 sm:w-16">
                <Image
                  src={currentUser?.avatar || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200"}
                  alt={firstName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-sky-300">Olá, {firstName}</p>
                <p className="mt-1 text-sm leading-relaxed text-white/50">
                  {hasProfile ? "Seu painel está sincronizado para hoje." : "Complete seu perfil para liberar uma experiência personalizada."}
                </p>
              </div>
            </div>

            <h1 className="mt-4 break-words text-[1.85rem] font-black italic leading-none tracking-tighter text-white sm:text-5xl lg:text-6xl">
              {heroState.lead}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/50">{heroState.detail}</p>
            <div className="mt-3 rounded-[14px] border border-white/10 bg-black/20 px-3 py-2.5">
              <p className="text-[8px] font-black uppercase tracking-widest text-sky-300">Foco imediato</p>
              <p className="mt-1 text-xs leading-relaxed text-white/55">{immediateFocus}</p>
            </div>

            <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:gap-3">
              <button
                type="button"
                onClick={heroState.primary.onClick}
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-sky-500 px-5 text-[10px] font-black uppercase tracking-widest text-black transition hover:bg-sky-400"
              >
                {heroState.primary.label}
              </button>
              <button
                type="button"
                onClick={heroState.secondary.onClick}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/10 bg-white/5 px-5 text-[10px] font-black uppercase tracking-widest text-white/75 transition hover:bg-white/10 hover:text-white"
              >
                {heroState.secondary.label}
              </button>
            </div>
          </div>

          <aside className="grid grid-cols-3 gap-2 lg:grid-cols-1 lg:gap-3">
            <div className="rounded-[18px] border border-white/10 bg-black/25 px-3 py-3 lg:px-4">
              <CalendarCheck size={15} className="text-sky-300" />
              <p className="mt-2 text-[8px] font-black uppercase tracking-widest text-white/30">Meta</p>
              <p className="mt-1 text-sm font-black text-white">{completedWeek}/{weeklyGoal}</p>
            </div>
            <div className="rounded-[18px] border border-white/10 bg-black/25 px-3 py-3 lg:px-4">
              <Flame size={15} className="text-sky-300" />
              <p className="mt-2 text-[8px] font-black uppercase tracking-widest text-white/30">Sequência</p>
              <p className="mt-1 text-sm font-black text-white">{streak} dia(s)</p>
            </div>
            <div className="rounded-[18px] border border-white/10 bg-black/25 px-3 py-3 lg:px-4">
              <Bell size={15} className="text-sky-300" />
              <p className="mt-2 text-[8px] font-black uppercase tracking-widest text-white/30">Avisos</p>
              <p className="mt-1 text-sm font-black text-white">{pendingNotifs}</p>
            </div>
            <div className="col-span-3 hidden rounded-[18px] border border-white/10 bg-black/25 px-4 py-4 lg:block">
              <p className="text-[8px] font-black uppercase tracking-widest text-sky-300">Radar da semana</p>
              <p className="mt-2 text-4xl font-black italic text-white">{weeklyCompletion}%</p>
              <p className="mt-1 text-xs text-white/40">{heroState.badge}</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full bg-sky-400" style={{ width: `${Math.max(weeklyCompletion, profileProgress)}%` }} />
              </div>
            </div>
          </aside>
        </div>
      </motion.section>

      <motion.section
        variants={itemVariants}
        className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] p-4 shadow-xl sm:p-6"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/25 to-transparent" />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-sky-300">Resumo central</p>
            <h2 className="mt-1 break-words text-2xl font-black italic leading-none tracking-tighter text-white sm:text-3xl">
              Prioridades reais para o seu dia
            </h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-white/45">
            <ShieldCheck size={13} className="text-sky-300" />
            {hasProfile ? "Perfil em uso" : "Perfil incompleto"}
          </div>
        </div>

        <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-4">
          {summaryCards.map(card => {
            const Icon = card.icon;
            return (
              <button
                key={card.key}
                type="button"
                onClick={card.onClick}
                className="min-w-0 rounded-[22px] border border-white/10 bg-black/20 px-3 py-3.5 text-left transition hover:border-sky-400/20 hover:bg-white/[0.06] sm:px-4 sm:py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[7px] font-black uppercase tracking-widest text-white/28 sm:text-[8px]">{card.eyebrow}</p>
                    <span className="mt-2 inline-flex max-w-full items-center rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[7px] font-black uppercase tracking-widest text-white/45 sm:text-[8px]">
                      <span className="break-words [overflow-wrap:anywhere]">{card.status}</span>
                    </span>
                  </div>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] border border-white/10 bg-white/5">
                    <Icon size={16} className="text-sky-300" />
                  </div>
                </div>

                <p className="mt-3 break-words text-sm font-black leading-snug text-white [overflow-wrap:anywhere]">{card.title}</p>
                <p className="mt-2 break-words text-xs leading-relaxed text-white/42 [overflow-wrap:anywhere]">{card.detail}</p>

                <div className="mt-3 inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-sky-300 sm:text-[9px]">
                  {card.actionLabel}
                  <ChevronRight size={14} />
                </div>
              </button>
            );
          })}
        </div>
      </motion.section>
    </motion.div>
  );
};
