"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Bell,
  CalendarCheck,
  ClipboardList,
  HelpCircle,
  MessageSquarePlus,
  UserRound,
} from "lucide-react";

interface HomeViewProps {
  hasProfile: boolean;
  currentUser: any;
  onStartWorkout: (id: string) => void;
  setCurrentView: (view: any) => void;
  setSocialRoute: (route: any) => void;
  setIsGuestMode: (mode: boolean) => void;
  canBossPanel?: boolean;
}

type ContextAction = {
  id: string;
  score: number;
  label: string;
  title: string;
  desc: string;
  cta: string;
  icon: React.ElementType;
  onClick: () => void;
  accent: string;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { y: 10, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 125, damping: 18 } },
};

const roleLabels: Record<string, string> = {
  aluno: "Aluno",
  personal: "Personal trainer",
  instrutor: "Instrutor",
  nutri: "Nutricionista",
  nutricionista: "Nutricionista",
  influencer: "Influenciador",
  adm: "Administrador",
  admin: "Administrador",
};

const getFirstName = (user: any) => {
  const value = String(user?.name || user?.nickname || "Atleta").trim();
  return value.split(/\s+/)[0] || "Atleta";
};

const getPeriodLabel = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Manhã";
  if (hour < 18) return "Tarde";
  return "Noite";
};

