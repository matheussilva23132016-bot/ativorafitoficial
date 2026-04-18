"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSession, signOut } from "next-auth/react";

// Layout & UI
import { DashboardSidebar } from "./layout/DashboardSidebar";
import { DashboardHeader } from "./layout/DashboardHeader";
import { DashboardBottomNav } from "./layout/DashboardBottomNav";

// Views
import { HomeView } from "./views/HomeView";
import { AtivoraSocial } from "./social/AtivoraSocial";
import { CommunityList } from "./comunidades/CommunityList";
import { WorkoutExecutionView } from "./views/WorkoutExecutionView";
import { WorkoutHubView } from "./views/WorkoutHubView";
import { NutritionView } from "./views/NutritionView";
import { HelpView } from "./views/HelpView";
import { SuggestionsView } from "./views/SuggestionsView";
import { SimpleDashboardView } from "./views/SimpleDashboardView";
import { EvolutionView } from "./views/EvolutionView";
import { BossPanelView } from "./views/BossPanelView";
import { ProfileView } from "./views/ProfileView";

// --- TIPAGENS ---
export type ViewState = 'home' | 'social' | 'treinos' | 'metricas' | 'config' | 'comunidades' | 'nutricao' | 'ajuda' | 'sugestoes' | 'boss' | 'perfil';
type SocialRoute = 'feed' | 'profile' | 'messages';

export interface INotification {
  id: string;
  title: string;
  message: string;
  type: 'treino' | 'social' | 'comunidade';
  targetId?: string;
  targetTab?: string;
  isRead: boolean;
  rawType?: string;
  timestamp?: string;
  sourceView?: ViewState;
  sourceLabel?: string;
  socialRoute?: SocialRoute;
}

type NotificationDestination = {
  view: ViewState;
  socialRoute?: SocialRoute;
  communityId?: string;
  communityTab?: string;
};

type DashboardHistoryState = {
  __ativorafit_dashboard__: true;
  view: ViewState;
  socialRoute: SocialRoute;
  communityId: string | null;
  communityTab: string | null;
  workoutId: string | null;
};

const isViewState = (value: unknown): value is ViewState =>
  value === "home" ||
  value === "social" ||
  value === "treinos" ||
  value === "metricas" ||
  value === "config" ||
  value === "comunidades" ||
  value === "nutricao" ||
  value === "ajuda" ||
  value === "sugestoes" ||
  value === "boss" ||
  value === "perfil";

const VIEW_LABELS: Record<ViewState, string> = {
  home: "Painel",
  social: "Social",
  treinos: "Treinos",
  metricas: "Evolução",
  config: "Ajustes",
  comunidades: "Comunidades",
  nutricao: "Nutrição",
  ajuda: "Ajuda",
  sugestoes: "Sugestões",
  boss: "Boss",
  perfil: "Meu Perfil",
};

const SOCIAL_ROUTE_BY_RAW_TYPE: Record<string, SocialRoute> = {
  message: "messages",
  comment: "feed",
  like: "feed",
  follow: "profile",
};

const COMMUNITY_TAB_BY_RAW_TYPE: Record<string, string> = {
  aviso_comunidade: "avisos",
  novo_anuncio: "avisos",
  solicitacao_entrada: "gestao",
  entrada_aprovada: "geral",
  entrada_recusada: "geral",
  solicitacao_treino: "treinos",
  novo_treino: "treinos",
  solicitacao_nutri: "nutricao",
  solicitacao_nutricao: "nutricao",
  solicitacao_nutricional: "nutricao",
  novo_cardapio: "nutricao",
  cardapio_publicado: "nutricao",
  chat_treino: "treinos",
  chat_nutricao: "nutricao",
  novo_desafio: "desafios",
  entrega_desafio: "desafios",
  desafio_aprovar: "desafios",
  desafio_aprovado: "desafios",
  desafio_reprovar: "desafios",
  desafio_reprovado: "desafios",
  desafio_reenvio: "desafios",
  subiu_ranking: "ranking",
  novo_selo: "ranking",
};

const VALID_COMMUNITY_TABS = new Set([
  "geral",
  "treinos",
  "nutricao",
  "desafios",
  "ranking",
  "avisos",
  "evolucao",
  "gestao",
]);

const normalizeSocialRoute = (value?: unknown): SocialRoute | undefined => {
  const route = String(value || "").trim().toLowerCase();
  if (route === "feed" || route === "profile" || route === "messages") return route;
  return undefined;
};

