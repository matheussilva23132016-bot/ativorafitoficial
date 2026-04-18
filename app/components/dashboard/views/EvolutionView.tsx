"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck2,
  ChevronDown,
  ChevronLeft,
  ClipboardCheck,
  MessageSquarePlus,
  RefreshCw,
  Target,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";

type EvolutionTab = "resumo" | "plano" | "entender";
type GuideId = "perfil" | "ritmo" | "comunidades";

interface EvolutionViewProps {
  currentUser?: any;
  onBack: () => void;
  onSuggestions: () => void;
  onOpenProfile?: () => void;
  onOpenTreinos?: () => void;
  onOpenCommunities?: () => void;
}

interface EvolutionSnapshot {
  profileProgress: number;
  profileObjective: string;
  profileUpdatedAt: string;
  workoutsDone: number;
  workoutsGoal: number;
  communitiesActive: number;
  communitiesPending: number;
  pendingNotifications: number;
}

const EMPTY_SNAPSHOT: EvolutionSnapshot = {
  profileProgress: 0,
  profileObjective: "",
  profileUpdatedAt: "",
  workoutsDone: 0,
  workoutsGoal: 5,
  communitiesActive: 0,
  communitiesPending: 0,
  pendingNotifications: 0,
};

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function formatDateTime(value: string) {
  if (!value) return "Sem atualização recente";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Sem atualização recente";
  return parsed.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function readJsonSafe(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function EvolutionView({
  currentUser,
  onBack,
  onSuggestions,
  onOpenProfile,
  onOpenTreinos,
  onOpenCommunities,
}: EvolutionViewProps) {
  const [activeTab, setActiveTab] = useState<EvolutionTab>("resumo");
  const [openGuide, setOpenGuide] = useState<GuideId>("perfil");
  const [snapshot, setSnapshot] = useState<EvolutionSnapshot>(EMPTY_SNAPSHOT);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSnapshot = useCallback(
    async (silent = false) => {
      const userId = String(currentUser?.id || "").trim();
      if (!userId) {
        setSnapshot(EMPTY_SNAPSHOT);
        setLoading(false);
        return;
      }

      if (silent) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const [profileRes, workoutRes, communitiesRes] = await Promise.all([
          fetch("/api/perfil/complementar", { cache: "no-store" }),
          fetch(`/api/treinos/dashboard?userId=${encodeURIComponent(userId)}`, { cache: "no-store" }),
          fetch(`/api/communities?userId=${encodeURIComponent(userId)}`, { cache: "no-store" }),
        ]);

        const profileData = profileRes.ok ? await readJsonSafe(profileRes) : null;
        const workoutData = workoutRes.ok ? await readJsonSafe(workoutRes) : null;
        const communitiesData = communitiesRes.ok ? await readJsonSafe(communitiesRes) : null;

        const profileProgress = clampPercent(toNumber(profileData?.profile?.progresso, 0));
        const profileObjective = String(profileData?.profile?.objetivoPrincipal || "").trim();
        const profileUpdatedAt = String(profileData?.profile?.updatedAt || "");

        const workoutsDone = Math.max(0, toNumber(workoutData?.data?.stats?.concluidosSemana, 0));
        const workoutsGoal = Math.max(1, toNumber(workoutData?.data?.stats?.metaSemanal, 5));
        const pendingNotifications = Math.max(
          0,
          Array.isArray(workoutData?.data?.notificacoes) ? workoutData.data.notificacoes.length : 0,
        );

        const communities = Array.isArray(communitiesData?.communities) ? communitiesData.communities : [];
        const communitiesActive = communities.filter((item: any) => Boolean(item?.isMember)).length;
        const communitiesPending = communities.filter(
          (item: any) => String(item?.request_status || "").toLowerCase() === "pendente",
        ).length;

        setSnapshot({
          profileProgress,
          profileObjective,
          profileUpdatedAt,
          workoutsDone,
          workoutsGoal,
          communitiesActive,
          communitiesPending,
          pendingNotifications,
        });
      } catch {
        setError("Não consegui atualizar a evolução agora. Tente novamente.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [currentUser?.id],
  );

  useEffect(() => {
    loadSnapshot(false);
  }, [loadSnapshot]);

  const completedPercent = clampPercent((snapshot.workoutsDone / snapshot.workoutsGoal) * 100);
  const workoutsRemaining = Math.max(0, snapshot.workoutsGoal - snapshot.workoutsDone);

  const nextAction = useMemo(() => {
    if (snapshot.profileProgress < 70) {
      return {
        title: "Complete sua base de perfil",
        detail: "Atualize dados de rotina e objetivo para deixar suas recomendações mais precisas.",
      };
    }
    if (workoutsRemaining > 0) {
      return {
        title: `Feche mais ${workoutsRemaining} treino(s) esta semana`,
        detail: "Manter a constância semanal acelera o progresso real e melhora seu histórico.",
      };
    }
    if (snapshot.communitiesActive === 0) {
      return {
        title: "Entre em uma comunidade ativa",
        detail: "Participar de grupo facilita acompanhamento, desafios e troca de feedback.",
      };
    }
    return {
      title: "Seu ritmo está consistente",
      detail: "Continue registrando rotina e ajuste detalhes finos para manter a evolução.",
    };
  }, [snapshot.profileProgress, snapshot.communitiesActive, workoutsRemaining]);

  const planSteps = [
    {
      id: "perfil",
      title: "Base do perfil",
      detail: "Mantenha seu objetivo e rotina atualizados para melhorar o contexto da evolução.",
      done: snapshot.profileProgress >= 70,
      actionLabel: "Abrir perfil",
      onAction: onOpenProfile,
    },
    {
      id: "treinos",
      title: "Constância semanal",
      detail:
        workoutsRemaining === 0
          ? "Meta da semana concluída. Continue no mesmo ritmo."
          : `Ainda faltam ${workoutsRemaining} treino(s) para bater sua meta semanal.`,
      done: workoutsRemaining === 0,
      actionLabel: "Abrir treinos",
      onAction: onOpenTreinos,
    },
    {
      id: "comunidades",
      title: "Evolução em comunidade",
      detail:
        snapshot.communitiesActive > 0
          ? `Você já participa de ${snapshot.communitiesActive} comunidade(s).`
          : "Entrar em um grupo ajuda na manutenção de foco e responsabilidade.",
      done: snapshot.communitiesActive > 0,
      actionLabel: "Abrir comunidades",
      onAction: onOpenCommunities,
    },
  ];

  const guideCards = [
    {
      id: "perfil" as GuideId,
      title: "Perfil preenchido",
      summary: "Mostra qualidade da sua base de dados.",
      body:
        "Quanto maior esse percentual, mais o app entende seu contexto para treino, nutrição e metas semanais.",
    },
    {
      id: "ritmo" as GuideId,
      title: "Constância semanal",
      summary: "Compara treinos concluídos com a meta.",
      body:
        "Use esse número para ajustar a semana em andamento. O foco é manter frequência estável, não volume extremo.",
    },
    {
      id: "comunidades" as GuideId,
      title: "Atividade em comunidades",
      summary: "Mostra presença ativa e solicitações pendentes.",
      body:
        "Comunidades ativas aumentam acompanhamento e feedback. Solicitações pendentes indicam oportunidades para entrar em novos grupos.",
    },
  ];

  return (
    <motion.div
      key="evolution-view"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="mx-auto w-full max-w-6xl space-y-4 text-left sm:space-y-5"
    >
      <button
        type="button"
        onClick={onBack}
        className="flex min-h-10 items-center gap-2 rounded-lg px-1 text-[10px] font-black uppercase tracking-widest text-white/35 transition-colors hover:text-white"
      >
        <ChevronLeft size={16} />
        Voltar ao painel
      </button>

      <section className="rounded-[24px] border border-white/10 bg-[#06101D] p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-widest text-sky-300">evolução</p>
            <h1 className="mt-2 break-words text-2xl font-black italic leading-none tracking-tighter text-white sm:text-3xl">
              Sua evolução com leitura prática
            </h1>
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-white/45">
              Veja seu momento atual, entenda onde focar nesta semana e avance com clareza no celular e no desktop.
            </p>
          </div>

          <div className="flex w-full gap-2 lg:w-auto">
            <button
              type="button"
              onClick={() => loadSnapshot(true)}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-[10px] font-black uppercase tracking-widest text-white/65 transition hover:text-white lg:flex-none"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              Atualizar
            </button>
            <button
              type="button"
              onClick={onSuggestions}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 text-[10px] font-black uppercase tracking-widest text-black transition hover:bg-sky-400 lg:flex-none"
            >
              <MessageSquarePlus size={14} />
              Sugestões
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2 sm:max-w-md">
        {[
          { id: "resumo", label: "Resumo" },
          { id: "plano", label: "Plano" },
          { id: "entender", label: "Entender" },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as EvolutionTab)}
            className={`min-h-11 rounded-xl border px-3 text-[10px] font-black uppercase tracking-widest transition ${
              activeTab === tab.id
                ? "border-sky-500/30 bg-sky-500/15 text-sky-200"
                : "border-white/10 bg-white/5 text-white/45 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </section>

      {error && (
        <article className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-300" />
            <p className="text-xs leading-relaxed text-amber-100/85">{error}</p>
          </div>
        </article>
      )}

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.section
            key="evolution-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-[22px] border border-white/10 bg-[#050B14] p-8 text-center"
          >
            <RefreshCw size={24} className="mx-auto animate-spin text-sky-400" />
            <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-white/35">
              Carregando evolução
            </p>
          </motion.section>
        ) : (
          <motion.section
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            {activeTab === "resumo" && (
              <>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                  {[
                    { label: "Perfil preenchido", value: `${snapshot.profileProgress}%`, icon: UserRound, tone: "text-sky-300" },
                    { label: "Treinos da semana", value: `${snapshot.workoutsDone}/${snapshot.workoutsGoal}`, icon: CalendarCheck2, tone: "text-emerald-300" },
                    { label: "Comunidades ativas", value: String(snapshot.communitiesActive), icon: Users, tone: "text-amber-300" },
                    { label: "Notificações", value: String(snapshot.pendingNotifications), icon: ClipboardCheck, tone: "text-rose-300" },
                  ].map(card => (
                    <article key={card.label} className="rounded-xl border border-white/10 bg-[#050B14] p-3 sm:p-4">
                      <card.icon size={15} className={card.tone} />
                      <p className="mt-2 text-[8px] font-black uppercase tracking-widest text-white/30">{card.label}</p>
                      <p className="mt-1 text-base font-black text-white sm:text-lg">{card.value}</p>
                    </article>
                  ))}
                </div>

                <article className="rounded-xl border border-sky-500/20 bg-sky-500/10 p-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-sky-300">próxima prioridade</p>
                  <h2 className="mt-2 text-sm font-black text-white">{nextAction.title}</h2>
                  <p className="mt-1 text-xs leading-relaxed text-white/60">{nextAction.detail}</p>
                </article>

                <article className="rounded-xl border border-white/10 bg-[#050B14] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/35">ritmo da semana</p>
                    <p className="text-xs font-black text-white">{completedPercent}%</p>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-sky-400 transition-all" style={{ width: `${completedPercent}%` }} />
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-white/55">
                    {workoutsRemaining === 0
                      ? "Meta semanal concluída. Mantenha o padrão até o fechamento da semana."
                      : `${workoutsRemaining} treino(s) restante(s) para bater sua meta semanal.`}
                  </p>
                  <p className="mt-2 text-[10px] uppercase tracking-widest text-white/35">
                    Última atualização: {formatDateTime(snapshot.profileUpdatedAt)}
                  </p>
                </article>
              </>
            )}

            {activeTab === "plano" && (
              <>
                {planSteps.map(step => (
                  <article key={step.id} className="rounded-xl border border-white/10 bg-[#050B14] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-black text-white">{step.title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-white/55">{step.detail}</p>
                      </div>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-widest ${
                          step.done
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                            : "border-amber-500/20 bg-amber-500/10 text-amber-300"
                        }`}
                      >
                        {step.done ? "Concluído" : "Pendente"}
                      </span>
                    </div>
                    {step.onAction && (
                      <button
                        type="button"
                        onClick={step.onAction}
                        className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-[9px] font-black uppercase tracking-widest text-white/65 transition hover:text-white"
                      >
                        {step.actionLabel}
                        <ArrowRight size={12} />
                      </button>
                    )}
                  </article>
                ))}
              </>
            )}

            {activeTab === "entender" && (
              <>
                {guideCards.map(guide => {
                  const expanded = openGuide === guide.id;
                  return (
                    <article key={guide.id} className="rounded-xl border border-white/10 bg-[#050B14] p-4">
                      <button
                        type="button"
                        onClick={() => setOpenGuide(current => (current === guide.id ? current : guide.id))}
                        className="flex w-full items-center justify-between gap-3 text-left"
                      >
                        <div>
                          <p className="text-sm font-black text-white">{guide.title}</p>
                          <p className="mt-1 text-xs text-white/50">{guide.summary}</p>
                        </div>
                        <ChevronDown
                          size={14}
                          className={`text-sky-300 transition-transform ${expanded ? "rotate-180" : ""}`}
                        />
                      </button>
                      {expanded && (
                        <p className="mt-3 text-xs leading-relaxed text-white/60">
                          {guide.body}
                        </p>
                      )}
                    </article>
                  );
                })}
                <article className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-300" />
                    <p className="text-xs leading-relaxed text-amber-100/85">
                      Use esta aba como painel de acompanhamento. Para avaliação clínica ou diagnóstico, mantenha apoio
                      profissional presencial.
                    </p>
                  </div>
                </article>
              </>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

