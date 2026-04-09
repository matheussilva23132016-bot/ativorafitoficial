"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SocialOnboarding } from "./SocialOnboarding";
import { AtivoraFeed } from "./AtivoraFeed";
import { SocialProfile } from "./SocialProfile";
import { SocialMessages } from "./SocialMessages";
import { SocialNotifications } from "./SocialNotifications";

// --- INTERFACE ATUALIZADA ---
export interface UserProfileData {
  username: string;
  bio: string;
  description: string;
  avatar: string | null;
  role: 'aluno' | 'personal' | 'nutri' | 'estagiario' | 'influencer'; 
  is_verified: boolean;
  is_private?: boolean; 
  xp?: number;
  nivel?: number;
}

type SocialView = 'onboarding' | 'feed' | 'profile' | 'messages' | 'notifications';

interface AtivoraSocialProps {
  onBack: () => void;
  initialRoute?: 'feed' | 'profile';
  openEditMode?: boolean;
  isGuest?: boolean;
}

export const AtivoraSocial = ({ onBack, initialRoute, openEditMode, isGuest }: AtivoraSocialProps) => {
  const [currentSocialView, setCurrentSocialView] = useState<SocialView>('onboarding');
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notificacoes, setNotificacoes] = useState<any[]>([]);

  const [viewingTarget, setViewingTarget] = useState<string | null>(null);
  const [targetProfileData, setTargetProfileData] = useState<UserProfileData | null>(null);

  const fetchNotificacoes = useCallback(async () => {
    if (!userProfile || isGuest) return;
    try {
      const res = await fetch(`/api/social/notificacoes?username=${userProfile.username}`);
      if (res.ok) setNotificacoes(await res.json());
    } catch { console.error("Falha ao sincronizar alertas."); }
  }, [userProfile, isGuest]);

  // --- PROTOCOLO DE PRIVACIDADE: ALTERAR STATUS DA CONTA ---
  const handlePrivacyToggle = async (isPrivate: boolean) => {
    if (!userProfile) return;
    try {
      const res = await fetch('/api/perfil/privacidade', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: userProfile.username, isPrivate })
      });

      if (res.ok) {
        const updated = { ...userProfile, is_private: isPrivate };
        setUserProfile(updated);
        localStorage.setItem('@ativora_profile', JSON.stringify(updated));
      }
    } catch {
      alert("⚠️ ERRO NA MATRIZ: Falha ao alterar status de privacidade.");
    }
  };

  const handleClearNotifications = async () => {
    if (!userProfile) return;
    try {
      const res = await fetch('/api/social/notificacoes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: userProfile.username })
      });
      if (res.ok) fetchNotificacoes();
    } catch { alert("Erro ao limpar central."); }
  };

  const handleOpenUserProfile = async (nickname: string) => {
    if (nickname === userProfile?.username) {
      setViewingTarget(null);
      setCurrentSocialView('profile');
      return;
    }
    try {
      const res = await fetch(`/api/perfil/publico?nickname=${nickname}&viewer=${userProfile?.username}`);
      if (res.ok) {
        const data = await res.json();
        setTargetProfileData(data);
        setViewingTarget(nickname);
        setCurrentSocialView('profile');
      }
    } catch {
      alert("⚠️ ERRO DE SINCRONIZAÇÃO: Não foi possível localizar o atleta.");
    }
  };

  useEffect(() => {
    const syncMatrix = async () => {
      if (isGuest) {
        setUserProfile({ 
          username: "Visitante", bio: "Modo visualização ativa", 
          description: "Acesso limitado aos dados públicos.", 
          avatar: null, role: 'aluno', is_verified: false, is_private: false 
        });
        setCurrentSocialView('feed');
        setIsLoading(false);
        return;
      }

      const savedProfile = localStorage.getItem('@ativora_profile');
      if (savedProfile) {
        const localData = JSON.parse(savedProfile);
        setUserProfile(localData);
        setCurrentSocialView(initialRoute === 'profile' ? 'profile' : 'feed');
        setIsLoading(false);

        try {
          const response = await fetch(`/api/perfil/buscar?username=${localData.username}`);
          if (response.ok) {
            const serverData = await response.json();
            setUserProfile(serverData);
            localStorage.setItem('@ativora_profile', JSON.stringify(serverData));
          }
        } catch (err) { console.warn("Operando em modo cache."); }
      } else {
        setCurrentSocialView('onboarding');
        setIsLoading(false);
      }
    };
    syncMatrix();
  }, [initialRoute, isGuest]);

  useEffect(() => {
    if (currentSocialView === 'notifications') fetchNotificacoes();
  }, [currentSocialView, fetchNotificacoes]);

  const handleProfileCreated = (data: UserProfileData) => {
    localStorage.setItem('@ativora_profile', JSON.stringify(data));
    setUserProfile(data);
    setCurrentSocialView('feed');
  };

  const handleProfileUpdated = (data: UserProfileData) => {
    setUserProfile(data);
    localStorage.setItem('@ativora_profile', JSON.stringify(data));
  };

  const handleGuestAction = (actionLabel: string, callback: () => void) => {
    if (isGuest) {
      alert(`ACESSO NEGADO: Crie uma conta real para ${actionLabel}.`);
      return;
    }
    callback();
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-full bg-[#010307]">
      <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4" />
      <div className="text-sky-500 font-black italic uppercase tracking-[0.3em] animate-pulse">Iniciando Protocolo...</div>
    </div>
  );

  return (
    <div className="w-full min-h-full bg-[#010307] text-[#F8FAFC]">
      <AnimatePresence mode="wait">
        {currentSocialView === 'onboarding' && (
          <motion.div key="onboarding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
            <SocialOnboarding onFinish={handleProfileCreated} onBack={onBack} />
          </motion.div>
        )}

        {currentSocialView === 'feed' && userProfile && (
          <motion.div key="feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
            <AtivoraFeed 
              currentUser={userProfile}
              isGuest={isGuest}
              onViewProfile={() => { setViewingTarget(null); setCurrentSocialView('profile'); }}
              onOpenMessages={() => handleGuestAction("enviar mensagens", () => setCurrentSocialView('messages'))}
              onOpenNotifications={() => setCurrentSocialView('notifications')}
              onOpenUserProfile={handleOpenUserProfile}
              onBack={onBack}
            />
          </motion.div>
        )}

        {currentSocialView === 'profile' && userProfile && (
          <motion.div key="profile" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} className="h-full">
            <SocialProfile 
              profileData={viewingTarget ? (targetProfileData || userProfile) : userProfile}
              onBack={() => { setViewingTarget(null); setCurrentSocialView('feed'); }} 
              startInEditMode={viewingTarget ? false : openEditMode} 
              onProfileUpdate={handleProfileUpdated} 
              isOwnProfile={!viewingTarget}
              // @ts-ignore - Bypass necessário para a prop de privacidade
              onPrivacyToggle={handlePrivacyToggle}
            />
          </motion.div>
        )}

        {currentSocialView === 'messages' && userProfile && (
          <motion.div key="messages" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
            <SocialMessages 
              currentUser={userProfile} 
              onBack={() => setCurrentSocialView('feed')} 
            />
          </motion.div>
        )}

        {currentSocialView === 'notifications' && (
          <motion.div key="notifications" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full">
            <SocialNotifications 
              data={notificacoes}
              onBack={() => setCurrentSocialView('feed')}
              onMarkAsRead={handleClearNotifications}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};