const normalizeCommunityTab = (targetTab?: unknown, rawType?: unknown): string => {
  const target = String(targetTab || "").trim().toLowerCase();
  if (target === "home" || target === "overview" || target === "dashboard") return "geral";
  if (target === "announcements") return "avisos";
  if (VALID_COMMUNITY_TABS.has(target)) return target;

  const raw = String(rawType || "").trim().toLowerCase();
  return COMMUNITY_TAB_BY_RAW_TYPE[raw] || "geral";
};

const normalizeNotificationType = (type: unknown, rawType: string): INotification["type"] => {
  if (type === "social" || type === "treino" || type === "comunidade") return type;
  if (rawType.includes("treino")) return "treino";

  if (
    rawType.includes("comunidade") ||
    rawType.includes("desafio") ||
    rawType.includes("cardapio") ||
    rawType.includes("solicitacao") ||
    rawType.includes("entrada") ||
    rawType.includes("aviso") ||
    rawType.includes("ranking")
  ) {
    return "comunidade";
  }

  return "social";
};

const resolveSourceView = (notif: Pick<INotification, "type" | "targetId" | "rawType">): ViewState => {
  const rawType = String(notif.rawType || "").trim().toLowerCase();

  if (rawType === "boss_broadcast") return "home";
  if (notif.type === "social") return "social";
  if (notif.type === "comunidade") return "comunidades";
  if (notif.type === "treino") return notif.targetId ? "comunidades" : "treinos";

  return "home";
};

const normalizeDashboardNotification = (input: Partial<INotification>): INotification => {
  const rawType = String(input.rawType || "").trim().toLowerCase();
  const type = normalizeNotificationType(input.type, rawType);
  const targetId = input.targetId ? String(input.targetId) : undefined;
  const targetTab = normalizeCommunityTab(input.targetTab, rawType);
  const socialRoute = normalizeSocialRoute(input.socialRoute) || SOCIAL_ROUTE_BY_RAW_TYPE[rawType];
  const sourceView = input.sourceView || resolveSourceView({ type, targetId, rawType });
  const sourceLabel = input.sourceLabel || VIEW_LABELS[sourceView];

  return {
    id: String(input.id || Math.random().toString(36).slice(2, 11)),
    title: String(input.title || "Nova notificação"),
    message: String(input.message || "Você recebeu uma atualização."),
    type,
    targetId,
    targetTab,
    isRead: input.isRead === true,
    rawType: rawType || undefined,
    timestamp: input.timestamp ? String(input.timestamp) : undefined,
    sourceView,
    sourceLabel,
    socialRoute,
  };
};

const resolveNotificationDestination = (notif: INotification): NotificationDestination => {
  const rawType = String(notif.rawType || "").trim().toLowerCase();
  const communityTab = normalizeCommunityTab(notif.targetTab, rawType);

  if (rawType === "boss_broadcast") {
    return { view: "home" };
  }

  if (notif.type === "social") {
    return {
      view: "social",
      socialRoute: notif.socialRoute || SOCIAL_ROUTE_BY_RAW_TYPE[rawType] || "feed",
    };
  }

  if ((notif.type === "comunidade" || notif.type === "treino") && notif.targetId) {
    return {
      view: "comunidades",
      communityId: notif.targetId,
      communityTab,
    };
  }

  if (notif.type === "treino") {
    return { view: "treinos" };
  }

  if (notif.type === "comunidade") {
    return { view: "comunidades" };
  }

  return { view: "home" };
};

