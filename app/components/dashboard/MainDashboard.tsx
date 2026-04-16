"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import { BossPanelView } from "./views/BossPanelView";
import { ProfileView } from "./views/ProfileView";

// --- TIPAGENS ---
export type ViewState = 'home' | 'social' | 'treinos' | 'metricas' | 'config' | 'comunidades' | 'nutricao' | 'ajuda' | 'sugestoes' | 'boss' | 'perfil';

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
}

export default function MainDashboard() {
  const { data: session, status } = useSession();

  // -- ESTADOS DE NAVEGAÇÃO --
  const [currentView, setCurrentViewState] = useState<ViewState>('home');
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);
  const [socialRoute, setSocialRoute] = useState<'feed' | 'profile' | 'messages'>('feed');
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [deepLink, setDeepLink] = useState<{ communityId: string, tab: string } | null>(null);

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
    } else if (status === 'unauthenticated' && !isGuestMode) {
      setHasProfile(false);
    }
  }, [session, status, isGuestMode]);

  // -- LOGICA DE NOTIFICAÇÕES --
  const addNotification = useCallback((notif: Omit<INotification, 'id' | 'isRead'>) => {
    const newNotif: INotification = {
      ...notif,
      id: Math.random().toString(36).substr(2, 9),
      isRead: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  const handleNotificationClick = useCallback((notif: INotification) => {
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
    fetch('/api/social/notificacoes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: userProfile?.nickname, userId: userProfile?.id, id: notif.id })
    }).catch(() => null);

    if ((notif.type === 'treino' || notif.type === 'comunidade') && notif.targetId) {
      setDeepLink({ communityId: notif.targetId, tab: notif.targetTab || 'home' });
      setCurrentView('comunidades');
    } else if (notif.type === 'social') {
      setSocialRoute(notif.rawType === 'message' ? 'messages' : 'feed');
      setCurrentView('social');
    }
  }, [userProfile?.nickname]);

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
    nickname: "GUEST", id: "000", avatar: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100", role: "aluno", streak: 0
  };

  const loadDashboardNotifications = useCallback(async () => {
    if (!displayUser.nickname || displayUser.nickname === "GUEST") {
      setNotifications([]);
      return;
    }

    try {
      const response = await fetch(`/api/social/notificacoes?username=${encodeURIComponent(displayUser.nickname)}&userId=${encodeURIComponent(displayUser.id || "")}`, {
        cache: 'no-store'
      });
      if (!response.ok) return;

      const data = await response.json();
      if (Array.isArray(data)) setNotifications(data);
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
        <main className={`min-w-0 flex-1 overflow-y-auto overflow-x-hidden w-full custom-scrollbar z-10 relative text-left ${currentView === 'social' ? 'h-full' : 'p-6 lg:p-14 pb-36'}`}>
          <AnimatePresence mode="wait">

            {currentView === 'home' && (
              <HomeView
                hasProfile={hasProfile}
                currentUser={displayUser}
                setCurrentView={setCurrentView}
                onStartWorkout={handleStartWorkout}
                setSocialRoute={setSocialRoute}
                setIsGuestMode={setIsGuestMode}
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
              <SimpleDashboardView
                mode="metricas"
                onBack={() => setCurrentView('home')}
                onSuggestions={() => setCurrentView('sugestoes')}
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
                isGuest={isGuestMode} 
                initialRoute={socialRoute} 
                {...({ onNotify: addNotification } as any)} 
              />
            )}

            {currentView === 'comunidades' && (
              <motion.div key="comunidades" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full text-left">
                <div className="max-w-6xl mx-auto px-4 mb-4">
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
