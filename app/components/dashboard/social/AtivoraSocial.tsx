"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { SocialOnboarding } from "./SocialOnboarding";
import { AtivoraFeed } from "./AtivoraFeed";
import { SocialProfile } from "./SocialProfile";

// --- INTERFACE ATUALIZADA COM HIERARQUIA ---
export interface UserProfileData {
  username: string;
  bio: string;
  description: string;
  avatar: string | null;
  role: 'aluno' | 'personal' | 'nutri' | 'estagiario' | 'influencer'; 
  is_verified: boolean;
}

type SocialView = 'onboarding' | 'feed' | 'profile' | 'messages';

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

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (isGuest) {
        // Inicializa o visitante como 'aluno' por padrão
        setUserProfile({ 
          username: "Visitante", 
          bio: "Modo visualização", 
          description: "", 
          avatar: null,
          role: 'aluno',
          is_verified: false 
        });
        setCurrentSocialView('feed');
        setIsLoading(false);
        return;
      }

      const savedProfile = localStorage.getItem('@ativora_profile');
      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile);
        try {
          const response = await fetch(`/api/perfil/buscar?username=${parsedProfile.username}`);
          if (response.ok) {
            setUserProfile(parsedProfile);
            setCurrentSocialView(initialRoute === 'profile' ? 'profile' : 'feed');
          } else if (response.status === 404) {
            localStorage.removeItem('@ativora_profile');
            setUserProfile(null);
            setCurrentSocialView('onboarding');
          } else {
            setUserProfile(parsedProfile);
            setCurrentSocialView(initialRoute === 'profile' ? 'profile' : 'feed');
          }
        } catch {
          setUserProfile(parsedProfile);
          setCurrentSocialView(initialRoute === 'profile' ? 'profile' : 'feed');
        }
      } else {
        setCurrentSocialView('onboarding');
      }
      setIsLoading(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [initialRoute, isGuest]);

  const handleProfileCreated = (data: UserProfileData) => {
    setUserProfile(data);
    localStorage.setItem('@ativora_profile', JSON.stringify(data));
    setCurrentSocialView('feed');
  };

  const handleProfileUpdated = (data: UserProfileData) => {
    setUserProfile(data);
    localStorage.setItem('@ativora_profile', JSON.stringify(data));
  };

  if (isLoading) return <div className="flex items-center justify-center h-full text-sky-500 font-black italic uppercase tracking-widest">Sincronizando...</div>;

  return (
    <div className="w-full min-h-full">
      <AnimatePresence mode="wait">
        {currentSocialView === 'onboarding' && (
          <SocialOnboarding key="onboarding" onFinish={handleProfileCreated} onBack={onBack} />
        )}
        {currentSocialView === 'feed' && userProfile && (
          <AtivoraFeed 
            key="feed" 
            currentUser={userProfile}
            isGuest={isGuest}
            onViewProfile={() => isGuest ? alert("Crie uma conta para acessar seu perfil!") : setCurrentSocialView('profile')}
            onOpenMessages={() => isGuest ? alert("Crie uma conta para enviar mensagens!") : setCurrentSocialView('messages')}
          />
        )}
        {currentSocialView === 'profile' && userProfile && (
          <SocialProfile 
            key="profile" 
            profileData={userProfile}
            onBack={() => setCurrentSocialView('feed')} 
            startInEditMode={openEditMode} 
            onProfileUpdate={handleProfileUpdated} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};