export default function MainDashboard() {
  const { data: session, status } = useSession();

  // -- ESTADOS DE NAVEGAÇÃO --
  const [currentView, setCurrentViewState] = useState<ViewState>('home');
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);
  const [socialRoute, setSocialRoute] = useState<SocialRoute>('feed');
  const [deepLink, setDeepLink] = useState<{ communityId: string, tab: string } | null>(null);
  const skipNextHistoryPushRef = useRef(false);
  const historyBootstrappedRef = useRef(false);

  // -- ESTADOS DE DADOS --
  const [hasProfile, setHasProfile] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [bossAccess, setBossAccess] = useState<any>(null);
  const [restrictedScopes, setRestrictedScopes] = useState<string[]>([]);
  const sessionUser = session?.user as any;
  const ownerNickname = String(userProfile?.nickname || sessionUser?.nickname || "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
  const ownerEmail = String(sessionUser?.email || "").trim().toLowerCase();
  const bossOwnerFallback =
    ownerNickname === "teteuziin555" || ownerEmail === "matheussilva23132016@gmail.com"
      ? {
          level: "owner",
          canCreateUsers: true,
          canBanUsers: true,
          canGrantAccess: true,
          canRunSql: true,
        }
      : null;
  const effectiveBossAccess = bossAccess || bossOwnerFallback;
  const canUseBossPanel = Boolean(effectiveBossAccess);

  const setCurrentView = useCallback((view: ViewState) => {
    const scopeByView: Partial<Record<ViewState, string>> = {
      social: "social",
      comunidades: "comunidades",
      treinos: "treinos",
      nutricao: "nutricao",
    };
    const scope = scopeByView[view];

    if (scope && restrictedScopes.includes(scope)) {
      window.alert("Seu acesso a esta área está restrito no momento.");
      return;
    }

    setCurrentViewState(view);
  }, [restrictedScopes]);

  const buildHistoryState = useCallback(
    (): DashboardHistoryState => ({
      __ativorafit_dashboard__: true,
      view: currentView,
      socialRoute,
      communityId: deepLink?.communityId ?? null,
      communityTab: deepLink?.tab ?? null,
      workoutId: activeWorkoutId ?? null,
    }),
    [activeWorkoutId, currentView, deepLink?.communityId, deepLink?.tab, socialRoute],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onPopState = (event: PopStateEvent) => {
      const state = event.state as DashboardHistoryState | null;
      if (!state?.__ativorafit_dashboard__) return;

      skipNextHistoryPushRef.current = true;
      setSocialRoute(normalizeSocialRoute(state.socialRoute) || "feed");
      setDeepLink(
        state.communityId
          ? { communityId: state.communityId, tab: state.communityTab || "geral" }
          : null,
      );
      setActiveWorkoutId(state.workoutId ?? null);
      setCurrentViewState(isViewState(state.view) ? state.view : "home");
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const state = buildHistoryState();

    if (!historyBootstrappedRef.current) {
      historyBootstrappedRef.current = true;
      window.history.replaceState(state, "");
      return;
    }

    if (skipNextHistoryPushRef.current) {
      skipNextHistoryPushRef.current = false;
      window.history.replaceState(state, "");
      return;
    }

    window.history.pushState(state, "");
  }, [buildHistoryState]);

  // -- LOGICA DE USUÁRIO --
  useEffect(() => {
    if (session?.user) {
      setHasProfile(true);
      const sUser = session.user as any;
      setUserProfile({
        id:       sUser.id       ?? "001",
        nickname: sUser.nickname ?? sUser.name ?? "ATLETA",
        avatar:   sUser.image    ?? "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100",
        role:     sUser.role     ?? "aluno",
        streak:   0,
      });
    } else if (status === 'unauthenticated') {
      setHasProfile(false);
    }
  }, [session, status]);

  // -- LOGICA DE NOTIFICAÇÕES --
  const addNotification = useCallback((notif: Omit<INotification, 'id' | 'isRead'>) => {
    const newNotif = normalizeDashboardNotification({
      ...notif,
      id: Math.random().toString(36).slice(2, 11),
      isRead: false,
    });
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  const handleNotificationClick = useCallback((notif: INotification) => {
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
    fetch('/api/social/notificacoes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: userProfile?.nickname, userId: userProfile?.id, id: notif.id })
    }).catch(() => null);

    const destination = resolveNotificationDestination(notif);

    if (destination.view === 'social') {
      setDeepLink(null);
      setSocialRoute(destination.socialRoute || 'feed');
      setCurrentView('social');
      return;
    }

    if (destination.view === 'comunidades') {
      if (destination.communityId) {
        setDeepLink({
          communityId: destination.communityId,
          tab: destination.communityTab || 'geral',
        });
      } else {
        setDeepLink(null);
      }
      setCurrentView('comunidades');
      return;
    }

    setDeepLink(null);
    setCurrentView(destination.view);
  }, [userProfile?.nickname, userProfile?.id, setCurrentView]);

  // -- HANDLERS DE TREINO --
  const handleStartWorkout = (workoutId: string) => {
    setActiveWorkoutId(workoutId);
    setCurrentView('treinos');
  };

  const handleWorkoutComplete = async (payload: any) => {
    try {
      const res = await fetch('/api/treinos/execucao/concluir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          userId: userProfile?.id || "001"
        })
      });

      const json = await res.json();
      if (json.success) {
        addNotification({
          title: "Treino concluído",
          message: `Você ganhou ${json.data.xpGained} XP. Sequência atual: ${json.data.newStreak} dias.`,
          type: 'treino'
        });
        setCurrentView('home');
        setActiveWorkoutId(null);
      }
    } catch (err) {
      console.error("Erro ao reportar conclusão:", err);
    }
  };

  const handleLogout = () => {
    if(window.confirm("Deseja sair da sua conta AtivoraFit?")) {
      signOut({ callbackUrl: '/login' });
    }
  };

  const displayUser = userProfile || {
    nickname: "ATLETA",
    id: "",
    avatar: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100",
    role: "aluno",
    streak: 0
  };

  const loadDashboardNotifications = useCallback(async () => {
    if (!displayUser.nickname || !displayUser.id) {
      setNotifications([]);
      return;
    }

    try {
      const response = await fetch(`/api/social/notificacoes?username=${encodeURIComponent(displayUser.nickname)}&userId=${encodeURIComponent(displayUser.id || "")}`, {
        cache: 'no-store'
      });
      if (!response.ok) return;

      const data = await response.json();
      if (Array.isArray(data)) {
        setNotifications(data.map((item: any) => normalizeDashboardNotification(item)));
      }
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
    }
  }, [displayUser.id, displayUser.nickname]);

  useEffect(() => {
    loadDashboardNotifications();
    const interval = window.setInterval(loadDashboardNotifications, 15000);
    return () => window.clearInterval(interval);
  }, [loadDashboardNotifications]);

  useEffect(() => {
    if (!userProfile?.id) {
      setBossAccess(null);
      return;
    }

    let alive = true;

    fetch('/api/boss/me', { cache: 'no-store' })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (alive) setBossAccess(data?.canAccess ? data.access : null);
      })
      .catch(() => {
        if (alive) setBossAccess(null);
      });

    return () => {
      alive = false;
    };
  }, [userProfile?.id]);

  useEffect(() => {
    if (!userProfile?.id) {
      setRestrictedScopes([]);
      return;
    }

    let alive = true;

    fetch('/api/boss/restrictions', { cache: 'no-store' })
      .then(res => res.ok ? res.json() : { scopes: [] })
      .then(data => {
        if (alive) setRestrictedScopes(Array.isArray(data?.scopes) ? data.scopes : []);
      })
      .catch(() => {
        if (alive) setRestrictedScopes([]);
      });

    return () => {
      alive = false;
    };
  }, [userProfile?.id]);

  useEffect(() => {
    const scopeByView: Partial<Record<ViewState, string>> = {
      social: "social",
      comunidades: "comunidades",
      treinos: "treinos",
      nutricao: "nutricao",
    };
    const scope = scopeByView[currentView];

    if (scope && restrictedScopes.includes(scope)) {
      setCurrentViewState('home');
    }
  }, [currentView, restrictedScopes]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="flex flex-col lg:flex-row h-dvh bg-[#010307] text-[#F8FAFC] overflow-hidden font-sans text-left"
    >
      
      {/* SIDEBAR DESKTOP */}
      {currentView !== 'social' && (
        <DashboardSidebar
          currentView={currentView}
          setCurrentView={setCurrentView}
          onLogout={handleLogout}
          setDeepLink={setDeepLink}
          canBossPanel={canUseBossPanel}
        />
      )}

      <div className="min-w-0 flex-1 flex flex-col h-full relative overflow-hidden bg-[#010307]">
        
        {/* HEADER - Oculto em Social para evitar cabeçalho duplo */}
        {currentView !== 'social' && (
          <DashboardHeader
            currentUser={displayUser}
            notifications={notifications}
            onNotificationClick={handleNotificationClick}
            setCurrentView={setCurrentView}
            canBossPanel={canUseBossPanel}
          />
        )}

        {/* CONTEÚDO PRINCIPAL (VIEWS) */}
        <main className={`min-w-0 flex-1 overflow-y-auto overflow-x-hidden w-full custom-scrollbar z-10 relative text-left ${currentView === 'social' ? 'h-full' : 'px-3 pt-3 pb-24 sm:px-4 sm:pt-4 sm:pb-28 lg:px-14 lg:pt-8 lg:pb-16'}`}>
          <AnimatePresence mode="wait">

            {currentView === 'home' && (
              <HomeView
                hasProfile={hasProfile}
                currentUser={displayUser}
                setCurrentView={setCurrentView}
                onStartWorkout={handleStartWorkout}
                canBossPanel={canUseBossPanel}
              />
            )}

            {currentView === 'nutricao' && (
              <NutritionView
                onBack={() => setCurrentView('home')}
                currentUser={displayUser}
                onOpenCommunities={() => setCurrentView('comunidades')}
              />
            )}

            {currentView === 'treinos' && activeWorkoutId && (
              <WorkoutExecutionView
                treinoId={activeWorkoutId}
                onClose={() => { setCurrentView('home'); setActiveWorkoutId(null); }}
                onComplete={handleWorkoutComplete}
              />
            )}

            {currentView === 'treinos' && !activeWorkoutId && (
              <WorkoutHubView
                onBack={() => setCurrentView('home')}
                onOpenCommunities={() => setCurrentView('comunidades')}
              />
            )}

            {currentView === 'metricas' && (
              <EvolutionView
                onBack={() => setCurrentView('home')}
                onSuggestions={() => setCurrentView('sugestoes')}
                currentUser={displayUser}
                onOpenProfile={() => setCurrentView('perfil')}
                onOpenTreinos={() => setCurrentView('treinos')}
                onOpenCommunities={() => setCurrentView('comunidades')}
              />
            )}

            {currentView === 'config' && (
              <SimpleDashboardView
                mode="config"
                onBack={() => setCurrentView('home')}
                onSuggestions={() => setCurrentView('sugestoes')}
              />
            )}

            {currentView === 'ajuda' && (
              <HelpView
                onBack={() => setCurrentView('home')}
                onNavigate={(view, options) => {
                  if (options?.socialRoute) setSocialRoute(options.socialRoute);
                  setCurrentView(view as ViewState);
                }}
              />
            )}

            {currentView === 'sugestoes' && (
              <SuggestionsView
                onBack={() => setCurrentView('home')}
                currentUser={displayUser}
              />
            )}

            {currentView === 'perfil' && (
              <ProfileView
                onBack={() => setCurrentView('home')}
                currentUser={displayUser}
              />
            )}

            {currentView === 'boss' && canUseBossPanel && (
              <BossPanelView
                onBack={() => setCurrentView('home')}
                currentUser={displayUser}
                bossAccess={effectiveBossAccess}
              />
            )}

            {currentView === 'boss' && !canUseBossPanel && (
              <SimpleDashboardView
                mode="config"
                onBack={() => setCurrentView('home')}
                onSuggestions={() => setCurrentView('sugestoes')}
              />
            )}
            
            {currentView === 'social' && (
              <AtivoraSocial 
                onBack={() => { setCurrentView('home'); setSocialRoute('feed'); }} 
                isGuest={false} 
                initialRoute={socialRoute} 
                {...({ onNotify: addNotification } as any)} 
              />
            )}

            {currentView === 'comunidades' && (
              <motion.div key="comunidades" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full text-left">
                <div className="max-w-6xl mx-auto px-0 mb-2 sm:mb-3">
                  <button
                    onClick={() => { setCurrentView('home'); setDeepLink(null); }}
                    className="text-white/40 hover:text-sky-500 text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2"
                  >
                    Voltar
                  </button>
                </div>
                <CommunityList 
                   currentUser={displayUser}
                   initialDeepLink={deepLink} 
                   onClearDeepLink={() => setDeepLink(null)} 
                   {...({ onNotify: addNotification } as any)} 
                />
              </motion.div>
            )}

          </AnimatePresence>
        </main>

        {/* COMPONENTES FLUTUANTES & NAVEGAÇÃO - Oculto em Social para evitar menu duplo no mobile */}
        {currentView !== 'social' && (
          <DashboardBottomNav
            currentView={currentView}
            setCurrentView={setCurrentView}
            setDeepLink={setDeepLink}
            canBossPanel={canUseBossPanel}
          />
        )}

      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(14, 165, 233, 0.2); border-radius: 10px; }
        .shadow-neon { filter: drop-shadow(0 0 8px rgba(14, 165, 233, 0.6)); }
      `}</style>
    </motion.div>
  );
}