export const HomeView = ({
  currentUser,
  onStartWorkout,
  setCurrentView,
  setSocialRoute,
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
      } catch (err) {
        console.error("Erro ao carregar dashboard:", err);
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
  const roleLabel = roleLabels[String(currentUser?.role || "").toLowerCase()] || "Perfil ativo";
  const periodLabel = getPeriodLabel();
  const todayWorkout = stats?.hoje;
  const weekStats = stats?.stats ?? { concluidosSemana: 0, metaSemanal: 5, porcentagem: 0 };
  const unreadNotifications = Array.isArray(stats?.notificacoes) ? stats.notificacoes : [];
  const pendingNotifs = unreadNotifications.length;
  const lastNotificationTitle = unreadNotifications[0]?.title;
  const hasWorkoutToday = Boolean(todayWorkout?.id);
  const workoutPending = hasWorkoutToday && todayWorkout?.status !== "concluido";
  const workoutDone = hasWorkoutToday && todayWorkout?.status === "concluido";
  const profileNeedsAttention = profileProgress < 80;
  const remainingForGoal = Math.max((weekStats.metaSemanal || 0) - (weekStats.concluidosSemana || 0), 0);

  const workoutSummary = useMemo(
    () =>
      [
        todayWorkout?.titulo,
        todayWorkout?.foco,
        todayWorkout?.totalExercicios ? `${todayWorkout.totalExercicios} exercícios` : null,
      ]
        .filter(Boolean)
        .join(" • "),
    [todayWorkout?.foco, todayWorkout?.titulo, todayWorkout?.totalExercicios],
  );

  const contextualActions = useMemo<ContextAction[]>(() => {
    const items: ContextAction[] = [];
    const hour = new Date().getHours();

    if (workoutPending) {
      items.push({
        id: "treino-hoje",
        score: 100 + (hour >= 18 ? 8 : 0),
        label: "Treino do dia",
        title: todayWorkout?.titulo || "Treino pronto",
        desc: workoutSummary || "Seu treino de hoje já está liberado.",
        cta: "Começar treino",
        icon: CalendarCheck,
        onClick: () => onStartWorkout(todayWorkout.id),
        accent: "text-sky-300",
      });
    }

    if (pendingNotifs > 0) {
      items.push({
        id: "avisos",
        score: 92 + Math.min(pendingNotifs, 5),
        label: "Avisos",
        title: pendingNotifs === 1 ? "1 aviso aguardando leitura" : `${pendingNotifs} avisos aguardando leitura`,
        desc: lastNotificationTitle ? `Último aviso: ${lastNotificationTitle}` : "Abra a comunidade para revisar recados.",
        cta: "Abrir comunidades",
        icon: Bell,
        onClick: () => setCurrentView("comunidades"),
        accent: "text-amber-300",
      });
    }

    if (profileNeedsAttention) {
      items.push({
        id: "perfil",
        score: profileProgress < 40 ? 88 : 74,
        label: "Perfil",
        title: profileProgress < 40 ? "Complete seu perfil" : "Ainda faltam ajustes no perfil",
        desc: `${profileProgress}% preenchido. Isso impacta treino e nutrição.`,
        cta: "Abrir perfil",
        icon: UserRound,
        onClick: () => setCurrentView("perfil"),
        accent: "text-emerald-300",
      });
    }

    if (remainingForGoal > 0) {
      items.push({
        id: "meta",
        score: workoutPending ? 58 : 72,
        label: "Semana",
        title: weekStats.concluidosSemana > 0 ? `Faltam ${remainingForGoal} treinos para a meta` : "Sua semana ainda não começou",
        desc: weekStats.concluidosSemana > 0 ? `${weekStats.concluidosSemana}/${weekStats.metaSemanal} concluídos nesta semana.` : `Meta atual: ${weekStats.metaSemanal} treinos.`,
        cta: "Abrir treinos",
        icon: Activity,
        onClick: () => setCurrentView("treinos"),
        accent: "text-emerald-300",
      });
    } else {
      items.push({
        id: "meta-feita",
        score: 64,
        label: "Semana",
        title: "Meta semanal concluída",
        desc: `${weekStats.concluidosSemana}/${weekStats.metaSemanal} treinos fechados nesta semana.`,
        cta: "Ver evolução",
        icon: Activity,
        onClick: () => setCurrentView("metricas"),
        accent: "text-emerald-300",
      });
    }

    if (!workoutPending && pendingNotifs === 0) {
      items.push({
        id: "comunidade",
        score: 46,
        label: "Comunidade",
        title: "Passe na comunidade",
        desc: "Confira ranking, avisos e o que mudou no seu grupo.",
        cta: "Abrir comunidades",
        icon: ClipboardList,
        onClick: () => setCurrentView("comunidades"),
        accent: "text-sky-300",
      });
    }

    if (!profileNeedsAttention && !workoutPending && !workoutDone) {
      items.push({
        id: "social",
        score: 34,
        label: "Social",
        title: "Veja o que rolou no Ativora Social",
        desc: "Feed, mensagens e stories continuam disponíveis.",
        cta: "Abrir social",
        icon: MessageSquarePlus,
        onClick: () => {
          setSocialRoute("feed");
          setCurrentView("social");
        },
        accent: "text-sky-300",
      });
    }

    return items.sort((a, b) => b.score - a.score);
  }, [
    lastNotificationTitle,
    onStartWorkout,
    pendingNotifs,
    profileNeedsAttention,
    profileProgress,
    remainingForGoal,
    setCurrentView,
    setSocialRoute,
    todayWorkout?.id,
    todayWorkout?.titulo,
    workoutDone,
    workoutPending,
    workoutSummary,
    weekStats.concluidosSemana,
    weekStats.metaSemanal,
  ]);

  const primaryAction = contextualActions[0];
  const secondaryAction = contextualActions[1];
  const queueActions = contextualActions.slice(secondaryAction ? 2 : 1, 5);

  const supportActions = [
    {
      id: "evolucao",
      label: "Acompanhamento",
      title: "Evolução",
      desc: "Medidas e constância.",
      cta: "Abrir evolução",
      icon: Activity,
      onClick: () => setCurrentView("metricas"),
      accent: "text-emerald-300",
    },
    {
      id: "ajuda",
      label: "Suporte",
      title: "Ajuda",
      desc: "Dúvidas rápidas e orientação.",
      cta: "Abrir ajuda",
      icon: HelpCircle,
      onClick: () => setCurrentView("ajuda"),
      accent: "text-sky-300",
    },
    {
      id: "sugestoes",
      label: "Beta",
      title: "Sugestões",
      desc: "Ideias para melhorar o app.",
      cta: "Enviar sugestão",
      icon: MessageSquarePlus,
      onClick: () => setCurrentView("sugestoes"),
      accent: "text-emerald-300",
    },
  ] as ContextAction[];

  const metrics = [
    {
      id: "today",
      label: "Hoje",
      value: loading ? "..." : workoutPending ? "Treino pronto" : workoutDone ? "Concluído" : "Sem treino",
      detail: workoutSummary || "Sem treino publicado para hoje.",
      accent: "text-sky-300",
    },
    {
      id: "week",
      label: "Semana",
      value: `${weekStats.concluidosSemana}/${weekStats.metaSemanal}`,
      detail: remainingForGoal > 0 ? `Faltam ${remainingForGoal} treinos para a meta.` : "Meta semanal concluída.",
      accent: "text-emerald-300",
    },
    {
      id: "profile",
      label: "Perfil",
      value: `${profileProgress}%`,
      detail: profileNeedsAttention ? "Ainda faltam ajustes importantes." : "Dados principais em dia.",
      accent: "text-emerald-300",
    },
    {
      id: "alerts",
      label: "Avisos",
      value: String(pendingNotifs),
      detail: pendingNotifs > 0 ? lastNotificationTitle || "Há avisos aguardando leitura." : "Nenhum aviso pendente.",
      accent: "text-amber-300",
    },
  ];

  const stateCards = [
    {
      id: "treinos",
      title: "Treinos",
      value: workoutPending ? "Treino de hoje pronto" : workoutDone ? "Treino concluído hoje" : "Sem treino hoje",
      detail: workoutSummary || "Abra a área de treinos para revisar sua rotina.",
      onClick: () => setCurrentView("treinos"),
    },
    {
      id: "comunidades",
      title: "Comunidades",
      value: pendingNotifs > 0 ? `${pendingNotifs} aviso${pendingNotifs === 1 ? "" : "s"}` : "Sem novos avisos",
      detail: lastNotificationTitle || "Confira ranking, atualizações e recados.",
      onClick: () => setCurrentView("comunidades"),
    },
    {
      id: "perfil",
      title: "Meu Perfil",
      value: `${profileProgress}% preenchido`,
      detail: profileNeedsAttention ? "Faltam dados que refinam sua rotina." : "Seus dados principais já estão salvos.",
      onClick: () => setCurrentView("perfil"),
    },
    {
      id: "evolucao",
      title: "Evolução",
      value: weekStats.concluidosSemana > 0 ? `${weekStats.concluidosSemana} treino${weekStats.concluidosSemana === 1 ? "" : "s"} na semana` : "Semana em aberto",
      detail: remainingForGoal > 0 ? `Meta atual: ${weekStats.metaSemanal}.` : "Meta semanal já foi concluída.",
      onClick: () => setCurrentView("metricas"),
    },
  ];

  const activityFeed = [
    workoutPending
      ? {
          id: "feed-workout",
          label: "Agora",
          title: "Treino liberado",
          desc: workoutSummary || "Seu treino do dia está disponível.",
          onClick: () => onStartWorkout(todayWorkout.id),
        }
      : null,
    pendingNotifs > 0
      ? {
          id: "feed-alerts",
          label: "Avisos",
          title: pendingNotifs === 1 ? "1 atualização importante" : `${pendingNotifs} atualizações importantes`,
          desc: lastNotificationTitle || "Abra a comunidade para revisar os avisos.",
          onClick: () => setCurrentView("comunidades"),
        }
      : null,
    profileNeedsAttention
      ? {
          id: "feed-profile",
          label: "Perfil",
          title: "Seu perfil ainda precisa de atenção",
          desc: `${profileProgress}% preenchido. Complete os campos que faltam.`,
          onClick: () => setCurrentView("perfil"),
        }
      : null,
    {
      id: "feed-week",
      label: "Semana",
      title: remainingForGoal > 0 ? "Meta semanal em andamento" : "Meta semanal concluída",
      desc:
        remainingForGoal > 0
          ? `${weekStats.concluidosSemana}/${weekStats.metaSemanal} treinos concluídos até aqui.`
          : `${weekStats.concluidosSemana}/${weekStats.metaSemanal} treinos concluídos nesta semana.`,
      onClick: () => setCurrentView("metricas"),
    },
  ].filter(Boolean) as { id: string; label: string; title: string; desc: string; onClick: () => void }[];

  const renderSupportCard = (item: ContextAction) => {
    const Icon = item.icon;
    return (
      <button
        key={item.id}
        type="button"
        onClick={item.onClick}
        className="group flex items-start gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-3 text-left transition hover:border-white/20 hover:bg-black/30"
      >
        <div className="rounded-lg border border-white/10 bg-white/5 p-2.5">
          <Icon size={16} className={item.accent} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[8px] font-black uppercase tracking-widest text-white/30">
                {item.label}
              </p>
              <h3 className="mt-1 text-sm font-black leading-tight text-white">
                {item.title}
              </h3>
            </div>
            <ArrowRight size={15} className="mt-0.5 shrink-0 text-white/20 transition group-hover:translate-x-1 group-hover:text-sky-300" />
          </div>
          <p className="mt-1 text-xs leading-snug text-white/45">
            {item.desc}
          </p>
        </div>
      </button>
    );
  };

  return (
    <motion.div
      key="home"
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, y: -16 }}
      variants={containerVariants}
      className="mx-auto max-w-6xl space-y-3 pb-2 text-left lg:space-y-4"
    >
      {/* mobile */}
      <motion.section variants={itemVariants} className="rounded-lg border border-white/10 bg-[#06101D] p-3 sm:hidden">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-black">
              <Activity size={12} />
              {roleLabel}
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/42">
              {periodLabel}, {firstName}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
              <p className="text-[8px] font-black uppercase tracking-widest text-white/30">Hoje</p>
              <p className="mt-0.5 text-xs font-black text-white">
                {loading ? "..." : workoutPending ? "Treino pronto" : workoutDone ? "Concluído" : "Sem treino"}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
              <p className="text-[8px] font-black uppercase tracking-widest text-white/30">
                {profileNeedsAttention ? "Perfil" : "Avisos"}
              </p>
              <p className="mt-0.5 text-xs font-black text-white">
                {profileNeedsAttention ? `${profileProgress}%` : pendingNotifs}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 space-y-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-sky-300">
              {primaryAction?.label || "Agora"}
            </p>
            <h1 className="mt-1 text-base font-black tracking-tight text-white">
              {primaryAction?.title || "Seu dia está organizado"}
            </h1>
            <p className="mt-1 text-[12px] leading-relaxed text-white/60">
              {primaryAction?.desc || "Continue pelo treino, pela comunidade ou pelo social."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={primaryAction?.onClick}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 text-[10px] font-black uppercase tracking-widest text-black transition hover:bg-sky-400 active:scale-[0.98]"
            >
              {primaryAction?.cta || "Abrir comunidades"}
              <ArrowRight size={13} />
            </button>

            {secondaryAction && (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-1 text-[10px] font-black uppercase tracking-widest text-white/72 transition hover:text-white active:scale-[0.98]"
              >
                {secondaryAction.cta}
                <ArrowRight size={12} />
              </button>
            )}
          </div>
        </div>
      </motion.section>

      <motion.section variants={itemVariants} className="space-y-2 sm:hidden">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-sky-300">
            Sua fila
          </p>
          <h2 className="mt-1 text-base font-black tracking-tight text-white">
            O que vem depois
          </h2>
        </div>

        <div className="space-y-2">
          {queueActions.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className="group flex w-full items-start gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-3 text-left transition hover:border-white/20 hover:bg-black/30"
              >
                <div className="rounded-lg border border-white/10 bg-white/5 p-2.5">
                  <Icon size={16} className={item.accent} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[8px] font-black uppercase tracking-widest text-white/30">
                        {item.label}
                      </p>
                      <h3 className="mt-1 text-sm font-black leading-tight text-white">
                        {item.title}
                      </h3>
                    </div>
                    <ArrowRight size={15} className="mt-0.5 shrink-0 text-white/20 transition group-hover:translate-x-1 group-hover:text-sky-300" />
                  </div>
                  <p className="mt-1 text-xs leading-snug text-white/50">
                    {item.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </motion.section>

      <motion.section variants={itemVariants} className="rounded-lg border border-white/10 bg-white/5 p-3 sm:p-4 lg:hidden">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-sky-300">
            Apoio rápido
          </p>
          <h2 className="mt-1 text-base font-black tracking-tight text-white">
            Acompanhar e ajustar
          </h2>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {supportActions.map(renderSupportCard)}
        </div>
      </motion.section>

      {/* desktop */}
      <motion.section variants={itemVariants} className="hidden rounded-xl border border-white/10 bg-[#06101D] p-5 lg:block">
        <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-sky-300">
              {periodLabel}, {firstName}
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white">
              {primaryAction?.title || "Seu dia está organizado"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/58">
              {primaryAction?.desc || "Continue pela próxima ação importante do seu painel."}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={primaryAction?.onClick}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-sky-500 px-5 text-[10px] font-black uppercase tracking-widest text-black transition hover:bg-sky-400 active:scale-[0.98]"
              >
                {primaryAction?.cta || "Abrir comunidades"}
                <ArrowRight size={14} />
              </button>
              {secondaryAction && (
                <button
                  type="button"
                  onClick={secondaryAction.onClick}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 text-[10px] font-black uppercase tracking-widest text-white/78 transition hover:bg-white/10 hover:text-white"
                >
                  {secondaryAction.cta}
                  <ArrowRight size={13} />
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-xl border border-white/10 bg-black/25 p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-white/30">
                Treino de hoje
              </p>
              <p className="mt-2 text-lg font-black text-white">
                {loading ? "Carregando" : workoutPending ? "Pronto" : workoutDone ? "Concluído" : "Sem treino"}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/48">
                {workoutSummary || "Assim que um treino for publicado, ele aparece aqui."}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/25 p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-white/30">
                Perfil e rotina
              </p>
              <p className="mt-2 text-lg font-black text-white">
                {profileNeedsAttention ? `${profileProgress}% preenchido` : "Perfil em dia"}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/48">
                {profileNeedsAttention ? "Ainda faltam dados que refinam treino e nutrição." : `Meta semanal: ${weekStats.metaSemanal} treinos.`}
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section variants={itemVariants} className="hidden lg:block">
        <div className="grid gap-3 xl:grid-cols-4">
          {metrics.map(item => (
            <div key={item.id} className="rounded-xl border border-white/10 bg-white/5 px-4 py-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-white/30">
                {item.label}
              </p>
              <p className={`mt-2 text-xl font-black ${item.accent}`}>
                {item.value}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/45">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </motion.section>

      <div className="hidden gap-4 lg:grid lg:grid-cols-[1.08fr_0.92fr]">
        <motion.section variants={itemVariants} className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-sky-300">
              Atualizações
            </p>
            <h2 className="mt-1 text-lg font-black tracking-tight text-white">
              O que mudou no seu painel
            </h2>
          </div>

          <div className="mt-4 space-y-3">
            {activityFeed.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className="flex w-full items-start gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-4 text-left transition hover:border-white/20 hover:bg-black/30"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] font-black uppercase tracking-widest text-sky-300">
                    {item.label}
                  </p>
                  <h3 className="mt-1 text-sm font-black text-white">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/48">
                    {item.desc}
                  </p>
                </div>
                <ArrowRight size={16} className="mt-1 shrink-0 text-white/20" />
              </button>
            ))}
          </div>

          <div className="mt-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-sky-300">
              Estados do app
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {stateCards.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.onClick}
                  className="rounded-xl border border-white/10 bg-black/20 px-4 py-4 text-left transition hover:border-white/20 hover:bg-black/30"
                >
                  <p className="text-[8px] font-black uppercase tracking-widest text-white/30">
                    {item.title}
                  </p>
                  <h3 className="mt-2 text-sm font-black text-white">
                    {item.value}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/45">
                    {item.detail}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </motion.section>

        <div className="space-y-4">
          <motion.section variants={itemVariants} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-sky-300">
              Progresso semanal
            </p>
            <h2 className="mt-1 text-lg font-black tracking-tight text-white">
              {weekStats.concluidosSemana}/{weekStats.metaSemanal} treinos
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/48">
              {remainingForGoal > 0 ? `Faltam ${remainingForGoal} treinos para fechar sua meta da semana.` : "Sua meta semanal já foi concluída."}
            </p>

            <div className="mt-4 h-2 rounded-full bg-white/5">
              <div
                className="h-2 rounded-full bg-sky-500 transition-all"
                style={{ width: `${Math.max(8, weekStats.porcentagem || 0)}%` }}
              />
            </div>

            <div className="mt-4 space-y-2">
              {queueActions.slice(0, 2).map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.onClick}
                  className="flex w-full items-start justify-between gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-3 text-left transition hover:border-white/20 hover:bg-black/30"
                >
                  <div className="min-w-0">
                    <p className="text-[8px] font-black uppercase tracking-widest text-white/30">
                      {item.label}
                    </p>
                    <p className="mt-1 text-sm font-black text-white">
                      {item.title}
                    </p>
                  </div>
                  <ArrowRight size={15} className="mt-1 shrink-0 text-white/20" />
                </button>
              ))}
            </div>
          </motion.section>

          <motion.section variants={itemVariants} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-sky-300">
              Apoio rápido
            </p>
            <div className="mt-3 space-y-2">
              {supportActions.map(renderSupportCard)}
            </div>
          </motion.section>
        </div>
      </div>
    </motion.div>
  );
};
