"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
// AQUI ESTAVA O ERRO: Adicionadas as chaves { } para importar corretamente
import { AtivoraFeed } from "./AtivoraFeed"; 
import { SocialProfile } from "./SocialProfile";

interface UserProfile {
  username: string;
  avatar?: string | null;
  avatar_url?: string | null;
  foto_url?: string | null;
  role?: string;
  xp?: number;
  nivel?: number;
  streak?: number;
  is_verified?: boolean;
}

interface AtivoraSocialProps {
  onBack: () => void;
  initialRoute?: "feed" | "profile" | "messages" | "notifications" | "onboarding";
  isGuest?: boolean;
}

type SocialView = "feed" | "profile" | "messages" | "notifications" | "onboarding";

export const AtivoraSocial = ({
  onBack,
  initialRoute = "feed",
  isGuest = false,
}: AtivoraSocialProps) => {
  const [currentView, setCurrentView] = useState<SocialView>("feed");
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("@ativora_profile");

      if (saved) {
        const parsedUser = JSON.parse(saved) as UserProfile;
        setUser(parsedUser);
        setCurrentView(initialRoute);
      } else if (isGuest) {
        setCurrentView("feed");
      } else {
        setCurrentView("onboarding");
      }
    } catch (error) {
      console.error("Erro ao carregar perfil local:", error);
      setUser(null);
      setCurrentView(isGuest ? "feed" : "onboarding");
    }
  }, [initialRoute, isGuest]);

  const safeUser: UserProfile = user ?? {
    username: "Guest",
    avatar: null,
    avatar_url: null,
    foto_url: null,
    xp: 0,
    nivel: 1,
    streak: 0,
    is_verified: false,
  };

  const profileImage =
    safeUser.avatar ||
    safeUser.avatar_url ||
    safeUser.foto_url ||
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100";

  return (
    <div className="flex flex-col h-full bg-[#010307] text-white font-sans">
      <header className="w-full max-w-4xl mx-auto px-6 py-8 flex items-center justify-between border-b border-white/5">
        <div className="flex flex-col text-left cursor-pointer" onClick={onBack}>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-sky-500 leading-none">
            ATIVORA
          </h1>
          <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 mt-1.5">
            PROTOCOLO CENTRAL
          </span>
        </div>

        <div
          className="relative cursor-pointer"
          onClick={() => setCurrentView("profile")}
        >
          <div className="w-13 h-13 rounded-2xl bg-linear-to-br from-sky-500 to-purple-600 p-0.5 shadow-[0_0_15px_rgba(14,165,233,0.3)] transition-transform hover:scale-105">
            <div className="w-full h-full rounded-[14px] bg-[#010307] overflow-hidden">
              <img
                src={profileImage}
                alt="Perfil"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="absolute -bottom-1 -right-1 bg-sky-500 text-black text-[8px] font-[1000] px-2 py-0.5 rounded-full border-2 border-[#010307]">
            LVL {safeUser.nivel || 1}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          {currentView === "feed" && (
            <AtivoraFeed
              currentUser={safeUser}
              isGuest={isGuest}
              onViewProfile={() => setCurrentView("profile")}
              onBack={onBack}
              onOpenMessages={() => setCurrentView("messages")}
              onOpenNotifications={() => setCurrentView("notifications")}
              onOpenUserProfile={(nickname: string) =>
                console.log("Ver perfil:", nickname)
              }
            />
          )}

          {currentView === "profile" && (
            <SocialProfile
              profileData={safeUser}
              isOwnProfile={true}
              onBack={() => setCurrentView("feed")}
              onProfileUpdate={(updatedData: UserProfile) => {
                setUser(updatedData);
                localStorage.setItem(
                  "@ativora_profile",
                  JSON.stringify(updatedData)
                );
              }}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default AtivoraSocial;